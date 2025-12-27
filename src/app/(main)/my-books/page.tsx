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
  const [filter, setFilter] = useState<'all' | 'READ'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  // Primary source person (for header)
  const primarySource = useMemo(() => {
    const sources = books.map(b => b.sourcePersonName).filter(Boolean);
    if (sources.length === 0) return 'Laura';
    const counts: Record<string, number> = {};
    sources.forEach(s => { counts[s!] = (counts[s!] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [books]);

  // Count books with reflections
  const booksWithNotes = useMemo(() =>
    books.filter(b => b.userNotes && normalizeGoodreadsText(b.userNotes).length > 0).length,
    [books]
  );

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

  const handleUpdateStatus = async (bookId: string, status: 'WANT_TO_READ' | 'READING' | 'READ') => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status }),
    });
    fetchBooks();
  };

  const handleSaveEdit = async (bookId: string) => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        userNotes: editNotes || null,
      }),
    });
    setEditingId(null);
    fetchBooks();
  };

  const startEdit = (book: UserBookStatus) => {
    setEditingId(book.book.id);
    setEditNotes(book.userNotes || '');
  };

  // Simple filter: all or just read
  const filteredBooks = filter === 'all' ? books : books.filter((b) => b.status === 'READ');

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
  const readCount = books.filter(b => b.status === 'READ').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header - simple, clear */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-2">
          Books {primarySource} Loved
        </h1>
        {!isEmpty && (
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            {books.length} book{books.length !== 1 ? 's' : ''} that mattered enough to give five stars.
            {booksWithNotes > 0 && (
              <span className="text-neutral-400"> · {booksWithNotes} with notes</span>
            )}
          </p>
        )}
        {isEmpty && (
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            Only the strongest signals. Nothing else.
          </p>
        )}
      </header>

      {/* Simplified filter - just All vs Read */}
      {!isEmpty && readCount !== books.length ? (
        <div className="flex gap-2 mb-8">
          {[
            { value: 'all', label: `All (${books.length})` },
            { value: 'READ', label: `Read (${readCount})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-[#1f1a17] text-white'
                  : 'bg-white text-neutral-600 border border-black/5 hover:border-neutral-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : !isEmpty ? (
        <p className="text-xs text-neutral-400 mb-8">
          All books shown are five-star ratings from {primarySource}.
        </p>
      ) : null}

      {/* Empty state - guided, not placeholder */}
      {isEmpty ? (
        <section className="space-y-12">
          {/* Visual shelf - faint placeholders */}
          <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] rounded-3xl p-10">
            <div className="flex justify-center gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-16 h-24 bg-white/60 rounded-lg border border-neutral-200/50 shadow-sm"
                  style={{ opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>

            <div className="text-center max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
                Start with what you&apos;ve already read
              </h2>
              <p className="text-[15px] text-neutral-600 leading-relaxed mb-8">
                Import your Goodreads library to instantly populate your shelves, ratings, and strongest signals.
              </p>

              {/* Two clear paths */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/import">
                  <Button>Import Goodreads CSV</Button>
                </Link>
                <Link href="/feed">
                  <Button variant="secondary">Add from your feed</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Subtle delight */}
          <p className="text-center text-sm text-neutral-300 italic">
            Your reading history, ready in minutes.
          </p>
        </section>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-neutral-50 rounded-2xl p-10 text-center">
          <p className="text-neutral-500">
            No books in this category yet.
          </p>
        </div>
      ) : (
        /* Clean book list - visual hierarchy based on reflections */
        <div className="space-y-3">
          {filteredBooks.map((item) => {
            const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
            const hasReflection = cleanedNotes && cleanedNotes.length > 0;

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${
                  hasReflection
                    ? 'border-l-4 border-l-amber-200 border-t-black/5 border-r-black/5 border-b-black/5'
                    : 'border-black/5'
                }`}
              >
                <div className="flex gap-4">
                  {/* Cover */}
                  {item.book.coverUrl ? (
                    <img
                      src={item.book.coverUrl}
                      alt=""
                      className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📕</span>
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

                      {/* Edit - hover only, icon style */}
                      {editingId !== item.book.id && (
                        <button
                          onClick={() => startEdit(item)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-neutral-500 transition-all p-1"
                          title={hasReflection ? 'Edit note' : 'Add note'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Edit mode */}
                    {editingId === item.book.id ? (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1.5">
                            {primarySource}&apos;s note
                          </label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                            rows={3}
                            placeholder="Why did this book matter?"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(item.book.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Reflection display - framed with label */}
                        {hasReflection && (
                          <div className="mt-3">
                            <p className="text-xs text-neutral-400 mb-1">
                              {primarySource}&apos;s note
                            </p>
                            <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
                              {cleanedNotes}
                            </p>
                          </div>
                        )}

                        {/* Status action - only if not read */}
                        {item.status !== 'READ' && (
                          <div className="mt-3">
                            <button
                              onClick={() => handleUpdateStatus(item.book.id, 'READ')}
                              className="text-xs text-neutral-400 hover:text-[#1f1a17] transition-colors"
                            >
                              Mark as read
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Why am I seeing this? - trust affordance */}
      {!isEmpty && (
        <details className="mt-10 group">
          <summary className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors">
            Why these books?
          </summary>
          <div className="mt-3 p-4 bg-neutral-50 rounded-xl text-sm text-neutral-500 leading-relaxed">
            <p>
              These are the only books {primarySource} rated five stars. Nothing else appears here.
            </p>
            <p className="mt-2 text-neutral-400">
              Books with notes have a subtle amber border.
            </p>
          </div>
        </details>
      )}

      {/* Link to reflections */}
      {books.filter(b => b.status === 'READ' && b.userRating === 5).length > 0 && (
        <div className="text-center pt-8">
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
