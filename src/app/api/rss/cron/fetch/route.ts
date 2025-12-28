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
import { RssSourceStatus, FailureReasonCode } from '@prisma/client';

// Vercel Cron configuration
export const maxDuration = 300; // 5 minutes max
export const dynamic = 'force-dynamic';

// Constants for backoff and limits
const MAX_PAGES_PER_RUN = 10;
const MAX_ITEMS_PER_RUN = 500;
const MAX_TIME_PER_SOURCE_MS = 20000; // 20 seconds per source
const BASE_BACKOFF_MINUTES = 5;
const MAX_BACKOFF_HOURS = 24;
const FAILURES_BEFORE_HARD_FAIL = 5;

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
 * Calculate next attempt time using exponential backoff
 */
function calculateNextAttempt(consecutiveFailures: number, retryAfter?: number): Date {
  if (retryAfter) {
    // Honor Retry-After header
    return new Date(Date.now() + retryAfter * 1000);
  }

  // Exponential backoff: min(24h, 2^failures * 5m) with jitter
  const backoffMinutes = Math.min(
    MAX_BACKOFF_HOURS * 60,
    Math.pow(2, consecutiveFailures) * BASE_BACKOFF_MINUTES
  );
  const jitterMs = Math.random() * 60000; // Up to 1 minute jitter
  return new Date(Date.now() + backoffMinutes * 60 * 1000 + jitterMs);
}

/**
 * Categorize HTTP error into failure reason
 */
function categorizeHttpError(status: number): FailureReasonCode {
  if (status === 401 || status === 403) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

/**
 * Check if response looks like HTML instead of RSS
 */
function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    (trimmed.includes('<body') && !trimmed.includes('<rss') && !trimmed.includes('<feed'))
  );
}

/**
 * Generate a stable deduplication hash for an RSS item
 */
function generateDedupHash(sourceId: string, item: { guid?: string; link?: string; title?: string }): string {
  const key = item.guid || item.link || item.title || '';
  return crypto.createHash('sha256').update(`${sourceId}:${key}`).digest('hex').substring(0, 32);
}

/**
 * Generate a stable item key for tracking last seen item
 */
