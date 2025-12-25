import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTopTenSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.string().min(1),
      rank: z.number().int().min(1).max(10),
    })
  ).max(10),
});

// GET user's Top 10
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find or create the user's Top 10 list
  let topTen = await prisma.topTen.findFirst({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          book: true,
        },
        orderBy: { rank: 'asc' },
      },
    },
  });

  if (!topTen) {
    topTen = await prisma.topTen.create({
      data: {
        userId: session.user.id,
        name: 'Top 10',
      },
      include: {
        items: {
          include: {
            book: true,
          },
          orderBy: { rank: 'asc' },
        },
      },
    });
  }

  return NextResponse.json(topTen);
}

// POST update Top 10 items (replaces all)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items } = updateTopTenSchema.parse(body);

    // Find or create the Top 10 list
    let topTen = await prisma.topTen.findFirst({
      where: { userId: session.user.id },
    });

    if (!topTen) {
      topTen = await prisma.topTen.create({
        data: {
          userId: session.user.id,
          name: 'Top 10',
        },
      });
    }

    // Verify all books exist
    const bookIds = items.map((i) => i.bookId);
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } },
    });

    if (books.length !== bookIds.length) {
      return NextResponse.json(
        { error: 'Some books not found' },
        { status: 400 }
      );
    }

    // Delete existing items and create new ones in a transaction
    await prisma.$transaction([
      prisma.topTenItem.deleteMany({
        where: { topTenId: topTen.id },
      }),
      prisma.topTenItem.createMany({
        data: items.map((item) => ({
          topTenId: topTen.id,
          bookId: item.bookId,
          rank: item.rank,
        })),
      }),
      prisma.topTen.update({
        where: { id: topTen.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Fetch the updated list
    const updated = await prisma.topTen.findUnique({
      where: { id: topTen.id },
      include: {
        items: {
          include: {
            book: true,
          },
          orderBy: { rank: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to update Top 10:', error);
    return NextResponse.json(
      { error: 'Failed to update Top 10' },
      { status: 500 }
    );
  }
}
