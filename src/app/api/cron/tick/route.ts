import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified cron dispatcher - runs once daily at 06:00 UTC
 * Runs all background jobs in sequence.
 *
 * Jobs:
 * - RSS fetch: polls RSS sources for new items
 * - Cover backfill: resolves missing book covers
 *
 * Vercel Hobby plan only allows daily crons, so we run everything
 * in a single daily tick.
 */

export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

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
  };

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    // ═══════════════════════════════════════════════════════════════════
    // RSS Fetch Job
    // ═══════════════════════════════════════════════════════════════════
    console.log('[Cron Tick] Running RSS fetch job...');
    (results.jobsRun as string[]).push('rssFetch');

    try {
      const res = await fetch(`${baseUrl}/api/rss/cron/fetch`, {
        headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      });
      results.rssFetch = await res.json();
    } catch (error) {
      results.rssFetch = { error: error instanceof Error ? error.message : 'Failed' };
    }

    // ═══════════════════════════════════════════════════════════════════
    // Cover Backfill Job
    // ═══════════════════════════════════════════════════════════════════
    console.log('[Cron Tick] Running cover backfill job...');
    (results.jobsRun as string[]).push('coverBackfill');

    try {
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
