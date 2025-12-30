import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addToStayedSchema = z.object({
  userBookId: z.string().min(1),
});

const removeFromStayedSchema = z.object({
  stayedEntryId: z.string().min(1),
});

// GET user's stayed books
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stayedBooks = await prisma.userBookStatus.findMany({
    where: {
      userId: session.user.id,
      stayedEntry: {
        isNot: null,
      },
    },
    include: {
      book: true,
      stayedEntry: true,
      reflection: true,
      signals: {
        orderBy: { confidence: 'desc' },
      },
    },
    orderBy: {
      stayedEntry: {
        enteredAt: 'desc',
      },
    },
  });

  return NextResponse.json({ books: stayedBooks });
}

// POST add to stayed
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userBookId } = addToStayedSchema.parse(body);

    // Verify the userBook belongs to this user
    const userBook = await prisma.userBookStatus.findUnique({
      where: { id: userBookId },
    });

    if (!userBook || userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if already in stayed
    const existing = await prisma.stayedEntry.findUnique({
      where: { userBookId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already in stayed' }, { status: 400 });
    }

    // Create stayed entry
    const result = await prisma.stayedEntry.create({
      data: {
        userBookId,
        source: 'USER',
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

    console.error('Failed to add to stayed:', error);
    return NextResponse.json(
      { error: 'Failed to add to stayed' },
      { status: 500 }
    );
  }
}

// DELETE remove from stayed
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { stayedEntryId } = removeFromStayedSchema.parse(body);

    // Verify ownership
    const entry = await prisma.stayedEntry.findUnique({
      where: { id: stayedEntryId },
      include: { userBook: true },
    });

    if (!entry || entry.userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete (hard delete for stayed)
    await prisma.stayedEntry.delete({
      where: { id: stayedEntryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to remove from stayed:', error);
    return NextResponse.json(
      { error: 'Failed to remove from stayed' },
      { status: 500 }
    );
  }
}
