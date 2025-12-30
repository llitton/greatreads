import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveCover } from '@/lib/covers/resolver';

/**
 * POST /api/covers/backfill
 *
 * Trigger a cover backfill job. Processes books without covers.
 * Designed to be called by a cron job or manually.
 *
 * Body:
 *   limit: number - Max books to process (default: 20)
 *   priorityFirst: boolean - Process Canon/Top10 first (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 20, 100); // Cap at 100 per run
    const priorityFirst = body.priorityFirst !== false;

    // Get books needing covers
    let bookIds: string[] = [];

    if (priorityFirst) {
      // Priority 1: Canon entries (via UserBookStatus -> CanonEntry)
      const canonUserBooks = await prisma.userBookStatus.findMany({
        where: {
          canonEntry: { isNot: null },
          book: {
            OR: [
              { resolvedCover: null },
              { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
            ],
          },
        },
        select: { bookId: true },
        take: limit,
      });
      bookIds.push(...canonUserBooks.map((ub) => ub.bookId));

      // Priority 2: Top 10 (TopTenItem links to Book)
      if (bookIds.length < limit) {
        const top10Books = await prisma.book.findMany({
          where: {
            id: { notIn: bookIds },
            topTenItems: { some: {} },
            OR: [
              { resolvedCover: null },
              { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
            ],
          },
          select: { id: true },
          take: limit - bookIds.length,
        });
        bookIds.push(...top10Books.map((b) => b.id));
      }

      // Priority 3: 5-star books (via UserBookStatus)
      if (bookIds.length < limit) {
        const fiveStarUserBooks = await prisma.userBookStatus.findMany({
          where: {
            bookId: { notIn: bookIds },
            userRating: 5,
            book: {
              OR: [
                { resolvedCover: null },
                { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
              ],
            },
          },
          select: { bookId: true },
          take: limit - bookIds.length,
        });
        bookIds.push(...fiveStarUserBooks.map((ub) => ub.bookId));
      }

      // Priority 4: Everything else
      if (bookIds.length < limit) {
        const otherBooks = await prisma.book.findMany({
          where: {
            id: { notIn: bookIds },
            OR: [
              { resolvedCover: null },
              { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
            ],
          },
          select: { id: true },
          take: limit - bookIds.length,
        });
        bookIds.push(...otherBooks.map((b) => b.id));
      }
    } else {
      // Simple: just get books without covers
      const books = await prisma.book.findMany({
        where: {
          OR: [
            { resolvedCover: null },
            { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
          ],
        },
        select: { id: true },
        take: limit,
      });
      bookIds = books.map((b) => b.id);
    }

    if (bookIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All books already have covers',
        processed: 0,
        resolved: 0,
        failed: 0,
      });
    }

    // Process books
    const results: Array<{
      bookId: string;
      success: boolean;
      source?: string;
      error?: string;
    }> = [];

    for (const bookId of bookIds) {
      try {
        const result = await resolveCover(bookId);
        results.push({
          bookId,
          success: result.success,
          source: result.source,
          error: result.error,
        });
      } catch (error) {
        results.push({
          bookId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const resolved = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: bookIds.length,
      resolved,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Cover Backfill] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run backfill' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/covers/backfill
 *
 * Get backfill status - how many books still need covers
 */
export async function GET() {
  try {
    // Count books by cover status
    const totalBooks = await prisma.book.count();

    const withActiveCover = await prisma.book.count({
      where: {
        resolvedCover: { status: 'ACTIVE' },
      },
    });

    const withDegradedCover = await prisma.book.count({
      where: {
        resolvedCover: { status: 'DEGRADED' },
      },
    });

    const withFailedCover = await prisma.book.count({
      where: {
        resolvedCover: { status: 'FAILED' },
      },
    });

    const pendingOrResolving = await prisma.book.count({
      where: {
        resolvedCover: { status: { in: ['PENDING', 'RESOLVING'] } },
      },
    });

    const noCoverRecord = await prisma.book.count({
      where: {
        resolvedCover: null,
      },
    });

    // Priority counts (via relations)
    const canonUserBooks = await prisma.userBookStatus.findMany({
      where: {
        canonEntry: { isNot: null },
        book: {
          OR: [
            { resolvedCover: null },
            { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
          ],
        },
      },
      select: { bookId: true },
    });
    const canonNeedingCovers = new Set(canonUserBooks.map((ub) => ub.bookId)).size;

    const top10NeedingCovers = await prisma.book.count({
      where: {
        topTenItems: { some: {} },
        OR: [
          { resolvedCover: null },
          { resolvedCover: { status: { in: ['PENDING', 'FAILED'] } } },
        ],
      },
    });

    const coverRate = totalBooks > 0
      ? (((withActiveCover + withDegradedCover) / totalBooks) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      total: totalBooks,
      withCovers: withActiveCover + withDegradedCover,
      coverRate: `${coverRate}%`,
      breakdown: {
        active: withActiveCover,
        degraded: withDegradedCover,
        failed: withFailedCover,
        pending: pendingOrResolving,
        noRecord: noCoverRecord,
      },
      priority: {
        canonNeedingCovers,
        top10NeedingCovers,
      },
      needsBackfill: noCoverRecord + pendingOrResolving + withFailedCover,
    });
  } catch (error) {
    console.error('[Cover Backfill] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get backfill status' },
      { status: 500 }
    );
  }
}
