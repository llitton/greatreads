/**
 * Cover Resolution Pipeline
 *
 * Resolves covers from multiple sources and caches them to our CDN.
 * UI should ONLY reference BookCover.imageUrl, never external sources.
 *
 * Resolution order:
 * 1. Open Library (ISBN)
 * 2. Google Books (ISBN)
 * 3. Open Library (title/author search)
 * 4. Google Books (title/author search)
 *
 * Each successful resolution is cached to Vercel Blob.
 */

import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { lookupCover, normalizeIsbn } from './lookup';
import { CoverStatus, CoverSource, CoverConfidence } from '@prisma/client';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

interface ResolveResult {
  success: boolean;
  imageUrl?: string;
  source?: CoverSource;
  confidence?: CoverConfidence;
  error?: string;
}

/**
 * Download an image and upload it to Vercel Blob
 * Returns the blob URL or null if failed
 */
async function cacheImageToBlob(
  sourceUrl: string,
  bookId: string,
  source: CoverSource
): Promise<{ url: string; width?: number; height?: number } | null> {
  try {
    // Download the image
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'GreatReads/1.0 (book cover resolution)',
      },
    });

    if (!response.ok) {
      console.error(`[Cover Resolver] Failed to fetch image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.error(`[Cover Resolver] Not an image: ${contentType}`);
      return null;
    }

    const imageBuffer = await response.arrayBuffer();

    // Check if image is too small (likely a placeholder)
    if (imageBuffer.byteLength < 1000) {
      console.error('[Cover Resolver] Image too small, likely placeholder');
      return null;
    }

    // Determine file extension
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `covers/${bookId}/${source.toLowerCase()}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    console.log(`[Cover Resolver] Cached to blob: ${blob.url}`);

    return {
      url: blob.url,
      // TODO: Could extract dimensions from image if needed
    };
  } catch (error) {
    console.error('[Cover Resolver] Failed to cache image:', error);
    return null;
  }
}

/**
 * Resolve cover for a single book
 * Creates or updates the BookCover record
 */
export async function resolveCover(bookId: string): Promise<ResolveResult> {
  // Get the book with its current cover state
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { resolvedCover: true },
  });

  if (!book) {
    return { success: false, error: 'Book not found' };
  }

  // Check if we already have an active cover
  if (book.resolvedCover?.status === 'ACTIVE' && book.resolvedCover.imageUrl) {
    return {
      success: true,
      imageUrl: book.resolvedCover.imageUrl,
      source: book.resolvedCover.source || undefined,
      confidence: book.resolvedCover.confidence || undefined,
    };
  }

  // Check if we've exceeded max attempts
  const currentAttempts = book.resolvedCover?.attemptCount || 0;
  if (currentAttempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Max attempts exceeded' };
  }

  // Mark as resolving
  const bookCover = await prisma.bookCover.upsert({
    where: { bookId },
    create: {
      bookId,
      status: 'RESOLVING',
      attemptCount: 1,
      lastAttemptAt: new Date(),
    },
    update: {
      status: 'RESOLVING',
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  try {
    // Use the existing lookup function
    const coverResult = await lookupCover(
      book.title,
      book.author,
      book.isbn,
      book.isbn13
    );

    if (!coverResult) {
      // No cover found from any source
      await prisma.bookCover.update({
        where: { id: bookCover.id },
        data: {
          status: 'FAILED',
          failureReason: 'No cover found from any source',
        },
      });
      return { success: false, error: 'No cover found' };
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    let finalUrl: string;
    let width: number | undefined;
    let height: number | undefined;

    if (blobToken) {
      // Cache to Vercel Blob
      const cached = await cacheImageToBlob(
        coverResult.url,
        bookId,
        coverResult.source
      );

      if (cached) {
        finalUrl = cached.url;
        width = cached.width;
        height = cached.height;
      } else {
        // Blob caching failed, use source URL directly (degraded)
        finalUrl = coverResult.url;
        await prisma.bookCover.update({
          where: { id: bookCover.id },
          data: {
            status: 'DEGRADED',
            imageUrl: finalUrl,
            source: coverResult.source,
            sourceUrl: coverResult.url,
            confidence: coverResult.confidence,
            failureReason: 'Blob caching failed, using source URL',
            resolvedAt: new Date(),
          },
        });
        return {
          success: true,
          imageUrl: finalUrl,
          source: coverResult.source,
          confidence: coverResult.confidence,
        };
      }
    } else {
      // No blob token, use source URL directly (degraded mode)
      finalUrl = coverResult.url;
      console.log('[Cover Resolver] No BLOB_READ_WRITE_TOKEN, using degraded mode');
    }

    // Update BookCover with success
    await prisma.bookCover.update({
      where: { id: bookCover.id },
      data: {
        status: blobToken ? 'ACTIVE' : 'DEGRADED',
        imageUrl: finalUrl,
        width,
        height,
        aspectRatio: width && height ? width / height : null,
        source: coverResult.source,
        sourceId: normalizeIsbn(book.isbn13) || normalizeIsbn(book.isbn) || null,
        sourceUrl: coverResult.url,
        confidence: coverResult.confidence,
        failureReason: null,
        resolvedAt: new Date(),
      },
    });

    return {
      success: true,
      imageUrl: finalUrl,
      source: coverResult.source,
      confidence: coverResult.confidence,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.bookCover.update({
      where: { id: bookCover.id },
      data: {
        status: 'FAILED',
        failureReason: errorMessage,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Batch resolve covers for multiple books
 */
export async function resolveCoversBatch(
  bookIds: string[],
  options?: {
    delayBetweenMs?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<Map<string, ResolveResult>> {
  const results = new Map<string, ResolveResult>();
  const delay = options?.delayBetweenMs || RETRY_DELAY_MS;

  for (let i = 0; i < bookIds.length; i++) {
    const bookId = bookIds[i];
    const result = await resolveCover(bookId);
    results.set(bookId, result);

    if (options?.onProgress) {
      options.onProgress(i + 1, bookIds.length);
    }

    // Delay between requests to avoid rate limiting
    if (i < bookIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Get the best cover URL for a book
 * Returns cached URL if available, or initiates resolution
 */
export async function getCoverUrl(bookId: string): Promise<string | null> {
  const bookCover = await prisma.bookCover.findUnique({
    where: { bookId },
  });

  // If we have an active or degraded cover, return it
  if (bookCover && (bookCover.status === 'ACTIVE' || bookCover.status === 'DEGRADED')) {
    return bookCover.imageUrl;
  }

  // If pending or no record, try to resolve
  if (!bookCover || bookCover.status === 'PENDING') {
    const result = await resolveCover(bookId);
    return result.imageUrl || null;
  }

  // If failed and under max attempts, retry
  if (bookCover.status === 'FAILED' && bookCover.attemptCount < MAX_ATTEMPTS) {
    const result = await resolveCover(bookId);
    return result.imageUrl || null;
  }

  return null;
}

/**
 * Get books that need cover resolution
 */
export async function getBooksNeedingCovers(limit: number = 50): Promise<string[]> {
  // Find books that either:
  // 1. Have no BookCover record
  // 2. Have PENDING or FAILED status with attempts < MAX
  const books = await prisma.book.findMany({
    where: {
      OR: [
        { resolvedCover: null },
        {
          resolvedCover: {
            status: 'PENDING',
          },
        },
        {
          resolvedCover: {
            status: 'FAILED',
            attemptCount: { lt: MAX_ATTEMPTS },
          },
        },
      ],
    },
    select: { id: true },
    take: limit,
  });

  return books.map((b) => b.id);
}
