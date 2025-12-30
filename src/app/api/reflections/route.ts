import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saveReflectionSchema = z.object({
  userBookId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

// GET user's reflections
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reflections = await prisma.reflection.findMany({
    where: {
      userBook: {
        userId: session.user.id,
      },
    },
    include: {
      userBook: {
        include: {
          book: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ reflections });
}

// POST create or update reflection
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userBookId, content } = saveReflectionSchema.parse(body);

    // Verify the userBook belongs to this user
    const userBook = await prisma.userBookStatus.findUnique({
      where: { id: userBookId },
    });

    if (!userBook || userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Upsert reflection
    const result = await prisma.reflection.upsert({
      where: { userBookId },
      update: {
        content,
      },
      create: {
        userBookId,
        content,
      },
      include: {
        userBook: { include: { book: true } },
      },
    });

    // Also add a signal for UNRESOLVED if user edits reflection multiple times
    // Check if reflection was updated (not created)
    const existingReflection = await prisma.reflection.findUnique({
      where: { userBookId },
    });

    if (existingReflection) {
      // Find or create UNRESOLVED signal
      const existingSignal = await prisma.bookSignal.findFirst({
        where: {
          userBookId,
          type: 'UNRESOLVED',
        },
      });

      if (existingSignal) {
        // Increase confidence
        await prisma.bookSignal.update({
          where: { id: existingSignal.id },
          data: {
            confidence: Math.min(existingSignal.confidence + 0.25, 0.8),
            lastActivityAt: new Date(),
          },
        });
      } else {
        // Create new signal
        await prisma.bookSignal.create({
          data: {
            userBookId,
            type: 'UNRESOLVED',
            confidence: 0.3,
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to save reflection:', error);
    return NextResponse.json(
      { error: 'Failed to save reflection' },
      { status: 500 }
    );
  }
}

// DELETE remove reflection
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reflectionId = searchParams.get('id');

    if (!reflectionId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const reflection = await prisma.reflection.findUnique({
      where: { id: reflectionId },
      include: { userBook: true },
    });

    if (!reflection || reflection.userBook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.reflection.delete({
      where: { id: reflectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete reflection:', error);
    return NextResponse.json(
      { error: 'Failed to delete reflection' },
      { status: 500 }
    );
  }
}
