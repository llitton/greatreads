/**
 * Cover lookup library
 *
 * Resolution order:
 * 1. Open Library ISBN cover (highest confidence)
 * 2. Google Books by ISBN (fallback for ISBN)
 * 3. Open Library search by title/author (medium confidence)
 * 4. Google Books search by title/author (lowest fallback)
 */

import { CoverSource, CoverConfidence } from '@prisma/client';

export interface CoverResult {
  url: string;
  source: CoverSource;
  confidence: CoverConfidence;
}

interface OpenLibrarySearchDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
}

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
}

interface GoogleBooksItem {
  volumeInfo: GoogleBooksVolumeInfo;
}

/**
 * Normalize ISBN values from Goodreads exports
 * Goodreads often exports ISBN in weird formats (Excel-safe strings, quotes, etc.)
 */
export function normalizeIsbn(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Convert to string and trim
  let isbn = String(raw).trim();

  // Remove leading = (Excel formula protection)
  if (isbn.startsWith('=')) {
    isbn = isbn.slice(1);
  }

  // Remove surrounding quotes
  isbn = isbn.replace(/^["']|["']$/g, '');

  // Remove hyphens and spaces
  isbn = isbn.replace(/[-\s]/g, '');

  // Check for nan/null/empty strings
  if (!isbn || isbn.toLowerCase() === 'nan' || isbn === '0') {
    return null;
  }

  // Validate: ISBN-10 is 10 chars, ISBN-13 is 13 chars
  if (isbn.length !== 10 && isbn.length !== 13) {
    return null;
  }

  // Basic character validation (digits, with X allowed for ISBN-10 check digit)
  if (!/^[\dXx]+$/.test(isbn)) {
    return null;
  }

  return isbn.toUpperCase();
}

/**
 * Create a normalized cache key from title/author
 */
export function createTitleAuthorKey(title: string, author: string | null): string {
  const normalized = `${title}|${author || ''}`
    .toLowerCase()
    .replace(/[^\w\s|]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
  return normalized;
}

/**
 * Calculate similarity between two strings (simple Jaccard-like)
 */
function similarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...aWords].filter(x => bWords.has(x)));
  const union = new Set([...aWords, ...bWords]);

  return intersection.size / union.size;
}

/**
 * Try to fetch cover from Open Library by ISBN
 */
async function tryOpenLibraryIsbn(isbn: string): Promise<string | null> {
  // Try sizes in order: Large, Medium, Small
  const sizes = ['L', 'M', 'S'];

  for (const size of sizes) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        // Return the large size URL even if we found a smaller one
        return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
    } catch {
      // Continue to next size
    }
  }

  return null;
}

/**
 * Try to fetch cover from Open Library by title/author search
 */
async function tryOpenLibrarySearch(
  title: string,
  author: string | null
): Promise<{ url: string; confidence: CoverConfidence } | null> {
  const params = new URLSearchParams({
    title: title,
    limit: '5',
  });
  if (author) {
    params.set('author', author);
  }

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) return null;

    const data = await response.json();
    const docs: OpenLibrarySearchDoc[] = data.docs || [];

    // Find the best match with a cover
    for (const doc of docs) {
      if (!doc.cover_i) continue;

      // Calculate title similarity
      const titleSim = similarity(title, doc.title || '');

      // Check author match if we have both
      let authorMatch = true;
      if (author && doc.author_name) {
        authorMatch = doc.author_name.some(
          (a) => similarity(author, a) > 0.5
        );
      }

      if (titleSim > 0.6 && authorMatch) {
        const confidence: CoverConfidence = titleSim > 0.8 ? 'MEDIUM' : 'LOW';
        return {
          url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
          confidence,
        };
      }
    }
  } catch (error) {
    console.error('[Cover] Open Library search failed:', error);
  }

  return null;
}

/**
 * Try to fetch cover from Google Books by ISBN
 */
