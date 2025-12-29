/**
 * Goodreads URL Utilities
 *
 * Handles conversion between Goodreads page URLs and RSS feed URLs.
 *
 * CRITICAL: Goodreads RSS feeds use a different URL pattern than web pages:
 * - Page: https://www.goodreads.com/review/list/USER_ID?shelf=read
 * - RSS:  https://www.goodreads.com/review/list_rss/USER_ID?shelf=read
 *
 * The RSS URL MUST have "list_rss" not "list" - otherwise you get HTML.
 */

export interface GoodreadsNormalizationResult {
  url: string;
  userId: string | null;
  converted: boolean;
  error?: string;
}

/**
 * Extract a Goodreads user ID from various URL formats
 */
export function extractGoodreadsUserId(input: string): string | null {
  // Pattern 1: /review/list/USER_ID or /review/list_rss/USER_ID
  const listMatch = input.match(/goodreads\.com\/review\/list(?:_rss)?\/(\d+)/i);
  if (listMatch) {
    return listMatch[1];
  }

  // Pattern 2: /user/show/USER_ID
  const profileMatch = input.match(/goodreads\.com\/user\/show\/(\d+)/i);
  if (profileMatch) {
    return profileMatch[1];
  }

  // Pattern 3: Just a numeric ID
  const numericMatch = input.match(/^(\d{6,})$/);
  if (numericMatch) {
    return numericMatch[1];
  }

  return null;
}

/**
 * Normalize any Goodreads URL or user ID to a valid RSS feed URL
 *
 * Accepts:
 * - goodreads.com/review/list/12345?shelf=read (converts to RSS)
 * - goodreads.com/review/list_rss/12345?shelf=read (keeps as-is)
 * - goodreads.com/user/show/12345 (converts to RSS)
 * - 12345 (just user ID, builds RSS URL)
 *
 * Returns a properly formatted RSS URL with shelf=read default
 */
export function normalizeGoodreadsUrl(input: string): GoodreadsNormalizationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      url: '',
      userId: null,
      converted: false,
      error: 'No URL provided',
    };
  }

  // Check if it's already a valid RSS URL
  if (trimmed.includes('list_rss')) {
    const userId = extractGoodreadsUserId(trimmed);
    return {
      url: trimmed,
      userId,
      converted: false,
    };
  }

  // Try to extract user ID
  const userId = extractGoodreadsUserId(trimmed);

  if (!userId) {
    // Not a Goodreads URL we recognize
    return {
      url: trimmed,
      userId: null,
      converted: false,
      error: "We couldn't find a Goodreads user ID in that link.",
    };
  }

  // Extract query params from original URL
  let queryString = '?shelf=read'; // default
  try {
    if (trimmed.startsWith('http')) {
      const urlObj = new URL(trimmed);
      const params = urlObj.searchParams;

      // Preserve shelf if provided, default to 'read'
      if (!params.has('shelf')) {
        params.set('shelf', 'read');
      }

      queryString = '?' + params.toString();
    }
  } catch {
    // If URL parsing fails, use default
  }

  // Build the RSS URL
  const rssUrl = `https://www.goodreads.com/review/list_rss/${userId}${queryString}`;

  return {
    url: rssUrl,
    userId,
    converted: true,
  };
}

/**
 * Check if a URL is a Goodreads page (not RSS)
 */
export function isGoodreadsPageUrl(url: string): boolean {
  return (
    url.includes('goodreads.com') &&
    !url.includes('list_rss') &&
    (url.includes('/review/list/') || url.includes('/user/show/'))
  );
}

/**
 * Check if a URL is already a Goodreads RSS URL
 */
export function isGoodreadsRssUrl(url: string): boolean {
  return url.includes('goodreads.com') && url.includes('list_rss');
}

/**
 * Get a friendly name for a Goodreads source (for attribution)
 * Returns null if not a Goodreads URL
 */
export function getGoodreadsSourceLabel(url: string): string | null {
  const userId = extractGoodreadsUserId(url);
  if (!userId) return null;

  // Extract shelf name if present
  try {
    const urlObj = new URL(url);
    const shelf = urlObj.searchParams.get('shelf');
    if (shelf && shelf !== 'read') {
      return `Goodreads (${shelf} shelf)`;
    }
  } catch {
    // Ignore
  }

  return 'Goodreads';
}
