import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface FeedItem {
  id: string;
  friendName: string;
  eventDate: Date | null;
  reviewText: string | null;
  eventUrl: string | null;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    goodreadsBookUrl: string | null;
  };
  source: 'rss' | 'import';
  createdAt: Date;
  userStatus: 'WANT_TO_READ' | 'READING' | 'READ' | null;
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const filter = searchParams.get('filter'); // 'unread', 'read', 'all'

  // Get user's book statuses for filtering
  const userStatuses = await prisma.userBookStatus.findMany({
    where: { userId: session.user.id },
    select: { bookId: true, status: true },
  });

  const statusMap = new Map(userStatuses.map((s) => [s.bookId, s.status]));
  const readBookIds = userStatuses
    .filter((s) => s.status === 'READ')
    .map((s) => s.bookId);

  // Build where clause based on filter
  let bookFilter = {};
  if (filter === 'unread') {
    bookFilter = {
      bookId: { notIn: readBookIds },
    };
  } else if (filter === 'read') {
    bookFilter = {
      bookId: { in: readBookIds },
    };
  }

  const feedItems: FeedItem[] = [];

  // 1. Get RSS-based events
  const rssEvents = await prisma.friendFiveStarEvent.findMany({
    where: {
      userId: session.user.id,
      ...bookFilter,
    },
    include: {
      book: true,
      friendSource: {
        select: {
          label: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2, // Get more to merge with imports
  });

  for (const event of rssEvents) {
    feedItems.push({
      id: event.id,
      friendName: event.friendSource.label || event.friendName,
      eventDate: event.eventDate,
      reviewText: event.reviewText,
      eventUrl: event.eventUrl,
      book: {
        id: event.book.id,
        title: event.book.title,
        author: event.book.author,
        coverUrl: event.book.coverUrl,
        goodreadsBookUrl: event.book.goodreadsBookUrl,
      },
      source: 'rss',
      createdAt: event.createdAt,
      userStatus: statusMap.get(event.bookId) || null,
    });
  }

  // 2. Get import-based events from followed users
  // Find friend sources that link to actual user accounts
  const importSources = await prisma.friendSource.findMany({
    where: {
      userId: session.user.id,
      sourceUserId: { not: null },
      active: true,
    },
    select: {
      sourceUserId: true,
      label: true,
    },
  });

  if (importSources.length > 0) {
    const sourceUserIds = importSources.map(s => s.sourceUserId).filter(Boolean) as string[];
    const sourceLabels = new Map(importSources.map(s => [s.sourceUserId, s.label]));

    // Get 5-star public books from followed users
    const importedBooks = await prisma.userBookStatus.findMany({
      where: {
        userId: { in: sourceUserIds },
        userRating: 5,
        isPublic: true,
        ...(filter === 'unread' ? { bookId: { notIn: readBookIds } } : {}),
        ...(filter === 'read' ? { bookId: { in: readBookIds } } : {}),
      },
      include: {
        book: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { importedAt: 'desc' },
      take: limit * 2,
    });

    for (const status of importedBooks) {
      feedItems.push({
        id: `import_${status.id}`,
        friendName: sourceLabels.get(status.userId) || status.user.name || 'A friend',
        eventDate: status.dateRead,
        reviewText: null, // Import doesn't include public reviews by default
        eventUrl: null,
        book: {
          id: status.book.id,
          title: status.book.title,
          author: status.book.author,
          coverUrl: status.book.coverUrl,
          goodreadsBookUrl: status.book.goodreadsBookUrl,
        },
        source: 'import',
        createdAt: status.importedAt || status.createdAt,
        userStatus: statusMap.get(status.bookId) || null,
      });
    }
  }

  // Sort all items by createdAt desc
  feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply pagination
  // For simplicity, we're not doing cursor-based pagination across merged sources
  // In production, you'd want a more sophisticated approach
  const paginatedItems = feedItems.slice(0, limit + 1);
  const hasMore = paginatedItems.length > limit;
  const items = hasMore ? paginatedItems.slice(0, -1) : paginatedItems;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
