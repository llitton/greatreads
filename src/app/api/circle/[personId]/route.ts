import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { removePersonFromCircle, setPersonMuted } from '@/lib/circle';

interface RouteContext {
  params: Promise<{ personId: string }>;
}

/**
 * GET /api/circle/[personId]
 *
 * Get detailed info about a person including all sources
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { personId } = await context.params;

  try {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        rssSources: {
          where: { userId: session.user.id },
        },
        friendSources: {
          where: { userId: session.user.id },
        },
        memberships: {
          where: { userId: session.user.id },
          select: { createdAt: true, mutedAt: true },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Get impact stats
    const booksSurfaced = await prisma.friendFiveStarEvent.count({
      where: {
        userId: session.user.id,
        friendName: { equals: person.displayName, mode: 'insensitive' },
      },
    });

    const booksInCanon = await prisma.canonEntry.count({
      where: {
        userBook: {
          userId: session.user.id,
          sourcePersonName: { equals: person.displayName, mode: 'insensitive' },
        },
        removedAt: null,
      },
    });

    const lastEvent = await prisma.friendFiveStarEvent.findFirst({
      where: {
        userId: session.user.id,
        friendName: { equals: person.displayName, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      include: { book: { select: { title: true } } },
    });

    return NextResponse.json({
      person: {
        id: person.id,
        displayName: person.displayName,
        avatarUrl: person.avatarUrl,
        trustedSince: person.memberships[0]?.createdAt || person.createdAt,
        isMuted: person.memberships[0]?.mutedAt !== null,
      },
      sources: [
        ...person.rssSources.map((s) => ({
          id: s.id,
          type: 'RSS',
          url: s.url,
          title: s.title,
          status: s.status,
          failureReasonCode: s.failureReasonCode,
          lastSuccessAt: s.lastSuccessAt,
          lastAttemptAt: s.lastAttemptAt,
        })),
        ...person.friendSources.map((s) => ({
          id: s.id,
          type: s.sourceType === 'import' ? 'IMPORT' : 'GOODREADS',
          url: s.rssUrl,
          title: s.label,
          status: s.active ? 'ACTIVE' : 'PAUSED',
          failureReasonCode: null,
          lastSuccessAt: s.lastFetchedAt,
          lastAttemptAt: s.lastFetchedAt,
        })),
      ],
      impact: {
        booksSurfaced,
        booksInCanon,
        lastSignalAt: lastEvent?.createdAt || null,
        lastSignalBookTitle: lastEvent?.book?.title || null,
      },
    });
  } catch (error) {
    console.error('[Circle Person API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/circle/[personId]
 *
 * Update person (mute/unmute, update avatar)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { personId } = await context.params;

  try {
    const body = await request.json();
    const { muted, avatarUrl } = body as {
      muted?: boolean;
      avatarUrl?: string;
    };

    if (typeof muted === 'boolean') {
      await setPersonMuted(session.user.id, personId, muted);
    }

    if (avatarUrl !== undefined) {
      await prisma.person.update({
        where: { id: personId },
        data: { avatarUrl },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Circle Person API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/circle/[personId]
 *
 * Remove person from circle
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { personId } = await context.params;

  try {
    const { searchParams } = new URL(request.url);
    const removeAllSources = searchParams.get('removeAllSources') !== 'false';

    await removePersonFromCircle(session.user.id, personId, {
      removeAllSources,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Circle Person API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove' },
      { status: 500 }
    );
  }
}
