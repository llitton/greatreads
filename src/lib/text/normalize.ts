/**
 * Text normalization utilities for cleaning imported data
 *
 * Goodreads exports contain HTML entities and formatting that
 * needs to be converted to clean, readable text.
 */

/**
 * Clean HTML and entities from Goodreads notes/reviews
 * Converts HTML formatting to plain text while preserving line breaks
 */
export function normalizeGoodreadsText(html: string | null | undefined): string {
  if (!html) return '';

  return html
    // Replace <br> and <br/> with newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Replace </p> with double newlines
    .replace(/<\/p>/gi, '\n\n')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Check if text has meaningful content after normalization
 */
export function hasContent(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = normalizeGoodreadsText(text);
  return normalized.length > 0;
}

/**
 * Truncate text to a max length, breaking at word boundaries
 */
export function truncate(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '…';
  }

  return truncated + '…';
}
