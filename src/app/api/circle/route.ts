import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getCirclePeople,
  getCircleSummary,
  addPersonToCircle,
  removePersonFromCircle,
  setPersonMuted,
} from '@/lib/circle';

/**
 * GET /api/circle
 *
 * Get all people in the user's circle with computed status
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [people, summary] = await Promise.all([
      getCirclePeople(session.user.id),
      getCircleSummary(session.user.id),
    ]);

    return NextResponse.json({
      people,
      summary,
    });
  } catch (error) {
    console.error('[Circle API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circle' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/circle
 *
 * Add a person to the circle
 * Body: { name: string, rssUrl?: string, avatarUrl?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, rssUrl, avatarUrl } = body as {
      name: string;
      rssUrl?: string;
      avatarUrl?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await addPersonToCircle(session.user.id, name.trim(), {
      rssUrl,
      avatarUrl,
    });

    return NextResponse.json({
      success: true,
      person: result.person,
      isNew: result.isNew,
    });
  } catch (error) {
    console.error('[Circle API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add person' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/circle
 *
 * Update circle membership (mute/unmute)
 * Body: { personId: string, muted?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { personId, muted } = body as {
      personId: string;
      muted?: boolean;
    };

    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      );
    }

    if (typeof muted === 'boolean') {
      await setPersonMuted(session.user.id, personId, muted);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Circle API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/circle
 *
 * Remove a person from the circle
 * Body: { personId: string, removeAllSources?: boolean }
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { personId, removeAllSources } = body as {
      personId: string;
      removeAllSources?: boolean;
    };

    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      );
    }

    await removePersonFromCircle(session.user.id, personId, {
      removeAllSources: removeAllSources ?? true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Circle API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove' },
      { status: 500 }
    );
  }
}
