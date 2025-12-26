'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReflectionBook {
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

export default function ReflectionsPage() {
  const [books, setBooks] = useState<ReflectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Limit to 12 books max - scarcity creates meaning
  const MAX_BOOKS = 12;

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books/status');
      const data = await res.json();
      const reflectionBooks = data.filter(
        (b: ReflectionBook) => b.status === 'READ' && (b.userRating === 5 || b.userNotes)
      );
      setBooks(reflectionBooks);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReflection = async (bookId: string) => {
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

  const startEdit = (book: ReflectionBook) => {
    setEditingId(book.book.id);
    setEditNotes(book.userNotes || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💭</div>
          <p className="text-neutral-500">Loading reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Page header */}
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">💭</span>
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Private
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-[#1f1a17] mb-4">
          Books that stayed with me
        </h1>

        <p className="text-[17px] leading-relaxed text-neutral-500">
          The ones I still think about.
        </p>
      </header>

      {/* Content */}
      {books.length === 0 ? (
        /* Empty state */
        <section>
          <div className="bg-[#faf8f5] rounded-3xl py-16 px-10 text-center max-w-xl mx-auto">
            <div className="text-5xl mb-8">📚</div>

            <h2 className="text-xl font-semibold text-[#1f1a17] mb-4">
              This is where lasting books live
            </h2>

            <p className="text-[15px] leading-7 text-neutral-600 mb-8 max-w-sm mx-auto">
              Some books don&apos;t matter until years later.
              <br />
              This is a place to leave a note for your future self.
            </p>

            <Link href="/my-books">
              <Button variant="secondary">
                Go to My Books
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-neutral-300 mt-12 italic">
            The best ones take time to understand.
          </p>
        </section>
      ) : (
        /* Books that stayed */
        <section className="space-y-10">
          {books.slice(0, MAX_BOOKS).map((item) => (
            <article
              key={item.id}
              className="group"
            >
              <div className="flex gap-6">
                {/* Cover */}
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt=""
                    className="w-16 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-2xl">📕</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1f1a17] mb-1">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-neutral-400 mb-5">{item.book.author}</p>
                  )}

                  {/* Edit mode */}
                  {editingId === item.book.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                          Why it mattered
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-4 py-3 text-[15px] leading-relaxed bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                          rows={3}
                          placeholder="What stayed with you?"
                          autoFocus
                          maxLength={280}
                        />
                        <p className="text-xs text-neutral-300 mt-1.5">
                          {editNotes.length}/280
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button size="sm" onClick={() => handleSaveReflection(item.book.id)}>
                          Save
                        </Button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-neutral-400 hover:text-neutral-600 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Why it mattered */}
                      {item.userNotes ? (
                        <div className="bg-neutral-50 rounded-xl px-4 py-3 mb-4">
                          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                            Why it mattered
                          </p>
                          <p className="text-[15px] leading-relaxed text-neutral-600">
                            {item.userNotes}
                          </p>
                        </div>
                      ) : null}

                      <button
                        onClick={() => startEdit(item)}
                        className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
                      >
                        {item.userNotes ? 'Edit' : 'Add why it mattered'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}

          {/* Limit indicator */}
          {books.length >= MAX_BOOKS && (
            <p className="text-center text-sm text-neutral-400 pt-4">
              Limited to {MAX_BOOKS} books. Remove one to add another.
            </p>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mt-24 text-center">
        <p className="text-sm text-neutral-300 italic">
          Some books take years to understand.
        </p>
      </footer>
    </div>
  );
}
