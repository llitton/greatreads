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
    <div className="max-w-2xl mx-auto px-4">
      {/* Page header - no card, just text breathing */}
      <header className="pt-4 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💭</span>
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Private
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-[#1f1a17] mb-3">
          Books That Shaped How I Think
        </h1>

        <p className="text-[17px] leading-relaxed text-neutral-500 max-w-lg">
          The ones you find yourself thinking about months or years later.
        </p>
      </header>

      {/* Content */}
      {books.length === 0 ? (
        /* Empty state - reflection prompt, not alert */
        <section className="mt-8">
          <div className="bg-[#faf8f5] rounded-3xl py-16 px-10 text-center max-w-xl mx-auto">
            <div className="text-5xl mb-6">📚</div>

            <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
              Your reflections will live here
            </h2>

            <p className="text-[15px] leading-7 text-neutral-600 mb-8 max-w-sm mx-auto">
              When you rate a book 5 stars or add notes in My Books,
              it becomes part of your reflection space.
            </p>

            <Link href="/my-books">
              <Button variant="secondary" size="sm">
                Browse My Books
              </Button>
            </Link>
          </div>

          {/* Aspirational note */}
          <p className="text-center text-[15px] text-neutral-400 mt-10 max-w-md mx-auto leading-relaxed">
            The books that change us don&apos;t always reveal themselves right away.
          </p>
        </section>
      ) : (
        /* Books with reflections */
        <section className="space-y-6">
          {books.map((item) => (
            <article
              key={item.id}
              className="group py-6 border-b border-black/5 last:border-0"
            >
              <div className="flex gap-5">
                {/* Cover */}
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt=""
                    className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0 transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-14 h-20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📕</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1f1a17] mb-0.5">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-neutral-400 mb-4">{item.book.author}</p>
                  )}

                  {/* Edit mode */}
                  {editingId === item.book.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-4 py-3 text-[15px] leading-relaxed bg-neutral-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                        rows={4}
                        placeholder="What did this book change about how you see the world?"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveReflection(item.book.id)}>
                          Save
                        </Button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-neutral-500 hover:text-neutral-700 px-3"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Reflection display */}
                      {item.userNotes ? (
                        <p className="text-[15px] leading-7 text-neutral-600 italic mb-3">
                          &ldquo;{item.userNotes}&rdquo;
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-300 italic mb-3">
                          No reflection yet
                        </p>
                      )}

                      <button
                        onClick={() => startEdit(item)}
                        className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
                      >
                        {item.userNotes ? 'Edit' : 'Add a reflection'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Quiet footer - standalone, generous spacing */}
      <footer className="mt-20 mb-8 text-center">
        <p className="text-[15px] text-neutral-300 italic leading-relaxed">
          The books that matter most often take years to understand.
        </p>
      </footer>
    </div>
  );
}
