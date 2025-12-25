import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const events = await prisma.friendFiveStarEvent.findMany({
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
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, -1) : events;

  // Add user status to each item
  const itemsWithStatus = items.map((event) => ({
    ...event,
    userStatus: statusMap.get(event.bookId) || null,
  }));

  return NextResponse.json({
    items: itemsWithStatus,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
