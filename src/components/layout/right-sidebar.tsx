'use client';

import { useEffect, useState } from 'react';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

interface IncomingBook {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  sourceName: string;
  eventType: 'added' | 'rated' | 'reviewed';
  rating: number | null;
  reviewText: string | null;
  addedAt: string;
}

// Placeholder data while RSS is disabled
const placeholderBooks: IncomingBook[] = [
  {
    id: '1',
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg',
    sourceName: 'Laura',
    eventType: 'reviewed',
    rating: 5,
    reviewText: 'Just finished — this stayed with me.',
    addedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'The Bee Sting',
    author: 'Paul Murray',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374600303-M.jpg',
    sourceName: 'Sarah',
    eventType: 'rated',
    rating: 5,
    reviewText: null,
    addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Demon Copperhead',
    author: 'Barbara Kingsolver',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780063251922-M.jpg',
    sourceName: 'Laura',
    eventType: 'added',
    rating: null,
    reviewText: null,
    addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function RightSidebar() {
  const [books, setBooks] = useState<IncomingBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call to /api/incoming when RSS is enabled
    // For now, use placeholder data
    const timer = setTimeout(() => {
      setBooks(placeholderBooks);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToList = (bookId: string) => {
    // TODO: Implement - promote to signals
    setBooks(books.filter(b => b.id !== bookId));
  };

  const handleIgnore = (bookId: string) => {
    // TODO: Implement - dismiss from sidebar
    setBooks(books.filter(b => b.id !== bookId));
  };

  const formatDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const formatEventLabel = (book: IncomingBook) => {
    if (book.eventType === 'reviewed') return 'Wrote a note';
    if (book.eventType === 'rated' && book.rating) return `Rated ${book.rating}★`;
    return 'Added';
  };

  return (
    <div className="p-5 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          From people you follow
        </h2>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-[72px] bg-neutral-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                  <div className="h-2 bg-neutral-50 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-400">
            Nothing new right now
          </p>
          <p className="text-xs text-neutral-300 mt-2">
            New books from people you follow will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-xl border border-black/5 p-4 shadow-sm"
            >
              <div className="flex gap-3 mb-3">
                {/* Cover */}
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt=""
                    className="w-12 h-[72px] object-cover rounded shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-[72px] bg-neutral-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📕</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1f1a17] leading-tight line-clamp-2">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {book.author}
                    </p>
                  )}
                </div>
              </div>

              {/* Source + event */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                <span className="font-medium text-neutral-500">From {book.sourceName}</span>
                <span>·</span>
                <span>{formatEventLabel(book)}</span>
                <span>·</span>
                <span>{formatDaysAgo(book.addedAt)}</span>
              </div>

              {/* Review excerpt if available */}
              {book.reviewText && normalizeGoodreadsText(book.reviewText) && (
                <p className="text-xs text-neutral-500 italic leading-relaxed line-clamp-2 mb-3 pl-2 border-l-2 border-neutral-100">
                  &ldquo;{normalizeGoodreadsText(book.reviewText)}&rdquo;
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToList(book.id)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-[#1f1a17] bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleIgnore(book.id)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {books.length > 0 && (
        <p className="text-center text-xs text-neutral-300 mt-6 italic">
          Items expire after 14 days
        </p>
      )}
    </div>
  );
}
