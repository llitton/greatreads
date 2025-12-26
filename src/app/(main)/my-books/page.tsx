'use client';

import { useEffect, useState, useMemo } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserBookStatus {
  id: string;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  userRating: number | null;
  userNotes: string | null;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

// Gentle insights component
function ReadingInsights({ books }: { books: UserBookStatus[] }) {
  const insights = useMemo(() => {
    const read = books.filter(b => b.status === 'READ');
    const fiveStars = books.filter(b => b.userRating === 5);
    const wantToRead = books.filter(b => b.status === 'WANT_TO_READ');

    // Find most common author among 5-star books
    const authorCounts: Record<string, number> = {};
    fiveStars.forEach(b => {
      if (b.book.author) {
        authorCounts[b.book.author] = (authorCounts[b.book.author] || 0) + 1;
      }
    });
    const topAuthor = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      readCount: read.length,
      fiveStarCount: fiveStars.length,
      wantToReadCount: wantToRead.length,
      favoriteAuthor: topAuthor ? topAuthor[0] : null,
    };
  }, [books]);

  if (books.length === 0) return null;

  return (
    <div className="bg-neutral-50 rounded-2xl p-5 mb-8">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
        Your reading life
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-semibold text-[#1f1a17]">{insights.readCount}</p>
          <p className="text-sm text-neutral-500">books read</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[#d4a855]">{insights.fiveStarCount}</p>
          <p className="text-sm text-neutral-500">five-star</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[#1f1a17]">{insights.wantToReadCount}</p>
          <p className="text-sm text-neutral-500">to read</p>
        </div>
        {insights.favoriteAuthor && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm font-medium text-[#1f1a17] truncate">{insights.favoriteAuthor}</p>
            <p className="text-sm text-neutral-500">favorite author</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<UserBookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'WANT_TO_READ' | 'READING' | 'READ'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

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
        userRating: editRating || null,
        userNotes: editNotes || null,
      }),
    });
    setEditingId(null);
    fetchBooks();
  };

  const startEdit = (book: UserBookStatus) => {
    setEditingId(book.book.id);
    setEditRating(book.userRating || 0);
    setEditNotes(book.userNotes || '');
  };

  const filteredBooks = filter === 'all' ? books : books.filter((b) => b.status === filter);

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
      {/* Header - personal framing */}
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-2">
          My Books
        </h1>
        <p className="text-[17px] text-neutral-500 leading-relaxed">
          A place for the books you&apos;ve chosen to keep.
        </p>
      </header>

      {/* Gentle insights - only when there are books */}
      {!isEmpty && <ReadingInsights books={books} />}

      {/* Filter tabs - contextual */}
      {!isEmpty ? (
        <div className="flex gap-2 mb-8">
          {[
            { value: 'all', label: 'All' },
            { value: 'WANT_TO_READ', label: 'Want to Read' },
            { value: 'READING', label: 'Reading' },
            { value: 'READ', label: 'Read' },
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
      ) : (
        <p className="text-xs text-neutral-300 mb-8">
          Filters appear once you add books.
        </p>
      )}

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
                Your shelf is empty — for now
              </h2>
              <p className="text-[15px] text-neutral-600 leading-relaxed mb-8">
                The books you add here are the ones you&apos;ve chosen to keep track of, return to, or recommend.
              </p>

              {/* Two clear paths */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/feed">
                  <Button>Add from your feed</Button>
                </Link>
                <Button variant="secondary" onClick={() => {/* TODO: Add manual entry */}}>
                  Add a book manually
                </Button>
              </div>
            </div>
          </div>

          {/* Subtle delight */}
          <p className="text-center text-sm text-neutral-300 italic">
            Most people start with one book.
          </p>
        </section>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-neutral-50 rounded-2xl p-10 text-center">
          <p className="text-neutral-500">
            No books in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-shadow">
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
                  <h3 className="font-semibold text-[#1f1a17]">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-neutral-500">{item.book.author}</p>
                  )}

                  {/* Status badge */}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === 'READ'
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.status === 'READING'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {item.status === 'READ'
                        ? '✓ Read'
                        : item.status === 'READING'
                          ? '📖 Reading'
                          : '📌 Want to Read'}
                    </span>
                  </div>

                  {/* Edit mode */}
                  {editingId === item.book.id ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1f1a17] mb-1.5">
                          My Rating
                        </label>
                        <StarRating value={editRating} onChange={setEditRating} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1f1a17] mb-1.5">
                          My Notes
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                          rows={2}
                          placeholder="Add your thoughts about this book..."
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
                      {/* Rating and notes display */}
                      {item.userRating && (
                        <div className="mt-2">
                          <StarRating value={item.userRating} readonly size="sm" />
                        </div>
                      )}
                      {item.userNotes && (
                        <p className="mt-2 text-sm text-neutral-600 italic line-clamp-2 bg-neutral-50 rounded-lg px-3 py-2">
                          &ldquo;{item.userNotes}&rdquo;
                        </p>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {item.status !== 'READ' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(item.book.id, 'READ')}
                          >
                            Mark as Read
                          </Button>
                        )}
                        <button
                          onClick={() => startEdit(item)}
                          className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
                        >
                          {item.userRating || item.userNotes ? 'Edit' : 'Add rating/notes'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to reflections */}
      {books.filter(b => b.status === 'READ' && b.userRating === 5).length > 0 && (
        <div className="text-center pt-6">
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
