/**
 * Goodreads CSV Parser
 *
 * Handles the Goodreads library export CSV format with edge cases:
 * - Multiple shelves in one cell (comma-separated)
 * - "Favorites" vs "favourites" vs "all-time-favorites" detection
 * - Missing ISBNs (very common)
 * - My Rating = 0 means "not rated"
 * - Duplicate rows (de-dupe by goodreads_book_id)
 * - Variable date formats
 * - Large reviews/notes
 */

export interface ParsedBook {
  goodreadsBookId: string;
  title: string;
  author: string | null;
  isbn: string | null;
  isbn13: string | null;
  myRating: number;
  averageRating: number | null;
  exclusiveShelf: 'read' | 'currently-reading' | 'to-read' | null;
  bookshelves: string[];
  bookshelvesRaw: string;
  dateRead: string | null;
  dateAdded: string | null;
  myReview: string | null;
  privateNotes: string | null;
  readCount: number;
  yearPublished: number | null;
  originalPublicationYear: number | null;
  publisher: string | null;
  numberOfPages: number | null;
  isFavorite: boolean;
}

export interface ImportPreview {
  fiveStarBooks: ParsedBook[];
  favorites: ParsedBook[];
  booksWithNotes: ParsedBook[];
  readBooks: ParsedBook[];
  currentlyReading: ParsedBook[];
  wantToRead: ParsedBook[];
  allBooks: ParsedBook[];
}

// Tokens that indicate a "favorites" shelf
const FAVORITE_TOKENS = [
  'favorite',
  'favourite',
  'favorites',
  'favourites',
  'all-time-favorite',
  'all-time-favorites',
  'all-time-favourite',
  'all-time-favourites',
  'top-books',
  'best-books',
  'loved',
  'loved-it',
];

/**
 * Parse a Goodreads CSV export file
 */
export function parseGoodreadsCSV(csvContent: string): ImportPreview {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVRow(headerLine);

  // Create header index map
  const headerIndex: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerIndex[header.trim()] = index;
  });

  // Validate required headers
  const requiredHeaders = ['Title', 'Author'];
  for (const required of requiredHeaders) {
    if (!(required in headerIndex)) {
      throw new Error(`Missing required column: ${required}. Make sure this is a Goodreads library export.`);
    }
  }

  // Parse all rows
  const books: ParsedBook[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const row = parseCSVRow(line);
      const book = parseBookRow(row, headerIndex);

      if (!book) continue;

      // De-dupe by goodreadsBookId or title+author
      const dedupeKey = book.goodreadsBookId || `${normalizeString(book.title)}:${normalizeString(book.author || '')}`;
      if (seenIds.has(dedupeKey)) continue;
      seenIds.add(dedupeKey);

      books.push(book);
    } catch {
      // Skip malformed rows silently
      continue;
    }
  }

  if (books.length === 0) {
    throw new Error('No valid books found in the CSV file');
  }

  // Categorize books
  const fiveStarBooks = books.filter(b => b.myRating === 5);
  const favorites = books.filter(b => b.isFavorite);
  const booksWithNotes = books.filter(b => b.myReview || b.privateNotes);
  const readBooks = books.filter(b => b.exclusiveShelf === 'read');
  const currentlyReading = books.filter(b => b.exclusiveShelf === 'currently-reading');
  const wantToRead = books.filter(b => b.exclusiveShelf === 'to-read');

  return {
    fiveStarBooks,
    favorites,
    booksWithNotes,
    readBooks,
    currentlyReading,
    wantToRead,
    allBooks: books,
  };
}

/**
 * Parse a single CSV row, handling quoted fields correctly
 */
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Parse a single book row from CSV data
 */
