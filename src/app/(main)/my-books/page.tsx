'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

interface UserBookStatus {
  id: string;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  userRating: number | null;
  userNotes: string | null;
  sourcePersonName: string | null;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<UserBookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books/status');
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate Mark's books (READ status = in his canon) from suggestions
  const { myBooks, suggestions } = useMemo(() => {
    const my: UserBookStatus[] = [];
    const sugg: UserBookStatus[] = [];

    books.forEach((book) => {
      if (book.status === 'READ') {
        my.push(book);
      } else {
        sugg.push(book);
      }
    });

    return { myBooks: my, suggestions: sugg };
  }, [books]);

  // Group suggestions by source person
  const suggestionsBySource = useMemo(() => {
    const grouped: Record<string, UserBookStatus[]> = {};
    suggestions.forEach((book) => {
      const source = book.sourcePersonName || 'Unknown';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(book);
    });
    return grouped;
  }, [suggestions]);

  const handleAddToMyBooks = async (bookId: string) => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status: 'READ' }),
    });
    fetchBooks();
  };

  const handleRemoveFromMyBooks = async (bookId: string) => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status: 'WANT_TO_READ' }),
    });
    fetchBooks();
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="text-neutral-500">Loading your books...</p>
        </div>
      </div>
    );
  }

  const isEmpty = books.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Mark is the owner
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-2">
          My Books
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          A personal library, shaped by people I trust.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: Mark's Canon (books he's chosen to keep)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            My Canon
          </h2>
          {myBooks.length > 0 && (
            <span className="text-xs text-neutral-300">
              {myBooks.length} book{myBooks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {myBooks.length === 0 ? (
          <div className="bg-[#fdfcfa] border border-[#f0ebe3] rounded-2xl p-8 text-center">
            <p className="text-neutral-500 mb-2">
              You haven&apos;t added any books yet.
            </p>
            <p className="text-sm text-neutral-400">
              Add from people you trust below, or{' '}
              <Link href="/import" className="text-[#1f1a17] hover:underline">
                import your history
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myBooks.map((item) => (
              <BookCard
                key={item.id}
                item={item}
                isOwned={true}
                onRemove={() => handleRemoveFromMyBooks(item.book.id)}
                expanded={expandedNotes.has(item.id)}
                onToggleNotes={() => toggleNotes(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: From People I Trust (suggestions to consider)
      ═══════════════════════════════════════════════════════════════════ */}
      {(Object.keys(suggestionsBySource).length > 0 || isEmpty) && (
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-6">
            From People I Trust
          </h2>

          {Object.keys(suggestionsBySource).length === 0 ? (
            <div className="bg-neutral-50 rounded-2xl p-8 text-center">
              <p className="text-neutral-500 mb-4">
                No suggestions yet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/import">
                  <Button>Import from Goodreads</Button>
                </Link>
                <Link href="/feed">
                  <Button variant="secondary">Browse signals</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(suggestionsBySource).map(([source, sourceBooks]) => (
                <div key={source}>
                  {/* Source header */}
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-base font-medium text-[#1f1a17]">
                      From {source}
                    </h3>
                    <span className="text-xs text-neutral-300">
                      {sourceBooks.length} book{sourceBooks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4">
                    Books {source} rated five stars. You decide which belong in your canon.
                  </p>

                  {/* Books from this source */}
                  <div className="space-y-3">
                    {sourceBooks.map((item) => (
                      <BookCard
                        key={item.id}
                        item={item}
                        isOwned={false}
                        onAdd={() => handleAddToMyBooks(item.book.id)}
                        expanded={expandedNotes.has(item.id)}
                        onToggleNotes={() => toggleNotes(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      {!isEmpty && (
        <div className="mt-16 pt-8 border-t border-black/5 text-center">
          <Link
            href="/reflections"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
          >
            See books that stayed →
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Book Card Component
 * Handles both owned books (in My Canon) and suggestions (from sources)
 */
function BookCard({
  item,
  isOwned,
  onAdd,
  onRemove,
  expanded,
  onToggleNotes,
}: {
  item: UserBookStatus;
  isOwned: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  expanded: boolean;
  onToggleNotes: () => void;
}) {
  const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
  const hasNotes = cleanedNotes && cleanedNotes.length > 0;
  const isLongNote = hasNotes && cleanedNotes.length > 150;
  const sourceName = item.sourcePersonName || 'Someone';

  return (
    <div
      className={`group bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${
        hasNotes && !isOwned
          ? 'border-l-4 border-l-amber-200 border-t-black/5 border-r-black/5 border-b-black/5'
          : 'border-black/5'
      }`}
    >
      {/* Signal indicator for suggestions with notes */}
      {!isOwned && hasNotes && (
        <p className="text-xs text-amber-600/70 mb-3 flex items-center gap-1">
          <span>★</span> Strong signal from {sourceName}
        </p>
      )}

      <div className="flex gap-4">
        {/* Cover */}
        {item.book.coverUrl ? (
          <img
            src={item.book.coverUrl}
            alt=""
            className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-20 bg-neutral-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-center">
            <span className="text-lg mb-0.5">📕</span>
            <span className="text-[9px] text-neutral-400 leading-tight px-1">
              No cover
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#1f1a17]">
                {item.book.title}
              </h3>
              {item.book.author && (
                <p className="text-sm text-neutral-500">{item.book.author}</p>
              )}
            </div>
          </div>

          {/* Notes - collapsed by default for long notes */}
          {hasNotes && (
            <div className="mt-3">
              <p className="text-xs text-neutral-400 mb-1">
                {sourceName}&apos;s note
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {isLongNote && !expanded
                  ? cleanedNotes.slice(0, 150) + '...'
                  : cleanedNotes}
              </p>
              {isLongNote && (
                <button
                  onClick={onToggleNotes}
                  className="text-xs text-neutral-400 hover:text-neutral-600 mt-1 transition-colors"
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            {isOwned ? (
              <button
                onClick={onRemove}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
              >
                Remove from my books
              </button>
            ) : (
              <>
                <button
                  onClick={onAdd}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                >
                  Add to My Books
                </button>
                {!hasNotes && (
                  <span className="text-xs text-neutral-300">
                    From {sourceName}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
