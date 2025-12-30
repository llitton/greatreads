import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveCover, getCoverUrl } from '@/lib/covers/resolver';

/**
 * GET /api/covers/resolve?bookId=xxx
 *
 * Get or resolve cover for a specific book.
 * Returns the cached cover URL if available, otherwise triggers resolution.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  // Check if book exists
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { resolvedCover: true },
  });

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // If we have an active cover, return it immediately
  if (book.resolvedCover?.status === 'ACTIVE' && book.resolvedCover.imageUrl) {
    return NextResponse.json({
      imageUrl: book.resolvedCover.imageUrl,
      source: book.resolvedCover.source,
      confidence: book.resolvedCover.confidence,
      status: 'ACTIVE',
      cached: true,
    });
  }

  // Try to get/resolve cover
  const coverUrl = await getCoverUrl(bookId);

  if (coverUrl) {
    // Fetch updated record
    const updatedCover = await prisma.bookCover.findUnique({
      where: { bookId },
    });

    return NextResponse.json({
      imageUrl: coverUrl,
      source: updatedCover?.source,
      confidence: updatedCover?.confidence,
      status: updatedCover?.status,
      cached: false,
    });
  }

  // No cover found
  return NextResponse.json({
    imageUrl: null,
    status: 'FAILED',
    message: 'No cover found for this book',
  });
}

/**
 * POST /api/covers/resolve
 *
 * Force resolution for a specific book.
 * Useful for retrying failed covers or updating outdated ones.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, force } = body as { bookId: string; force?: boolean };

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    // If force, reset the BookCover status to trigger fresh resolution
    if (force) {
      await prisma.bookCover.upsert({
        where: { bookId },
        create: {
          bookId,
          status: 'PENDING',
          attemptCount: 0,
        },
        update: {
          status: 'PENDING',
          attemptCount: 0,
          failureReason: null,
        },
      });
    }

    const result = await resolveCover(bookId);

    return NextResponse.json({
      success: result.success,
      imageUrl: result.imageUrl,
      source: result.source,
      confidence: result.confidence,
      error: result.error,
    });
  } catch (error) {
    console.error('[Cover Resolve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve cover' },
      { status: 500 }
    );
  }
}