function generateItemKey(item: { guid?: string; link?: string; title?: string; isoDate?: string }): string {
  // Prefer guid if it looks stable, else link, else hash of content
  if (item.guid && !item.guid.includes('?')) {
    return item.guid;
  }
  if (item.link) {
    return item.link;
  }
  const content = `${item.title || ''}|${item.isoDate || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
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
 * Polls all active/backoff RSS sources and creates new inbox items.
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
    sourcesSkipped: 0,
    itemsCreated: 0,
    itemsSkipped: 0,
    errors: [] as Array<{ sourceId: string; url: string; error: string; status: string }>,
  };

  try {
    const now = new Date();

    // Get sources that are ready to be polled:
    // - ACTIVE sources (always ready)
    // - BACKOFF sources where nextAttemptAt <= now
    const sources = await prisma.rssSource.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          {
            status: 'BACKOFF',
            nextAttemptAt: { lte: now },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        url: true,
        title: true,
        etag: true,
        lastModified: true,
        lastSuccessAt: true,
        lastSeenItemKey: true,
        consecutiveFailures: true,
      },
    });

    console.log(`[RSS Cron] Processing ${sources.length} sources ready for polling`);

    for (const source of sources) {
      try {
        const sourceStartTime = Date.now();
        await processSource(source, results, sourceStartTime);
        results.sourcesProcessed++;
      } catch (error) {
        results.sourcesErrored++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          sourceId: source.id,
          url: source.url,
          error: errorMessage,
          status: 'error',
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
 * Process a single RSS source with state machine transitions
 */
async function processSource(
  source: {
    id: string;
    userId: string;
    url: string;
    title: string | null;
    etag: string | null;
    lastModified: string | null;
    lastSuccessAt: Date | null;
    lastSeenItemKey: string | null;
    consecutiveFailures: number;
  },
  results: { itemsCreated: number; itemsSkipped: number; sourcesSkipped: number },
  sourceStartTime: number
) {
  const now = new Date();
  let response: Response;
  let httpStatus: number;

  // Build headers for conditional GET
  const headers: HeadersInit = {
    'User-Agent': 'GreatReads/1.0 (RSS Reader)',
  };
  if (source.etag) {
    headers['If-None-Match'] = source.etag;
  }
  if (source.lastModified) {
    headers['If-Modified-Since'] = source.lastModified;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_TIME_PER_SOURCE_MS);

    response = await fetch(source.url, {
      headers,
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeout);
    httpStatus = response.status;
  } catch (error) {
    // Network error or timeout
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    await handleSoftFailure(
      source.id,
      source.consecutiveFailures,
      isTimeout ? 'TIMEOUT' : 'UNKNOWN',
      null,
      isTimeout ? 'Request timed out' : (error instanceof Error ? error.message : 'Network error')
    );
    throw error;
  }

  // Handle 304 Not Modified (no new content)
  if (httpStatus === 304) {
    await prisma.rssSource.update({
      where: { id: source.id },
      data: {
        lastAttemptAt: now,
        // Don't update lastSuccessAt - no actual fetch happened
      },
    });
    results.sourcesSkipped++;
    console.log(`[RSS Cron] Source ${source.id}: not modified (304)`);
    return;
  }

  // Handle HTTP errors
  if (!response.ok) {
    const isSoftFail = httpStatus === 429 || httpStatus >= 500;
    const retryAfter = httpStatus === 429 ? parseRetryAfter(response.headers.get('Retry-After')) : undefined;

    if (isSoftFail) {
      await handleSoftFailure(
        source.id,
        source.consecutiveFailures,
        categorizeHttpError(httpStatus),
        httpStatus,
        `HTTP ${httpStatus}: ${response.statusText}`,
        retryAfter
      );
    } else {
      // Hard failure (4xx except 429)
      await handleHardFailure(
        source.id,
        categorizeHttpError(httpStatus),
        httpStatus,
        `HTTP ${httpStatus}: ${response.statusText}`
      );
    }
    throw new Error(`HTTP ${httpStatus}: ${response.statusText}`);
  }

  // Parse response
  const xml = await response.text();

  // Check if response is HTML instead of RSS
  if (looksLikeHtml(xml)) {
    await handleHardFailure(
      source.id,
      'NOT_FEED',
      httpStatus,
      'Response is HTML, not RSS/Atom feed'
    );
    throw new Error('Response is HTML, not RSS/Atom feed');
  }

  let feed;
  try {
    feed = await parser.parseString(xml);
  } catch (parseError) {
    await handleHardFailure(
      source.id,
      'PARSE_ERROR',
      httpStatus,
      `Failed to parse feed: ${parseError instanceof Error ? parseError.message : 'Invalid XML'}`
    );
    throw parseError;
  }

  // Update source title if we got one from the feed
  const newEtag = response.headers.get('ETag');
  const newLastModified = response.headers.get('Last-Modified');

  // Process items
  let newItemsCount = 0;
  let latestItemKey = source.lastSeenItemKey;

  for (const item of feed.items) {
    // Check time limit
    if (Date.now() - sourceStartTime > MAX_TIME_PER_SOURCE_MS) {
      console.log(`[RSS Cron] Source ${source.id}: time limit reached`);
      break;
    }

    // Check items limit
    if (newItemsCount >= MAX_ITEMS_PER_RUN) {
      console.log(`[RSS Cron] Source ${source.id}: items limit reached`);
      break;
    }

    const dedupHash = generateDedupHash(source.id, item);
    const itemKey = generateItemKey(item);

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

    newItemsCount++;
    results.itemsCreated++;

    // Track the latest item key
    if (!latestItemKey) {
      latestItemKey = itemKey;
    }
  }

  // Update source on success
  await prisma.rssSource.update({
    where: { id: source.id },
    data: {
      status: 'ACTIVE',
      failureReasonCode: 'NONE',
      lastSuccessAt: now,
      lastAttemptAt: now,
      nextAttemptAt: null,
      consecutiveFailures: 0,
      lastHttpStatus: httpStatus,
      lastError: null,
      etag: newEtag || source.etag,
      lastModified: newLastModified || source.lastModified,
      lastSeenItemKey: latestItemKey,
      title: feed.title && !source.title ? feed.title : source.title,
    },
  });

  console.log(`[RSS Cron] Source ${source.id} (${source.title || source.url}): created ${newItemsCount} items`);
}

/**
 * Handle soft failure (recoverable - goes to BACKOFF)
 */
async function handleSoftFailure(
  sourceId: string,
  currentFailures: number,
  reasonCode: FailureReasonCode,
  httpStatus: number | null,
  errorMessage: string,
  retryAfter?: number
) {
  const newFailures = currentFailures + 1;

  // If we've failed too many times, escalate to hard failure
  if (newFailures >= FAILURES_BEFORE_HARD_FAIL) {
    await handleHardFailure(sourceId, reasonCode, httpStatus, `${errorMessage} (after ${newFailures} attempts)`);
    return;
  }

  const nextAttempt = calculateNextAttempt(newFailures, retryAfter);

  await prisma.rssSource.update({
    where: { id: sourceId },
    data: {
      status: 'BACKOFF',
      failureReasonCode: reasonCode,
      lastAttemptAt: new Date(),
      nextAttemptAt: nextAttempt,
      consecutiveFailures: newFailures,
      lastHttpStatus: httpStatus,
      lastError: errorMessage,
    },
  });

  console.log(`[RSS Cron] Source ${sourceId}: soft failure (${reasonCode}), retry at ${nextAttempt.toISOString()}`);
}

/**
 * Handle hard failure (requires user action - goes to FAILED)
 */
async function handleHardFailure(
  sourceId: string,
  reasonCode: FailureReasonCode,
  httpStatus: number | null,
  errorMessage: string
) {
  await prisma.rssSource.update({
    where: { id: sourceId },
    data: {
      status: 'FAILED',
      failureReasonCode: reasonCode,
      lastAttemptAt: new Date(),
      nextAttemptAt: null,
      lastHttpStatus: httpStatus,
      lastError: errorMessage,
    },
  });

  console.log(`[RSS Cron] Source ${sourceId}: hard failure (${reasonCode}): ${errorMessage}`);
}

/**
 * Parse Retry-After header value
 */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  // Try parsing as seconds
  const seconds = parseInt(value, 10);
  if (!isNaN(seconds)) {
    return seconds;
  }

  // Try parsing as HTTP date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
  }

  return undefined;
}
