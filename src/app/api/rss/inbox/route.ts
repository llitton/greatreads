import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RssActionStatus } from '@prisma/client';

/**
 * GET /api/rss/inbox
 * Returns RSS items with user's action status
 *
 * Query params:
 * - filter: 'new' | 'seen' | 'all' (default: 'new')
 * - limit: number (default: 20, max: 50)
 * - cursor: string (for pagination)
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'new';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const cursor = searchParams.get('cursor');

  // Build status filter
  let statusFilter: RssActionStatus[] = [];
  switch (filter) {
    case 'new':
      statusFilter = [RssActionStatus.UNSEEN];
      break;
    case 'seen':
      statusFilter = [RssActionStatus.SEEN];
      break;
    case 'all':
      // Exclude ignored by default
      statusFilter = [RssActionStatus.UNSEEN, RssActionStatus.SEEN, RssActionStatus.SAVED];
      break;
    default:
      statusFilter = [RssActionStatus.UNSEEN];
  }

  try {
    // Get items with actions for this user
    const actions = await prisma.rssItemAction.findMany({
      where: {
        userId: session.user.id,
        status: { in: statusFilter },
      },
      include: {
        item: {
          include: {
            source: {
              select: {
                id: true,
                title: true,
                siteUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to check if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    // Check if there are more items
    const hasMore = actions.length > limit;
    const items = hasMore ? actions.slice(0, limit) : actions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Count unseen for badge
    const unseenCount = await prisma.rssItemAction.count({
      where: {
        userId: session.user.id,
        status: RssActionStatus.UNSEEN,
      },
    });

    // Transform for response
    const responseItems = items.map((action) => ({
      actionId: action.id,
      itemId: action.item.id,
      status: action.status,
      seenAt: action.seenAt,
      savedAt: action.savedAt,
      // Item data
      title: action.item.bookTitle || action.item.title,
      author: action.item.bookAuthor || action.item.author,
      url: action.item.url,
      publishedAt: action.item.publishedAt,
      cleanText: action.item.cleanText,
      coverImageUrl: action.item.coverImageUrl,
      isbn: action.item.isbn,
      // Source data
      source: {
        id: action.item.source.id,
        title: action.item.source.title,
        siteUrl: action.item.source.siteUrl,
      },
    }));

    return NextResponse.json({
      items: responseItems,
      unseenCount,
      nextCursor,
    });
  } catch (error) {
    console.error('Failed to fetch inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rss/inbox/mark-all-seen
 * This is handled by a separate route file
 */
