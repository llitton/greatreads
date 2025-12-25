import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSourceSchema = z.object({
  label: z.string().min(1, 'Friend name is required').max(100),
  rssUrl: z.string().url('Please enter a valid RSS URL'),
});

// GET all sources for current user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = await prisma.friendSource.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(sources);
}

// POST create new source
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { label, rssUrl } = createSourceSchema.parse(body);

    // Check for duplicate
    const existing = await prisma.friendSource.findFirst({
      where: {
        userId: session.user.id,
        rssUrl,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You already have this RSS feed added' },
        { status: 400 }
      );
    }

    const source = await prisma.friendSource.create({
      data: {
        userId: session.user.id,
        label,
        rssUrl,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to create source:', error);
    return NextResponse.json(
      { error: 'Failed to add friend source' },
      { status: 500 }
    );
  }
}
