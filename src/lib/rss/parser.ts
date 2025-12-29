import Parser from 'rss-parser';
import crypto from 'crypto';

// User-Agent to avoid being blocked by Goodreads/other sites
const USER_AGENT = 'GreatReads/1.0 (RSS Reader; +https://greatreads.app)';

// Check if response body looks like RSS/Atom feed
function isRSSContent(body: string): boolean {
  const trimmed = body.trim().substring(0, 500).toLowerCase();
  return (
    trimmed.includes('<rss') ||
    trimmed.includes('<feed') ||
    trimmed.includes('<?xml') && (trimmed.includes('<rss') || trimmed.includes('<feed') || trimmed.includes('<channel'))
  );
}

// Get a helpful error message based on response content
function getResponseErrorMessage(body: string, url: string): string {
  const trimmed = body.trim().substring(0, 1000).toLowerCase();

  // HTML page returned (common when URL isn't RSS)
  if (trimmed.includes('<!doctype html') || trimmed.includes('<html')) {
    if (url.includes('goodreads.com')) {
      if (url.includes('/review/list/') && !url.includes('/review/list_rss/')) {
        return 'This is a Goodreads profile page, not an RSS feed. Try converting it to: goodreads.com/review/list_rss/[user_id]?shelf=read';
      }
      return 'Goodreads returned an HTML page instead of RSS. Make sure the URL includes "list_rss" and the shelf parameter (e.g., ?shelf=read)';
    }
    return 'This URL returned an HTML page, not an RSS feed. Check that the URL points directly to an RSS/Atom feed.';
  }

  // Empty response
  if (!trimmed) {
    return 'The URL returned an empty response';
  }

  return 'The URL did not return valid RSS/Atom content';
}

export interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  creator?: string;
  'dc:creator'?: string;
}

export interface ParsedFiveStarEvent {
  externalGuid: string;
  bookTitle: string;
  bookAuthor: string | null;
  friendName: string;
  rating: number;
  reviewText: string | null;
  eventUrl: string | null;
  eventDate: Date | null;
  goodreadsBookUrl: string | null;
  coverUrl: string | null;
  rawPayload: RSSItem;
}

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
      ['user_read_at', 'userReadAt'],
      ['user_date_added', 'userDateAdded'],
      ['user_shelves', 'userShelves'],
      ['average_rating', 'averageRating'],
      ['book_published', 'bookPublished'],
      ['description', 'description'],
    ],
  },
});

// Patterns to detect 5-star ratings in Goodreads RSS
const FIVE_STAR_PATTERNS = [
  // Direct rating patterns
  /rated it (?:5|five) (?:out of 5 )?stars?/i,
  /gave it 5 stars?/i,
  /5 of 5 stars/i,
  /\[5 stars?\]/i,
  /★★★★★/,
  /⭐⭐⭐⭐⭐/,
  /\(5\/5\)/,
  /rating:\s*5/i,
  // Added to shelves with rating
  /added.*5\s*stars?/i,
  // Review title patterns
  /5-star review/i,
  /five-star review/i,
];

// Patterns to extract rating number
const RATING_EXTRACT_PATTERNS = [
  /rated it (\d) (?:out of 5 )?stars?/i,
  /gave it (\d) stars?/i,
  /(\d) of 5 stars/i,
  /\[(\d) stars?\]/i,
  /rating:\s*(\d)/i,
];

