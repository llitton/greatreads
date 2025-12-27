import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RssActionStatus } from '@prisma/client';

/**
 * POST /api/rss/inbox/mark-all-seen
 * Marks all unseen items as seen
 *
 * Body:
 * - sourceId: string (optional, scope to specific source)
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { sourceId } = body;

    // Build where clause
    const whereClause: {
      userId: string;
      status: RssActionStatus;
      item?: { sourceId: string };
    } = {
      userId: session.user.id,
      status: RssActionStatus.UNSEEN,
    };

    if (sourceId) {
      whereClause.item = { sourceId };
    }

    // Update all matching actions
    const result = await prisma.rssItemAction.updateMany({
      where: whereClause,
      data: {
        status: RssActionStatus.SEEN,
        seenAt: new Date(),
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Failed to mark all seen:', error);
    return NextResponse.json(
      { error: 'Failed to mark all seen' },
      { status: 500 }
    );
  }
}
