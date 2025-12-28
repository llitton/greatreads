import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lookupCover } from '@/lib/covers/lookup';

// Vercel Cron configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Process books in batches
const BATCH_SIZE = 20;
const DELAY_BETWEEN_LOOKUPS_MS = 500; // Rate limit protection

/**
 * GET /api/covers/enrich
 *
 * Cron job to enrich books with covers.
 * Processes books that:
 * 1. Have no coverUrl, OR
 * 2. Have coverConfidence = LOW and haven't been updated in 30 days
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    enriched: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ bookId: string; title: string; error: string }>,
  };

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find books needing covers:
    // 1. No cover at all (coverUrl is null and we haven't tried recently)
    // 2. Low confidence covers that are old (worth retrying)
    const booksNeedingCovers = await prisma.book.findMany({
      where: {
        OR: [
          // Never had a cover and haven't tried in the last day
          {
            coverUrl: null,
            OR: [
              { coverUpdatedAt: null },
              { coverUpdatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            ],
          },
          // Low confidence and old
          {
            coverConfidence: 'LOW',
            coverUpdatedAt: { lt: thirtyDaysAgo },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        isbn13: true,
        coverUrl: true,
        coverSource: true,
      },
      take: BATCH_SIZE,
      orderBy: [
        // Prioritize books that have never been tried
        { coverUpdatedAt: 'asc' },
      ],
    });

    console.log(`[Cover Enrich] Processing ${booksNeedingCovers.length} books`);

    for (const book of booksNeedingCovers) {
      try {
        results.processed++;

        // Skip if we already have a good cover from Goodreads
        if (book.coverUrl && book.coverSource === 'GOODREADS') {
          results.skipped++;
          continue;
        }

        const cover = await lookupCover(
          book.title,
          book.author,
          book.isbn,
          book.isbn13
        );

        if (cover) {
          await prisma.book.update({
            where: { id: book.id },
            data: {
              coverUrl: cover.url,
              coverSource: cover.source,
              coverConfidence: cover.confidence,
              coverUpdatedAt: new Date(),
            },
          });
          results.enriched++;
          console.log(`[Cover Enrich] ✓ ${book.title} (${cover.source}, ${cover.confidence})`);
        } else {
          // Mark that we tried (so we don't retry too frequently)
          await prisma.book.update({
            where: { id: book.id },
            data: {
              coverUpdatedAt: new Date(),
            },
          });
          results.failed++;
          console.log(`[Cover Enrich] ✗ ${book.title} (no cover found)`);
        }

        // Rate limit: wait between lookups
        if (booksNeedingCovers.indexOf(book) < booksNeedingCovers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_LOOKUPS_MS));
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          bookId: book.id,
          title: book.title,
          error: errorMessage,
        });
        console.error(`[Cover Enrich] Error processing ${book.title}:`, errorMessage);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cover Enrich] Completed in ${duration}ms:`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    console.error('[Cover Enrich] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cover enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/covers/enrich
 *
 * Manually trigger cover enrichment for specific books.
 * Useful for admin operations.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bookIds } = body as { bookIds?: string[] };

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'bookIds array required' }, { status: 400 });
    }

    // Limit to prevent abuse
    if (bookIds.length > 50) {
      return NextResponse.json({ error: 'Max 50 books per request' }, { status: 400 });
    }

    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        isbn13: true,
      },
    });

    const results: Array<{
      bookId: string;
      title: string;
      success: boolean;
      source?: string;
      confidence?: string;
    }> = [];

    for (const book of books) {
      const cover = await lookupCover(book.title, book.author, book.isbn, book.isbn13);

      if (cover) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            coverUrl: cover.url,
            coverSource: cover.source,
            coverConfidence: cover.confidence,
            coverUpdatedAt: new Date(),
          },
        });
        results.push({
          bookId: book.id,
          title: book.title,
          success: true,
          source: cover.source,
          confidence: cover.confidence,
        });
      } else {
        await prisma.book.update({
          where: { id: book.id },
          data: { coverUpdatedAt: new Date() },
        });
        results.push({
          bookId: book.id,
          title: book.title,
          success: false,
        });
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_LOOKUPS_MS));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[Cover Enrich] Error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich covers' },
      { status: 500 }
    );
  }
}
