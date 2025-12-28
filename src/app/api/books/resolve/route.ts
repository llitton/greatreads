import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * POST /api/books/resolve
 *
 * Resolves a book by query (title/author), ISBN, or URL.
 * If the book exists, returns the existing record.
 * If not, fetches metadata from providers and creates a new Book.
 *
 * Provider order:
 * 1. If ISBN: Open Library by ISBN
 * 2. Else: Open Library search by title/author
 * 3. Fallback: Google Books
 */

const resolveSchema = z.object({
  query: z.string().optional(),
  isbn: z.string().optional(),
  url: z.string().optional(),
  // Manual entry fields
  title: z.string().optional(),
  author: z.string().optional(),
}).refine(
  (data) => data.query || data.isbn || data.url || data.title,
  { message: 'Must provide query, isbn, url, or title' }
);

interface ResolvedBook {
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  source: 'existing' | 'openlibrary' | 'googlebooks' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  isNew: boolean;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = resolveSchema.parse(body);

    // Extract ISBN from URL if provided
    let isbn = input.isbn;
    let searchQuery = input.query;

    if (input.url) {
      const extracted = extractFromUrl(input.url);
      if (extracted.isbn) isbn = extracted.isbn;
      if (extracted.title) searchQuery = extracted.title;
    }

    // Normalize ISBN
    if (isbn) {
      const normalized = normalizeIsbn(isbn);
      isbn = normalized || undefined;
    }

    // 1. Try to find existing book by ISBN
    if (isbn) {
      const existing = await prisma.book.findFirst({
        where: {
          OR: [
            { isbn: isbn },
            { isbn13: isbn },
          ],
        },
      });

      if (existing) {
        return NextResponse.json({
          bookId: existing.id,
          title: existing.title,
          author: existing.author,
          coverUrl: existing.coverUrl,
          source: 'existing',
          confidence: 'high',
          isNew: false,
        } satisfies ResolvedBook);
      }
    }

    // 2. Try to find existing book by normalized title/author
    if (searchQuery || input.title) {
      const searchTitle = input.title || searchQuery;
      const normalized = normalizeForMatch(searchTitle || '');

      if (normalized) {
        const existing = await prisma.book.findFirst({
          where: {
            title: {
              contains: normalized.substring(0, 20),
              mode: 'insensitive',
            },
          },
        });

        if (existing && isTitleMatch(existing.title, searchTitle || '')) {
          return NextResponse.json({
            bookId: existing.id,
            title: existing.title,
            author: existing.author,
            coverUrl: existing.coverUrl,
            source: 'existing',
            confidence: 'medium',
            isNew: false,
          } satisfies ResolvedBook);
        }
      }
    }

    // 3. Fetch from Open Library
    let bookData: { title: string; author: string | null; coverUrl: string | null; isbn13: string | null } | null = null;

    if (isbn) {
      bookData = await fetchFromOpenLibraryByIsbn(isbn);
    }

    if (!bookData && (searchQuery || input.title)) {
      bookData = await fetchFromOpenLibraryBySearch(input.title || searchQuery || '', input.author);
    }

    // 4. Fallback to Google Books
    if (!bookData && (searchQuery || input.title || isbn)) {
      bookData = await fetchFromGoogleBooks(input.title || searchQuery || '', input.author, isbn);
    }

    // 5. Manual entry as last resort
    if (!bookData && input.title) {
      bookData = {
        title: input.title,
        author: input.author || null,
        coverUrl: null,
        isbn13: isbn || null,
      };
    }

    if (!bookData) {
      return NextResponse.json(
        { error: 'Could not find book. Try entering title and author manually.' },
        { status: 404 }
      );
    }

    // Create the book
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        isbn13: bookData.isbn13,
        isbn: isbn || null,
      },
    });

    return NextResponse.json({
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      source: bookData.coverUrl ? 'openlibrary' : 'manual',
      confidence: bookData.coverUrl ? 'high' : 'low',
      isNew: true,
    } satisfies ResolvedBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Book resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve book' }, { status: 500 });
  }
}

