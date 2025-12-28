import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import Parser from 'rss-parser';
import {
  extractBookInfo,
  extractCoverUrl,
  extractEventDate,
  extractReviewText,
  detectRating,
} from '@/lib/rss/parser';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

// Vercel Cron configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

const parser = new Parser({
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['book_id', 'bookId'],
      ['book_image_url', 'bookImageUrl'],
      ['book_small_image_url', 'bookSmallImageUrl'],
      ['book_medium_image_url', 'bookMediumImageUrl'],
      ['book_large_image_url', 'bookLargeImageUrl'],
      ['author_name', 'authorName'],
      ['isbn', 'isbn'],
      ['user_name', 'userName'],
      ['user_rating', 'userRating'],
    ],
  },
});

/**
 * Generate a stable deduplication hash for an RSS item
 */
function generateDedupHash(sourceId: string, item: { guid?: string; link?: string; title?: string }): string {
  const key = item.guid || item.link || item.title || '';
  return crypto.createHash('sha256').update(`${sourceId}:${key}`).digest('hex').substring(0, 32);
}

/**
 * Extract ISBN from custom Goodreads fields
 */
function extractIsbn(item: Record<string, unknown>): string | null {
  if (item.isbn && typeof item.isbn === 'string') {
    return item.isbn;
  }
  return null;
}

/**
 * GET /api/rss/cron/fetch
 *
 * Polls all active RSS sources and creates new inbox items.
 * Called by Vercel Cron or manually with CRON_SECRET.
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
    sourcesProcessed: 0,
    sourcesErrored: 0,
    itemsCreated: 0,
    itemsSkipped: 0,
    errors: [] as Array<{ sourceId: string; url: string; error: string }>,
  };

  try {
    // Get all active RSS sources
    const sources = await prisma.rssSource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        userId: true,
        url: true,
        title: true,
      },
    });

    console.log(`[RSS Cron] Processing ${sources.length} active sources`);

    for (const source of sources) {
      try {
        await processSource(source, results);
        results.sourcesProcessed++;
      } catch (error) {
        results.sourcesErrored++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          sourceId: source.id,
          url: source.url,
          error: errorMessage,
        });

        // Update source with error
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            lastError: errorMessage,
            lastFetchedAt: new Date(),
          },
        });

        console.error(`[RSS Cron] Error processing source ${source.id}:`, errorMessage);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RSS Cron] Completed in ${duration}ms:`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...results,
    });
  } catch (error) {
    console.error('[RSS Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process a single RSS source
 */
async function processSource(
  source: { id: string; userId: string; url: string; title: string | null },
  results: { itemsCreated: number; itemsSkipped: number }
) {
  // Fetch RSS feed
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'GreatReads/1.0 (RSS Reader)',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);

  // Update source title if we got one from the feed
  if (feed.title && !source.title) {
    await prisma.rssSource.update({
      where: { id: source.id },
      data: { title: feed.title },
    });
  }

  // Process each item
  for (const item of feed.items) {
    const dedupHash = generateDedupHash(source.id, item);

    // Check if we already have this item
    const existing = await prisma.rssItem.findUnique({
      where: {
        sourceId_dedupHash: {
          sourceId: source.id,
          dedupHash,
        },
      },
    });

    if (existing) {
      results.itemsSkipped++;
      continue;
    }

    // Extract book info using existing parser utilities
    const bookInfo = extractBookInfo(item);
    const coverUrl = extractCoverUrl(item);
    const rating = detectRating(item);
    const eventDate = extractEventDate(item);
    const reviewText = extractReviewText(item);
    const isbn = extractIsbn(item as unknown as Record<string, unknown>);

    // Create new RssItem
    const rssItem = await prisma.rssItem.create({
      data: {
        sourceId: source.id,
        guid: item.guid || null,
        url: item.link || null,
        title: item.title || null,
        author: item.creator || null,
        publishedAt: eventDate,
        rawHtml: item.content || item.contentSnippet || null,
        cleanText: reviewText ? normalizeGoodreadsText(reviewText) : null,
        bookTitle: bookInfo.title,
        bookAuthor: bookInfo.author,
        coverImageUrl: coverUrl,
        isbn,
        dedupHash,
      },
    });

    // Create UNSEEN action for the source owner
    await prisma.rssItemAction.create({
      data: {
        itemId: rssItem.id,
        userId: source.userId,
        status: 'UNSEEN',
      },
    });

    results.itemsCreated++;
  }

  // Update source lastFetchedAt, clear any previous error
  await prisma.rssSource.update({
    where: { id: source.id },
    data: {
      lastFetchedAt: new Date(),
      lastError: null,
    },
  });

  console.log(`[RSS Cron] Source ${source.id} (${source.title || source.url}): created ${results.itemsCreated} items`);
}
