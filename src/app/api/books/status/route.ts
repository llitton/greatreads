import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { BookStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  bookId: z.string().min(1),
  status: z.enum(['WANT_TO_READ', 'READING', 'READ']).optional(),
  userRating: z.number().int().min(1).max(5).optional().nullable(),
  userNotes: z.string().max(5000).optional().nullable(),
});

// GET user's book statuses
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (bookId) {
    const status = await prisma.userBookStatus.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
      include: {
        book: true,
      },
    });
    return NextResponse.json(status);
  }

  const statuses = await prisma.userBookStatus.findMany({
    where: { userId: session.user.id },
    include: {
      book: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(statuses);
}

// POST/PUT update book status
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookId, status, userRating, userNotes } = updateStatusSchema.parse(body);

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const result = await prisma.userBookStatus.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
      update: {
        ...(status && { status: status as BookStatus }),
        ...(userRating !== undefined && { userRating }),
        ...(userNotes !== undefined && { userNotes }),
      },
      create: {
        userId: session.user.id,
        bookId,
        status: (status as BookStatus) || 'WANT_TO_READ',
        userRating,
        userNotes,
      },
      include: {
        book: true,
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

    console.error('Failed to update book status:', error);
    return NextResponse.json(
      { error: 'Failed to update book status' },
      { status: 500 }
    );
  }
}

// DELETE remove book status
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  await prisma.userBookStatus.delete({
    where: {
      userId_bookId: {
        userId: session.user.id,
        bookId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
