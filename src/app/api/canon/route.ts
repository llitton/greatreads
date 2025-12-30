import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import {
  getCanon,
  addToCanon,
  removeFromCanon,
  reorderCanon,
} from '@/lib/canon';
import { ReflectionKind } from '@prisma/client';

const addToCanonSchema = z.object({
  userBookId: z.string().min(1),
  reflectionContent: z.string().min(1, 'Reflection is required'),
  reflectionKind: z.nativeEnum(ReflectionKind).optional(),
});

const removeFromCanonSchema = z.object({
  canonEntryId: z.string().min(1),
});

const reorderSchema = z.object({
  orderedEntryIds: z.array(z.string().min(1)),
});

/**
 * GET /api/canon
 *
 * Get user's canon entries (active only)
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const canon = await getCanon(session.user.id);
    return NextResponse.json({ canon, count: canon.length });
  } catch (error) {
    console.error('[Canon API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canon' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/canon
 *
 * Add a book to canon. Requires a reflection.
 * Body: { userBookId, reflectionContent, reflectionKind? }
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userBookId, reflectionContent, reflectionKind } =
      addToCanonSchema.parse(body);

    const result = await addToCanon(
      session.user.id,
      userBookId,
      reflectionContent,
      reflectionKind ?? ReflectionKind.PROMPT
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      canonEntryId: result.canonEntryId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('[Canon API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to canon' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/canon
 *
 * Remove a book from canon (soft delete)
 * Body: { canonEntryId }
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { canonEntryId } = removeFromCanonSchema.parse(body);

    const result = await removeFromCanon(session.user.id, canonEntryId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('[Canon API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from canon' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/canon
 *
 * Reorder canon entries
 * Body: { orderedEntryIds: string[] }
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderedEntryIds } = reorderSchema.parse(body);

    const result = await reorderCanon(session.user.id, orderedEntryIds);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('[Canon API] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to reorder canon' }, { status: 500 });
  }
}