async function tryGoogleBooksIsbn(isbn: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${keyParam}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const items: GoogleBooksItem[] = data.items || [];

    if (items.length > 0 && items[0].volumeInfo.imageLinks) {
      const links = items[0].volumeInfo.imageLinks;
      // Prefer larger sizes, upgrade HTTP to HTTPS
      const url = links.large || links.medium || links.small || links.thumbnail;
      return url?.replace('http://', 'https://') || null;
    }
  } catch (error) {
    console.error('[Cover] Google Books ISBN lookup failed:', error);
  }

  return null;
}

/**
 * Try to fetch cover from Google Books by title/author search
 */
async function tryGoogleBooksSearch(
  title: string,
  author: string | null
): Promise<{ url: string; confidence: CoverConfidence } | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';

  // Build query
  let query = `intitle:${encodeURIComponent(title)}`;
  if (author) {
    query += `+inauthor:${encodeURIComponent(author)}`;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5${keyParam}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const items: GoogleBooksItem[] = data.items || [];

    // Find the best match with a cover
    for (const item of items) {
      const info = item.volumeInfo;
      if (!info.imageLinks) continue;

      // Calculate title similarity
      const titleSim = similarity(title, info.title || '');

      // Check author match if we have both
      let authorMatch = true;
      if (author && info.authors) {
        authorMatch = info.authors.some((a) => similarity(author, a) > 0.5);
      }

      if (titleSim > 0.6 && authorMatch) {
        const links = info.imageLinks;
        const url = links.large || links.medium || links.small || links.thumbnail;
        if (url) {
          const confidence: CoverConfidence = titleSim > 0.8 ? 'MEDIUM' : 'LOW';
          return {
            url: url.replace('http://', 'https://'),
            confidence,
          };
        }
      }
    }
  } catch (error) {
    console.error('[Cover] Google Books search failed:', error);
  }

  return null;
}

/**
 * Main lookup function - tries all sources in order
 */
export async function lookupCover(
  title: string,
  author: string | null,
  isbn: string | null,
  isbn13: string | null
): Promise<CoverResult | null> {
  // Normalize ISBNs
  const normalizedIsbn = normalizeIsbn(isbn);
  const normalizedIsbn13 = normalizeIsbn(isbn13);
  const bestIsbn = normalizedIsbn13 || normalizedIsbn;

  // 1. Try Open Library by ISBN (highest confidence)
  if (bestIsbn) {
    const olIsbnUrl = await tryOpenLibraryIsbn(bestIsbn);
    if (olIsbnUrl) {
      console.log(`[Cover] Found via Open Library ISBN: ${bestIsbn}`);
      return {
        url: olIsbnUrl,
        source: 'OPENLIBRARY_ISBN',
        confidence: 'HIGH',
      };
    }

    // 2. Try Google Books by ISBN
    const gbIsbnUrl = await tryGoogleBooksIsbn(bestIsbn);
    if (gbIsbnUrl) {
      console.log(`[Cover] Found via Google Books ISBN: ${bestIsbn}`);
      return {
        url: gbIsbnUrl,
        source: 'GOOGLEBOOKS',
        confidence: 'HIGH',
      };
    }
  }

  // 3. Try Open Library search by title/author
  const olSearch = await tryOpenLibrarySearch(title, author);
  if (olSearch) {
    console.log(`[Cover] Found via Open Library search: ${title}`);
    return {
      url: olSearch.url,
      source: 'OPENLIBRARY_SEARCH',
      confidence: olSearch.confidence,
    };
  }

  // 4. Try Google Books search by title/author
  const gbSearch = await tryGoogleBooksSearch(title, author);
  if (gbSearch) {
    console.log(`[Cover] Found via Google Books search: ${title}`);
    return {
      url: gbSearch.url,
      source: 'GOOGLEBOOKS',
      confidence: gbSearch.confidence,
    };
  }

  console.log(`[Cover] No cover found for: ${title}`);
  return null;
}
