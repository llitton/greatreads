import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/rss/inbox/sources/:id/retry
 * Trigger a re-check of a source
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify ownership
    const existing = await prisma.rssSource.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Reset to VALIDATING state to trigger re-check
    // Clear error state and reset retry counters
    const source = await prisma.rssSource.update({
      where: { id },
      data: {
        status: 'VALIDATING',
        failureReasonCode: 'NONE',
        lastError: null,
        consecutiveFailures: 0,
        nextAttemptAt: null,
        lastAttemptAt: new Date(),
      },
    });

    // In a production system, this would trigger the fetch cron
    // For now, we just mark it as ready for the next cron run

    return NextResponse.json({
      source,
      message: 'Source queued for re-check',
    });
  } catch (error) {
    console.error('Failed to retry source:', error);
    return NextResponse.json(
      { error: 'Failed to retry source' },
      { status: 500 }
    );
  }
}
