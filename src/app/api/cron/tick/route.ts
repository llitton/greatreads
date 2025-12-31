import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Unified cron dispatcher - runs every 15 minutes
 * Dispatches to individual jobs based on timing logic
 *
 * Jobs:
 * - RSS fetch: runs at 12:00 UTC
 * - Cover backfill: runs at 06:00 UTC
 * - (Legacy poll is disabled)
 */

export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Job configuration: hour (UTC) when each job should run
const JOB_SCHEDULE = {
  rssFetch: 12, // 12:00 UTC
  coverBackfill: 6, // 06:00 UTC
};

// Track last run in memory for this instance
// In production, you'd use DB/Redis, but for daily jobs this is fine
const lastRun: Record<string, number> = {};

function shouldRunJob(jobName: string, targetHour: number): boolean {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Only run during the target hour
  if (currentHour !== targetHour) {
    return false;
  }

  // Check if we already ran today
  const lastRunKey = `${jobName}:${today}`;
  if (lastRun[lastRunKey]) {
    return false;
  }

  // Mark as run
  lastRun[lastRunKey] = Date.now();

  // Cleanup old entries (keep last 7 days)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const key in lastRun) {
    if (lastRun[key] < cutoff) {
      delete lastRun[key];
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    jobsRun: [] as string[],
    jobsSkipped: [] as string[],
  };

  try {
    // ═══════════════════════════════════════════════════════════════════
    // RSS Fetch Job
    // ═══════════════════════════════════════════════════════════════════
    if (shouldRunJob('rssFetch', JOB_SCHEDULE.rssFetch)) {
      console.log('[Cron Tick] Running RSS fetch job...');
      results.jobsRun = [...(results.jobsRun as string[]), 'rssFetch'];

      try {
        // Call the RSS fetch endpoint internally
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/rss/cron/fetch`, {
          headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
        });
        results.rssFetch = await res.json();
      } catch (error) {
        results.rssFetch = { error: error instanceof Error ? error.message : 'Failed' };
      }
    } else {
      results.jobsSkipped = [...(results.jobsSkipped as string[]), 'rssFetch'];
    }

    // ═══════════════════════════════════════════════════════════════════
    // Cover Backfill Job
    // ═══════════════════════════════════════════════════════════════════
    if (shouldRunJob('coverBackfill', JOB_SCHEDULE.coverBackfill)) {
      console.log('[Cron Tick] Running cover backfill job...');
      results.jobsRun = [...(results.jobsRun as string[]), 'coverBackfill'];

      try {
        // Call the cover backfill endpoint internally
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/covers/backfill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({ limit: 20, priorityFirst: true }),
        });
        results.coverBackfill = await res.json();
      } catch (error) {
        results.coverBackfill = { error: error instanceof Error ? error.message : 'Failed' };
      }
    } else {
      results.jobsSkipped = [...(results.jobsSkipped as string[]), 'coverBackfill'];
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Tick] Completed in ${duration}ms`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    console.error('[Cron Tick] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cron tick failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
