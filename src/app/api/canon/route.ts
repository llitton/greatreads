import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addToCanonSchema = z.object({
  userBookId: z.string().min(1),
  reflectionNote: z.string().max(500).optional(),
});

const removeFromCanonSchema = z.object({
  canonEntryId: z.string().min(1),
});

// GET user's canon entries
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canonEntries = await prisma.canonEntry.findMany({
    where: {
      userBook: {
        userId: session.user.id,
      },
      removedAt: null, // Only active entries
    },
    include: {
      userBook: {
        include: {
          book: true,
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(canonEntries);
}

// POST add to canon
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userBookId, reflectionNote } = addToCanonSchema.parse(body);

    // Verify the userBook belongs to this user
    const userBook = await prisma.userBookStatus.findUnique({
      where: { id: userBookId },
    });

    if (!userBook || userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if already in canon
    const existing = await prisma.canonEntry.findUnique({
      where: { userBookId },
    });

    if (existing && !existing.removedAt) {
      return NextResponse.json({ error: 'Already in canon' }, { status: 400 });
    }

    // Get next position
    const lastEntry = await prisma.canonEntry.findFirst({
      where: {
        userBook: { userId: session.user.id },
        removedAt: null,
      },
      orderBy: { position: 'desc' },
    });
    const nextPosition = (lastEntry?.position ?? 0) + 1;

    // If entry exists but was removed, reactivate it
    if (existing) {
      const result = await prisma.canonEntry.update({
        where: { id: existing.id },
        data: {
          removedAt: null,
          position: nextPosition,
          reflectionNote: reflectionNote ?? existing.reflectionNote,
        },
        include: {
          userBook: { include: { book: true } },
        },
      });
      return NextResponse.json(result);
    }

    // Create new canon entry
    const result = await prisma.canonEntry.create({
      data: {
        userBookId,
        position: nextPosition,
        reflectionNote,
      },
      include: {
        userBook: { include: { book: true } },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to add to canon:', error);
    return NextResponse.json(
      { error: 'Failed to add to canon' },
      { status: 500 }
    );
  }
}

// DELETE remove from canon (soft delete)
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { canonEntryId } = removeFromCanonSchema.parse(body);

    // Verify ownership
    const entry = await prisma.canonEntry.findUnique({
      where: { id: canonEntryId },
      include: { userBook: true },
    });

    if (!entry || entry.userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.canonEntry.update({
      where: { id: canonEntryId },
      data: { removedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to remove from canon:', error);
    return NextResponse.json(
      { error: 'Failed to remove from canon' },
      { status: 500 }
    );
  }
}

// PATCH update reflection note
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { canonEntryId, reflectionNote } = z
      .object({
        canonEntryId: z.string().min(1),
        reflectionNote: z.string().max(500).nullable(),
      })
      .parse(body);

    // Verify ownership
    const entry = await prisma.canonEntry.findUnique({
      where: { id: canonEntryId },
      include: { userBook: true },
    });

    if (!entry || entry.userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const result = await prisma.canonEntry.update({
      where: { id: canonEntryId },
      data: { reflectionNote },
      include: { userBook: { include: { book: true } } },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to update canon entry:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}