// Patterns to extract book title and author
const BOOK_PATTERNS = [
  // "Title by Author" pattern
  /^(.+?)\s+by\s+(.+?)(?:\s*[-–—]|\s*\(|\s*$)/i,
  // "reviewed Title" pattern
  /reviewed\s+(.+?)\s+by\s+(.+?)(?:\s*[-–—]|\s*\(|\s*$)/i,
  // "rated Title by Author" pattern
  /rated\s+(.+?)\s+by\s+(.+?)(?:\s*[-–—]|\s*\(|\s*$)/i,
  // Title only fallback
  /^(.+?)(?:\s*[-–—]\s*.+)?$/,
];

export function generateStableGuid(rssUrl: string, item: RSSItem): string {
  // Use existing GUID if present
  if (item.guid) {
    return item.guid;
  }

  // Generate stable hash from key attributes
  const hashInput = [
    rssUrl,
    item.link || '',
    item.title || '',
    item.pubDate || '',
  ].join('|');

  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);
}

export function detectRating(item: RSSItem): number | null {
  const textToSearch = [
    item.title || '',
    item.content || '',
    item.contentSnippet || '',
  ].join(' ');

  // First try to extract exact rating
  for (const pattern of RATING_EXTRACT_PATTERNS) {
    const match = textToSearch.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  // Check for 5-star specific patterns
  for (const pattern of FIVE_STAR_PATTERNS) {
    if (pattern.test(textToSearch)) {
      return 5;
    }
  }

  // Check for userRating in custom fields (Goodreads shelf RSS)
  const anyItem = item as Record<string, unknown>;
  if (anyItem.userRating) {
    const rating = parseInt(String(anyItem.userRating), 10);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      return rating;
    }
  }

  return null;
}

export function isFiveStarEvent(item: RSSItem): boolean {
  const rating = detectRating(item);
  return rating === 5;
}

// Expanded definition: a book is "loved" if any of these are true:
// - Rated 5 stars
// - Rated 4+ stars AND has a review
// - Shelved as "favorites"
export function isLovedEvent(item: RSSItem): boolean {
  const rating = detectRating(item);
  const anyItem = item as Record<string, unknown>;

  // 5 stars always counts
  if (rating === 5) {
    return true;
  }

  // 4 stars with a meaningful review counts
  if (rating === 4) {
    const reviewText = extractReviewText(item);
    if (reviewText && reviewText.length > 30) {
      return true;
    }
  }

  // Check for favorites shelf
  const shelves = String(anyItem.userShelves || '').toLowerCase();
  if (shelves.includes('favorite') || shelves.includes('favourites') || shelves.includes('loved')) {
    return true;
  }

  return false;
}

export function extractBookInfo(item: RSSItem): { title: string; author: string | null } {
  const anyItem = item as Record<string, unknown>;

  // Check for Goodreads shelf RSS custom fields first
  if (anyItem.authorName) {
    // Extract title from item title, removing rating info
    let title = (item.title || '').replace(/\s*[-–—]?\s*(?:\d stars?|rated it.*|review of.*)$/i, '').trim();

    // If title contains "by Author", extract just the title part
    const byMatch = title.match(/^(.+?)\s+by\s+/i);
    if (byMatch) {
      title = byMatch[1].trim();
    }

    return {
      title: title || 'Unknown Title',
      author: String(anyItem.authorName),
    };
  }

  const titleText = item.title || '';

  // Try to extract title and author from various patterns
  for (const pattern of BOOK_PATTERNS) {
    const match = titleText.match(pattern);
    if (match) {
      if (match[2]) {
        // Found both title and author
        return {
          title: match[1].trim(),
          author: match[2].trim(),
        };
      } else if (match[1]) {
        // Found title only
        return {
          title: match[1].trim(),
          author: null,
        };
      }
    }
  }

  return {
    title: titleText || 'Unknown Title',
    author: null,
  };
}

export function extractFriendName(item: RSSItem, rssLabel: string): string {
  const anyItem = item as Record<string, unknown>;

  // Check for userName in custom fields
  if (anyItem.userName) {
    return String(anyItem.userName);
  }

  // Check dc:creator
  if (item.creator) {
    return item.creator;
  }

  // Fall back to the label provided by user
  return rssLabel;
}

export function extractReviewText(item: RSSItem): string | null {
  // Check content/description for review text
  const content = item.content || item.contentSnippet || '';

  // Remove HTML tags and clean up
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

  // Don't return if it's just metadata
  if (cleanContent.length < 20 || /^(rated it|added|wants to read)/i.test(cleanContent)) {
    return null;
  }

  return cleanContent.substring(0, 1000); // Limit length
}

export function extractEventDate(item: RSSItem): Date | null {
  const anyItem = item as Record<string, unknown>;

  // Try isoDate first (most reliable)
  if (item.isoDate) {
    const date = new Date(item.isoDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try pubDate
  if (item.pubDate) {
    const date = new Date(item.pubDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try userReadAt or userDateAdded for shelf RSS
  if (anyItem.userReadAt) {
    const date = new Date(String(anyItem.userReadAt));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  if (anyItem.userDateAdded) {
    const date = new Date(String(anyItem.userDateAdded));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

export function extractCoverUrl(item: RSSItem): string | null {
  const anyItem = item as Record<string, unknown>;

  // Check Goodreads custom fields for images
  const imageFields = ['bookLargeImageUrl', 'bookMediumImageUrl', 'bookImageUrl', 'bookSmallImageUrl'];

  for (const field of imageFields) {
    if (anyItem[field]) {
      const url = String(anyItem[field]);
      if (url && url.startsWith('http')) {
        return url;
      }
    }
  }

  // Try to extract from content HTML
  const content = item.content || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

export function extractBookUrl(item: RSSItem): string | null {
  // The item link is usually the book URL on Goodreads
  if (item.link && item.link.includes('goodreads.com')) {
    return item.link;
  }
  return null;
}

export async function fetchAndParseRSS(
  rssUrl: string,
  friendLabel: string,
  lastEtag?: string | null,
  lastModified?: string | null
): Promise<{
  items: ParsedFiveStarEvent[];
  etag: string | null;
  lastModified: string | null;
  notModified: boolean;
}> {
  try {
    // Make request with conditional headers and User-Agent
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
    };
    if (lastEtag) {
      headers['If-None-Match'] = lastEtag;
    }
    if (lastModified) {
      headers['If-Modified-Since'] = lastModified;
    }

    const response = await fetch(rssUrl, {
      headers,
      next: { revalidate: 0 }, // Don't cache in Next.js
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      return {
        items: [],
        etag: lastEtag || null,
        lastModified: lastModified || null,
        notModified: true,
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();

    // Validate that this is actually RSS/Atom content
    if (!isRSSContent(xml)) {
      throw new Error(getResponseErrorMessage(xml, rssUrl));
    }

    const feed = await parser.parseString(xml);

    // Extract response headers for caching
    const newEtag = response.headers.get('etag');
    const newLastModified = response.headers.get('last-modified');

    // Filter and parse loved events (5-star, 4-star with review, favorites)
    const lovedEvents: ParsedFiveStarEvent[] = [];

    for (const item of feed.items) {
      if (isLovedEvent(item)) {
        const bookInfo = extractBookInfo(item);
        const rating = detectRating(item) || 5; // Default to 5 for favorites shelf

        lovedEvents.push({
          externalGuid: generateStableGuid(rssUrl, item),
          bookTitle: bookInfo.title,
          bookAuthor: bookInfo.author,
          friendName: extractFriendName(item, friendLabel),
          rating,
          reviewText: extractReviewText(item),
          eventUrl: item.link || null,
          eventDate: extractEventDate(item),
          goodreadsBookUrl: extractBookUrl(item),
          coverUrl: extractCoverUrl(item),
          rawPayload: item,
        });
      }
    }

    return {
      items: lovedEvents,
      etag: newEtag,
      lastModified: newLastModified,
      notModified: false,
    };
  } catch (error) {
    console.error('Error fetching RSS:', error);
    throw error;
  }
}

export async function testRSSFeed(
  rssUrl: string
): Promise<{
  success: boolean;
  totalItems: number;
  fiveStarItems: number;
  sampleItems: Array<{
    title: string;
    author: string | null;
    rating: number | null;
    isFiveStar: boolean;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        success: false,
        totalItems: 0,
        fiveStarItems: 0,
        sampleItems: [],
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      };
    }

    const xml = await response.text();

    // Validate that this is actually RSS/Atom content
    if (!isRSSContent(xml)) {
      return {
        success: false,
        totalItems: 0,
        fiveStarItems: 0,
        sampleItems: [],
        error: getResponseErrorMessage(xml, rssUrl),
      };
    }

    const feed = await parser.parseString(xml);

    const sampleItems = feed.items.slice(0, 5).map((item) => {
      const bookInfo = extractBookInfo(item);
      const rating = detectRating(item);
      return {
        title: bookInfo.title,
        author: bookInfo.author,
        rating,
        isFiveStar: rating === 5,
        isLoved: isLovedEvent(item),
      };
    });

    const lovedCount = feed.items.filter((item) => isLovedEvent(item)).length;

    return {
      success: true,
      totalItems: feed.items.length,
      fiveStarItems: lovedCount, // Now counts all "loved" books
      sampleItems,
    };
  } catch (error) {
    return {
      success: false,
      totalItems: 0,
      fiveStarItems: 0,
      sampleItems: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
