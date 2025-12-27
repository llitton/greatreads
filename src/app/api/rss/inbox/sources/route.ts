import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const addSourceSchema = z.object({
  url: z.string().url('Invalid URL'),
  titleOverride: z.string().max(100).optional(),
});

/**
 * GET /api/rss/inbox/sources
 * List all RSS sources for the user
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sources = await prisma.rssSource.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        title: true,
        description: true,
        siteUrl: true,
        isActive: true,
        lastFetchedAt: true,
        lastError: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({
      sources: sources.map((s) => ({
        ...s,
        itemCount: s._count.items,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rss/inbox/sources
 * Add a new RSS source
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, titleOverride } = addSourceSchema.parse(body);

    // Check if source already exists for this user
    const existing = await prisma.rssSource.findUnique({
      where: {
        userId_url: {
          userId: session.user.id,
          url,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You already follow this feed' },
        { status: 400 }
      );
    }

    // TODO: Fetch and validate RSS feed, extract title/description
    // For now, create with provided data
    const source = await prisma.rssSource.create({
      data: {
        userId: session.user.id,
        url,
        title: titleOverride || 'New Feed',
        isActive: true,
      },
    });

    return NextResponse.json({ source });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to add source:', error);
    return NextResponse.json(
      { error: 'Failed to add source' },
      { status: 500 }
    );
  }
}

/**
 * Generate dedup hash for an RSS item
 */
export function generateDedupHash(sourceId: string, guid?: string, url?: string, title?: string): string {
  const key = guid || url || title || '';
  return crypto.createHash('sha256').update(`${sourceId}:${key}`).digest('hex').slice(0, 32);
}
