import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RssActionStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

/**
 * POST /api/rss/items/:itemId/ignore
 * Ignore an item (won't show in inbox)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find or create action for this user+item
    const action = await prisma.rssItemAction.upsert({
      where: {
        userId_itemId: {
          userId: session.user.id,
          itemId,
        },
      },
      update: {
        status: RssActionStatus.IGNORED,
        ignoredAt: new Date(),
      },
      create: {
        userId: session.user.id,
        itemId,
        status: RssActionStatus.IGNORED,
        ignoredAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, actionId: action.id });
  } catch (error) {
    console.error('Failed to ignore item:', error);
    return NextResponse.json(
      { error: 'Failed to ignore item' },
      { status: 500 }
    );
  }
}
