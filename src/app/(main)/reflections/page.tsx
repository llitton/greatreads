'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReflectionBook {
  id: string;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  userRating: number | null;
  userNotes: string | null;
  sourcePersonName: string | null;
  dateRead: string | null;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

/**
 * Strip HTML tags and convert to clean text
 * Handles common Goodreads HTML patterns
 */
function cleanNotes(html: string): string {
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
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ReflectionsPage() {
  const [books, setBooks] = useState<ReflectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Limit to 12 books max - scarcity creates meaning
  const MAX_BOOKS = 12;

  // Determine the primary source person (for header)
  const sourcePerson = useMemo(() => {
    const sources = books.map(b => b.sourcePersonName).filter(Boolean);
    if (sources.length === 0) return 'Laura'; // Default
    // Return most common source
    const counts: Record<string, number> = {};
    sources.forEach(s => { counts[s!] = (counts[s!] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [books]);

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
      {/* Page header - ownership is explicit */}
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">💭</span>
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Private
          </span>
        </div>

        <h1 className="text-3xl font-semibold text-[#1f1a17] mb-4">
          Books that stayed with {sourcePerson}
        </h1>

        <p className="text-[17px] leading-relaxed text-neutral-500 mb-6">
          Notes {sourcePerson === 'Laura' ? 'she' : 'they'} wrote for {sourcePerson === 'Laura' ? 'her' : 'their'} future self.
        </p>

        {/* Framing sentence */}
        <p className="text-sm text-neutral-400 italic">
          These aren&apos;t reviews. They&apos;re thoughts someone cared enough to save.
        </p>
      </header>

      {/* Content */}
      {books.length === 0 ? (
        /* Empty state - reflective, not placeholder */
        <section className="space-y-12">
          {/* Empty reflection card template - shows what goes here */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 max-w-lg mx-auto">
            <div className="flex gap-5">
              {/* Faint cover placeholder */}
              <div className="w-16 h-24 bg-neutral-100/80 rounded-lg border border-neutral-200/50 flex-shrink-0" />

              <div className="flex-1">
                <div className="h-4 w-32 bg-neutral-100 rounded mb-2" />
                <div className="h-3 w-20 bg-neutral-50 rounded mb-6" />

                <div className="bg-neutral-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-neutral-300 uppercase tracking-wide mb-2">
                    Why it mattered
                  </p>
                  <p className="text-sm text-neutral-300 italic">
                    &ldquo;...&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How this works - mental model */}
          <div className="max-w-md mx-auto text-center">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
              How this page is meant to be used
            </p>
            <div className="space-y-4 text-[15px] text-neutral-500 leading-relaxed">
              <p>Add a book that still lingers</p>
              <p>Write a sentence you&apos;d want to reread years later</p>
              <p>Come back when your thinking changes</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="text-center space-y-4">
            <Button onClick={() => {/* TODO: Add book that stayed */}}>
              Add a book that stayed with you
            </Button>
            <div>
              <Link
                href="/my-books"
                className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
              >
                Browse my books
              </Link>
            </div>
          </div>

          {/* Quiet emotional anchor */}
          <p className="text-center text-sm text-neutral-300 italic pt-8">
            This page isn&apos;t meant to be finished.
          </p>
        </section>
      ) : (
        /* Books that stayed */
        <section className="space-y-10">
          {books.slice(0, MAX_BOOKS).map((item) => {
            const cleanedNotes = item.userNotes ? cleanNotes(item.userNotes) : null;
            const readYear = item.dateRead ? new Date(item.dateRead).getFullYear() : null;

            return (
              <article
                key={item.id}
                className="group"
              >
                <div className="flex gap-6">
                  {/* Cover - only show if we have one */}
                  {item.book.coverUrl && (
                    <img
                      src={item.book.coverUrl}
                      alt=""
                      className="w-16 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1f1a17] mb-1">
                      {item.book.title}
                    </h3>
                    {item.book.author && (
                      <p className="text-sm text-neutral-400 mb-2">{item.book.author}</p>
                    )}

                    {/* Edit mode */}
                    {editingId === item.book.id ? (
                      <div className="space-y-4 mt-4">
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
                            maxLength={500}
                          />
                          <p className="text-xs text-neutral-300 mt-1.5">
                            {editNotes.length}/500
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
                        {/* The reflection - primary content */}
                        {cleanedNotes ? (
                          <div className="mt-4 mb-4">
                            <p className="text-[15px] leading-relaxed text-neutral-600 whitespace-pre-line">
                              {cleanedNotes}
                            </p>
                          </div>
                        ) : null}

                        {/* Quiet metadata row */}
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          {/* Temporal context */}
                          {readYear && (
                            <span>Read in {readYear}</span>
                          )}

                          {/* Edit action - gentler language */}
                          <button
                            onClick={() => startEdit(item)}
                            className="hover:text-[#1f1a17] transition-colors"
                          >
                            {cleanedNotes ? 'Revise note' : 'Add reflection'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

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
