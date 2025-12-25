import { describe, it, expect } from 'vitest';
import {
  detectRating,
  isFiveStarEvent,
  extractBookInfo,
  generateStableGuid,
  extractReviewText,
  extractEventDate,
  RSSItem,
} from '@/lib/rss/parser';

describe('detectRating', () => {
  it('should detect "rated it 5 out of 5 stars" pattern', () => {
    const item: RSSItem = {
      title: 'Jane rated The Great Gatsby by F. Scott Fitzgerald - 5 stars',
      content: 'Jane rated it 5 out of 5 stars. Great book!',
    };
    expect(detectRating(item)).toBe(5);
  });

  it('should detect "gave it 5 stars" pattern', () => {
    const item: RSSItem = {
      title: 'Jane gave it 5 stars: The Midnight Library',
      content: '',
    };
    expect(detectRating(item)).toBe(5);
  });

  it('should detect star emoji pattern ★★★★★', () => {
    const item: RSSItem = {
      title: 'Jane rated Project Hail Mary by Andy Weir ★★★★★',
      content: '',
    };
    expect(detectRating(item)).toBe(5);
  });

  it('should detect 4 star rating', () => {
    const item: RSSItem = {
      title: 'Jane rated 1984 by George Orwell - 4 stars',
      content: 'Jane rated it 4 out of 5 stars.',
    };
    expect(detectRating(item)).toBe(4);
  });

  it('should detect rating from userRating field', () => {
    const item = {
      title: 'Dune',
      userRating: '5',
    } as unknown as RSSItem;
    expect(detectRating(item)).toBe(5);
  });

  it('should return null for non-rating items', () => {
    const item: RSSItem = {
      title: 'Jane wants to read To Kill a Mockingbird',
      content: 'Jane added To Kill a Mockingbird to their want to read shelf.',
    };
    expect(detectRating(item)).toBeNull();
  });
});

describe('isFiveStarEvent', () => {
  it('should return true for 5 star events', () => {
    const item: RSSItem = {
      title: 'Jane rated The Great Gatsby - 5 stars',
      content: 'Jane rated it 5 out of 5 stars.',
    };
    expect(isFiveStarEvent(item)).toBe(true);
  });

  it('should return false for 4 star events', () => {
    const item: RSSItem = {
      title: 'Jane rated 1984 - 4 stars',
      content: 'Jane rated it 4 out of 5 stars.',
    };
    expect(isFiveStarEvent(item)).toBe(false);
  });

  it('should return false for want to read events', () => {
    const item: RSSItem = {
      title: 'Jane wants to read To Kill a Mockingbird',
      content: '',
    };
    expect(isFiveStarEvent(item)).toBe(false);
  });
});

describe('extractBookInfo', () => {
  it('should extract title and author from "Title by Author" pattern', () => {
    const item: RSSItem = {
      title: 'The Great Gatsby by F. Scott Fitzgerald - 5 stars',
    };
    const result = extractBookInfo(item);
    expect(result.title).toBe('The Great Gatsby');
    expect(result.author).toBe('F. Scott Fitzgerald');
  });

  it('should use authorName field when available', () => {
    const item = {
      title: 'Dune',
      authorName: 'Frank Herbert',
    } as unknown as RSSItem;
    const result = extractBookInfo(item);
    expect(result.title).toBe('Dune');
    expect(result.author).toBe('Frank Herbert');
  });

  it('should handle title without author', () => {
    const item: RSSItem = {
      title: 'Some Book Title',
    };
    const result = extractBookInfo(item);
    expect(result.title).toBe('Some Book Title');
    expect(result.author).toBeNull();
  });
});

describe('generateStableGuid', () => {
  it('should return existing guid if present', () => {
    const item: RSSItem = {
      guid: 'existing-guid-123',
      title: 'Test',
    };
    expect(generateStableGuid('http://example.com/rss', item)).toBe('existing-guid-123');
  });

  it('should generate consistent hash for same inputs', () => {
    const item: RSSItem = {
      title: 'Test Book',
      link: 'http://example.com/book/1',
      pubDate: '2024-12-25',
    };
    const guid1 = generateStableGuid('http://example.com/rss', item);
    const guid2 = generateStableGuid('http://example.com/rss', item);
    expect(guid1).toBe(guid2);
    expect(guid1).toHaveLength(32);
  });

  it('should generate different hashes for different inputs', () => {
    const item1: RSSItem = { title: 'Book 1' };
    const item2: RSSItem = { title: 'Book 2' };
    const guid1 = generateStableGuid('http://example.com/rss', item1);
    const guid2 = generateStableGuid('http://example.com/rss', item2);
    expect(guid1).not.toBe(guid2);
  });
});

describe('extractReviewText', () => {
  it('should extract review text from content', () => {
    const item: RSSItem = {
      content: '<p>Absolutely stunning prose and a masterful critique of the American Dream.</p>',
    };
    const result = extractReviewText(item);
    expect(result).toBe('Absolutely stunning prose and a masterful critique of the American Dream.');
  });

  it('should return null for short metadata-only content', () => {
    const item: RSSItem = {
      content: 'rated it 5 stars',
    };
    const result = extractReviewText(item);
    expect(result).toBeNull();
  });

  it('should decode HTML entities', () => {
    const item: RSSItem = {
      content: 'This book &amp; its sequel are both amazing!',
    };
    const result = extractReviewText(item);
    expect(result).toBe('This book & its sequel are both amazing!');
  });
});

describe('extractEventDate', () => {
  it('should parse ISO date', () => {
    const item: RSSItem = {
      isoDate: '2024-12-23T10:30:00Z',
    };
    const result = extractEventDate(item);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('should parse pubDate', () => {
    const item: RSSItem = {
      pubDate: 'Mon, 23 Dec 2024 10:30:00 -0800',
    };
    const result = extractEventDate(item);
    expect(result).toBeInstanceOf(Date);
  });

  it('should parse userReadAt from shelf RSS', () => {
    const item = {
      userReadAt: 'Sat, 14 Dec 2024 00:00:00 -0800',
    } as unknown as RSSItem;
    const result = extractEventDate(item);
    expect(result).toBeInstanceOf(Date);
  });
});
