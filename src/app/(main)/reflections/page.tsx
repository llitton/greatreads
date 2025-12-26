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
      // Filter to books that have been read and rated 5 stars OR have notes
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1f1a17] text-white text-xl flex items-center justify-center flex-shrink-0">
            💭
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1f1a17] mb-1">
              Books That Shaped How I Think
            </h1>
            <p className="text-[15px] text-neutral-500">
              Not ranked. Not public. Just reflection.
            </p>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-neutral-600">
          These are the books that left a mark — the ones you find yourself thinking about
          months or years later. Add a few words about what each one meant to you.
        </p>
      </div>

      {/* Books list */}
      {books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-10 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-semibold text-[#1f1a17] mb-2">
            No reflections yet
          </h2>
          <p className="text-[15px] text-neutral-600 mb-6 max-w-sm mx-auto">
            Books you&apos;ve read and rated 5 stars, or added notes to, will appear here.
          </p>
          <Link href="/my-books">
            <Button variant="secondary">
              Go to My Books
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-5">
                {/* Cover */}
                {item.book.coverUrl ? (
                  <img
                    src={item.book.coverUrl}
                    alt=""
                    className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📕</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1f1a17] mb-0.5">
                    {item.book.title}
                  </h3>
                  {item.book.author && (
                    <p className="text-sm text-neutral-500 mb-3">{item.book.author}</p>
                  )}

                  {/* Edit mode */}
                  {editingId === item.book.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10 resize-none"
                        rows={3}
                        placeholder="What did this book change about how you see the world?"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveReflection(item.book.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Reflection display */}
                      {item.userNotes ? (
                        <div className="bg-neutral-50 rounded-xl px-4 py-3 mb-3">
                          <p className="text-[15px] leading-relaxed text-neutral-700 italic">
                            &ldquo;{item.userNotes}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 italic mb-3">
                          No reflection yet
                        </p>
                      )}

                      <button
                        onClick={() => startEdit(item)}
                        className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
                      >
                        {item.userNotes ? 'Edit reflection' : 'Add a reflection'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiet footer */}
      <p className="text-center text-sm text-neutral-300 italic pt-4">
        The books that matter most often take years to understand.
      </p>
    </div>
  );
}