function parseBookRow(row: string[], headerIndex: Record<string, number>): ParsedBook | null {
  const get = (column: string): string => {
    const index = headerIndex[column];
    if (index === undefined) return '';
    return (row[index] || '').trim();
  };

  const title = get('Title');
  if (!title) return null;

  const author = get('Author') || get('Author l-f') || null;
  const goodreadsBookId = get('Book Id') || '';
  const isbn = cleanISBN(get('ISBN'));
  const isbn13 = cleanISBN(get('ISBN13'));
  const myRatingRaw = parseInt(get('My Rating'), 10);
  const myRating = isNaN(myRatingRaw) ? 0 : myRatingRaw;
  const averageRatingRaw = parseFloat(get('Average Rating'));
  const averageRating = isNaN(averageRatingRaw) ? null : averageRatingRaw;

  // Parse exclusive shelf
  const exclusiveShelfRaw = get('Exclusive Shelf').toLowerCase();
  let exclusiveShelf: 'read' | 'currently-reading' | 'to-read' | null = null;
  if (exclusiveShelfRaw === 'read') exclusiveShelf = 'read';
  else if (exclusiveShelfRaw === 'currently-reading') exclusiveShelf = 'currently-reading';
  else if (exclusiveShelfRaw === 'to-read') exclusiveShelf = 'to-read';

  // Parse bookshelves (comma-separated)
  const bookshelvesRaw = get('Bookshelves');
  const bookshelves = bookshelvesRaw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);

  // Detect favorites
  const isFavorite = bookshelves.some(shelf =>
    FAVORITE_TOKENS.some(token => shelf.includes(token))
  );

  // Parse dates (can be blank or various formats)
  const dateRead = parseDate(get('Date Read'));
  const dateAdded = parseDate(get('Date Added'));

  // Parse review/notes
  const myReview = get('My Review') || null;
  const privateNotes = get('Private Notes') || null;

  // Parse read count
  const readCountRaw = parseInt(get('Read Count'), 10);
  const readCount = isNaN(readCountRaw) ? (exclusiveShelf === 'read' ? 1 : 0) : readCountRaw;

  // Parse publication year
  const yearPublishedRaw = parseInt(get('Year Published'), 10);
  const yearPublished = isNaN(yearPublishedRaw) ? null : yearPublishedRaw;
  const originalPublicationYearRaw = parseInt(get('Original Publication Year'), 10);
  const originalPublicationYear = isNaN(originalPublicationYearRaw) ? null : originalPublicationYearRaw;

  // Other metadata
  const publisher = get('Publisher') || null;
  const numberOfPagesRaw = parseInt(get('Number of Pages'), 10);
  const numberOfPages = isNaN(numberOfPagesRaw) ? null : numberOfPagesRaw;

  return {
    goodreadsBookId,
    title,
    author,
    isbn,
    isbn13,
    myRating,
    averageRating,
    exclusiveShelf,
    bookshelves,
    bookshelvesRaw,
    dateRead,
    dateAdded,
    myReview,
    privateNotes,
    readCount,
    yearPublished,
    originalPublicationYear,
    publisher,
    numberOfPages,
    isFavorite,
  };
}

/**
 * Clean ISBN (remove = and quotes that Goodreads adds)
 */
function cleanISBN(raw: string): string | null {
  if (!raw) return null;
  // Goodreads exports ISBNs as ="0123456789" to preserve leading zeros
  const cleaned = raw.replace(/[="]/g, '').trim();
  if (!cleaned || cleaned === '') return null;
  return cleaned;
}

/**
 * Parse a date string in various formats
 * Returns ISO date string or null
 */
function parseDate(raw: string): string | null {
  if (!raw || raw.trim() === '') return null;

  try {
    // Try various date formats
    // Goodreads typically uses: 2023/01/15, 01/15/2023, Jan 15, 2023, etc.
    const date = new Date(raw);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Normalize a string for comparison (lowercase, remove special chars)
 */
function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculate Top 10 candidate score for a book
 * Higher score = stronger candidate
 */
export function calculateTop10Score(book: ParsedBook): number {
  let score = 0;

  // +5 if favorite shelf
  if (book.isFavorite) score += 5;

  // +4 if 5-star
  if (book.myRating === 5) score += 4;

  // +2 if has review/note
  if (book.myReview || book.privateNotes) score += 2;

  // +2 if re-read
  if (book.readCount > 1) score += 2;

  // +1 if date read is older than 2 years (durability signal)
  if (book.dateRead) {
    const readDate = new Date(book.dateRead);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (readDate < twoYearsAgo) score += 1;
  }

  return score;
}

/**
 * Get Top 10 candidates sorted by score
 */
export function getTop10Candidates(books: ParsedBook[], limit = 20): ParsedBook[] {
  return books
    .filter(b => b.myRating >= 4 || b.isFavorite)
    .sort((a, b) => calculateTop10Score(b) - calculateTop10Score(a))
    .slice(0, limit);
}
