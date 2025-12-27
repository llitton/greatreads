import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ParsedBook, ImportPreview, calculateTop10Score } from '@/lib/goodreads/parser';

interface ImportRequest {
  importFiveStars: boolean;
  importFavorites: boolean;
  importShelves: boolean;
  importNotes: boolean;
  visibility: 'friends' | 'private';
  sourcePersonName?: string; // Who these books came from (e.g., "Laura")
  preview: ImportPreview;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { preview, ...options }: ImportRequest = await request.json();

    if (!preview || !preview.allBooks) {
      return NextResponse.json(
        { error: 'Invalid import data. Please upload your file again.' },
        { status: 400 }
      );
    }

    // Determine which books to import based on options
    const booksToImport = new Map<string, ParsedBook>();

    // Add 5-star books if enabled
    if (options.importFiveStars) {
      for (const book of preview.fiveStarBooks) {
        booksToImport.set(book.goodreadsBookId || `${book.title}:${book.author}`, book);
      }
    }

    // Add favorites if enabled
    if (options.importFavorites) {
      for (const book of preview.favorites) {
        booksToImport.set(book.goodreadsBookId || `${book.title}:${book.author}`, book);
      }
    }

    // Add shelves if enabled
    if (options.importShelves) {
      for (const book of [...preview.readBooks, ...preview.currentlyReading, ...preview.wantToRead]) {
        booksToImport.set(book.goodreadsBookId || `${book.title}:${book.author}`, book);
      }
    }

    const progress = {
      added: 0,
      skipped: 0,
      failed: 0,
      total: booksToImport.size,
    };

    const importedAt = new Date();
    const isPublic = options.visibility === 'friends';

    // Process each book
    for (const parsedBook of booksToImport.values()) {
      try {
        // Find or create the book
        let book = await findOrCreateBook(parsedBook);
        if (!book) {
          progress.failed++;
          continue;
        }

        // Check if user already has this book
        const existingStatus = await prisma.userBookStatus.findUnique({
          where: {
            userId_bookId: {
              userId: session.user.id,
              bookId: book.id,
            },
          },
        });

        if (existingStatus) {
          progress.skipped++;
          continue;
        }

        // Determine status
        let status: 'READ' | 'READING' | 'WANT_TO_READ' = 'READ';
        if (parsedBook.exclusiveShelf === 'currently-reading') {
          status = 'READING';
        } else if (parsedBook.exclusiveShelf === 'to-read') {
          status = 'WANT_TO_READ';
        }

        // Create user book status
        // sourcePersonName: who this book came from (defaults to logged-in user's name)
        const sourceName = options.sourcePersonName || session.user.name || 'Unknown';

        await prisma.userBookStatus.create({
          data: {
            userId: session.user.id,
            bookId: book.id,
            status,
            userRating: parsedBook.myRating > 0 ? parsedBook.myRating : null,
            userNotes: options.importNotes ? parsedBook.myReview || parsedBook.privateNotes : null,
            isFavorite: parsedBook.isFavorite,
            isPublic: isPublic && parsedBook.myRating === 5,
            dateRead: parsedBook.dateRead ? new Date(parsedBook.dateRead) : null,
            readCount: parsedBook.readCount,
            importedAt,
            sourcePersonName: sourceName,
          },
        });

        progress.added++;
      } catch (error) {
        console.error('Error importing book:', parsedBook.title, error);
        progress.failed++;
      }
    }

    // Log the import (non-blocking - don't fail import if logging fails)
    try {
      await prisma.goodreadsImport.create({
        data: {
          userId: session.user.id,
          totalBooks: preview.allBooks.length,
          fiveStarBooks: preview.fiveStarBooks.length,
          favorites: preview.favorites.length,
          booksAdded: progress.added,
          booksSkipped: progress.skipped,
          booksFailed: progress.failed,
        },
      });
    } catch (logError) {
      // Log server-side but don't fail the import
      console.error('Failed to log import (non-critical):', logError);
    }

    // Calculate result stats
    const feedBooks = options.importFiveStars && isPublic ? preview.fiveStarBooks.length : 0;
    const stayedWithMe = options.importFavorites ? preview.favorites.length : 0;

    // Calculate Top 10 candidates
    const allImported = Array.from(booksToImport.values());
    const topTenCandidates = allImported
      .filter(b => calculateTop10Score(b) >= 4)
      .length;

    return NextResponse.json({
      success: true,
      progress,
      result: {
        feedBooks: Math.min(feedBooks, progress.added),
        stayedWithMe: Math.min(stayedWithMe, progress.added),
        topTenCandidates,
      },
    });
  } catch (error) {
    // Log full error server-side for debugging
    console.error('Import confirm error:', error);

    // Return safe, user-friendly error codes (never expose raw errors)
    const errorCode = categorizeError(error);

    return NextResponse.json(
      {
        error: 'Import could not be completed',
        errorCode,
        // Never include raw error messages - they leak implementation details
      },
      { status: 500 }
    );
  }
}

/**
 * Categorize errors into safe, user-friendly codes
 */
function categorizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';

  // Database/Prisma errors
  if (message.includes('does not exist') || message.includes('P2021')) {
    return 'STORAGE_NOT_READY';
  }
  if (message.includes('unique constraint') || message.includes('P2002')) {
    return 'DUPLICATE_ENTRY';
  }
  if (message.includes('connection') || message.includes('timeout')) {
    return 'CONNECTION_ERROR';
  }

  // Generic fallback
  return 'IMPORT_FAILED';
}

/**
 * Find or create a book from parsed Goodreads data
 */
async function findOrCreateBook(parsed: ParsedBook) {
  // Try to find by Goodreads book ID first
  if (parsed.goodreadsBookId) {
    const existing = await prisma.book.findFirst({
      where: { goodreadsBookId: parsed.goodreadsBookId },
    });
    if (existing) return existing;
  }

  // Try to find by ISBN13
  if (parsed.isbn13) {
    const existing = await prisma.book.findFirst({
      where: { isbn13: parsed.isbn13 },
    });
    if (existing) return existing;
  }

  // Try to find by ISBN
  if (parsed.isbn) {
    const existing = await prisma.book.findFirst({
      where: { isbn: parsed.isbn },
    });
    if (existing) return existing;
  }

  // Try to find by title + author (normalized match)
  const normalizedTitle = parsed.title.toLowerCase().trim();
  const normalizedAuthor = (parsed.author || '').toLowerCase().trim();

  const existing = await prisma.book.findFirst({
    where: {
      title: { equals: parsed.title, mode: 'insensitive' },
      author: parsed.author ? { equals: parsed.author, mode: 'insensitive' } : null,
    },
  });
  if (existing) return existing;

  // Create new book
  // Try to get cover from Open Library
  const coverUrl = await fetchCoverUrl(parsed);

  return prisma.book.create({
    data: {
      title: parsed.title,
      author: parsed.author,
      goodreadsBookId: parsed.goodreadsBookId || null,
      isbn: parsed.isbn,
      isbn13: parsed.isbn13,
      yearPublished: parsed.yearPublished || parsed.originalPublicationYear,
      coverUrl,
    },
  });
}

/**
 * Try to fetch a cover URL from Open Library
 */
async function fetchCoverUrl(parsed: ParsedBook): Promise<string | null> {
  try {
    // Try ISBN13 first, then ISBN
    const isbn = parsed.isbn13 || parsed.isbn;
    if (isbn) {
      const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
      // Just return the URL - Open Library will return a placeholder if not found
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
