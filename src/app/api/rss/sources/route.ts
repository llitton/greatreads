import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
// NOTE: RSS-based sources are disabled. Use CSV import instead.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  // RSS source creation is disabled - use CSV import instead
  return NextResponse.json(
    { error: 'RSS sources are no longer supported. Please use CSV import from Goodreads.' },
    { status: 400 }
  );
}