/**
 * Extract ISBN or title from various URL formats
 */
function extractFromUrl(url: string): { isbn: string | null; title: string | null } {
  try {
    // Goodreads: /book/show/12345.Title_Here or /book/isbn/1234567890
    const goodreadsIsbn = url.match(/goodreads\.com\/book\/isbn\/(\d{10,13})/i);
    if (goodreadsIsbn) {
      return { isbn: goodreadsIsbn[1], title: null };
    }

    const goodreadsBook = url.match(/goodreads\.com\/book\/show\/\d+[.-]?([\w-]+)?/i);
    if (goodreadsBook && goodreadsBook[1]) {
      // Convert URL slug to title: "The_Great_Gatsby" -> "The Great Gatsby"
      const title = goodreadsBook[1].replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { isbn: null, title };
    }

    // Amazon: /dp/ISBN or /gp/product/ISBN
    const amazonIsbn = url.match(/amazon\.[a-z.]+\/(dp|gp\/product)\/(\d{10}|\d{13})/i);
    if (amazonIsbn) {
      return { isbn: amazonIsbn[2], title: null };
    }

    // Direct ISBN in URL
    const isbnMatch = url.match(/\b(\d{10}|\d{13})\b/);
    if (isbnMatch) {
      return { isbn: isbnMatch[1], title: null };
    }

    return { isbn: null, title: null };
  } catch {
    return { isbn: null, title: null };
  }
}

/**
 * Normalize ISBN (remove hyphens, validate format)
 */
function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[-\s]/g, '');
  if (/^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Normalize title for matching
 */
function normalizeForMatch(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two titles are a match
 */
function isTitleMatch(a: string, b: string): boolean {
  const normA = normalizeForMatch(a);
  const normB = normalizeForMatch(b);
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

/**
 * Fetch book data from Open Library by ISBN
 */
async function fetchFromOpenLibraryByIsbn(
  isbn: string
): Promise<{ title: string; author: string | null; coverUrl: string | null; isbn13: string | null } | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const bookData = data[`ISBN:${isbn}`];

    if (!bookData) return null;

    // Check if cover exists
    const coverUrl = bookData.cover?.medium || bookData.cover?.large || null;

    // Get author
    const author = bookData.authors?.[0]?.name || null;

    return {
      title: bookData.title,
      author,
      coverUrl,
      isbn13: isbn.length === 13 ? isbn : null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch book data from Open Library by search
 */
async function fetchFromOpenLibraryBySearch(
  title: string,
  author?: string
): Promise<{ title: string; author: string | null; coverUrl: string | null; isbn13: string | null } | null> {
  try {
    const query = author ? `${title} ${author}` : title;
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const doc = data.docs?.[0];

    if (!doc) return null;

    // Get cover URL from cover_i
    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null;

    // Get ISBN13
    const isbn13 = doc.isbn?.find((i: string) => i.length === 13) || null;

    return {
      title: doc.title,
      author: doc.author_name?.[0] || null,
      coverUrl,
      isbn13,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch book data from Google Books
 */
async function fetchFromGoogleBooks(
  title: string,
  author?: string,
  isbn?: string | null
): Promise<{ title: string; author: string | null; coverUrl: string | null; isbn13: string | null } | null> {
  try {
    let query = isbn ? `isbn:${isbn}` : title;
    if (!isbn && author) {
      query += ` inauthor:${author}`;
    }

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];

    if (!item) return null;

    const volumeInfo = item.volumeInfo;

    // Get cover URL (prefer larger images)
    let coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null;
    if (coverUrl) {
      // Upgrade to larger image
      coverUrl = coverUrl.replace('zoom=1', 'zoom=2');
    }

    // Get ISBN13
    const identifiers = volumeInfo.industryIdentifiers || [];
    const isbn13 = identifiers.find((id: { type: string; identifier: string }) => id.type === 'ISBN_13')?.identifier || null;

    return {
      title: volumeInfo.title,
      author: volumeInfo.authors?.[0] || null,
      coverUrl,
      isbn13,
    };
  } catch {
    return null;
  }
}
