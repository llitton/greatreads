'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

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

export default function StayedPage() {
  const [books, setBooks] = useState<ReflectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books/status');
      const data = await res.json();
      // Books that "stayed" = READ + have notes or 5-star rating
      const stayedBooks = data.filter(
        (b: ReflectionBook) => b.status === 'READ' && (b.userRating === 5 || b.userNotes)
      );
      setBooks(stayedBooks);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="animate-spin text-4xl mb-4">💭</div>
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Mark owns this. This is about his relationship to books.
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-12">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
          Stayed
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500 max-w-md">
          Books that kept resurfacing. Not favorites. Not recommendations. Just the ones that lingered after the moment passed.
        </p>
      </header>

      {/* Content */}
      {books.length === 0 ? (
        /* Empty state - reflective, Mark-centered */
        <section className="space-y-12">
          {/* Explanation of what belongs here */}
          <div className="bg-[#fdfcfa] border border-[#f0ebe3] rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-[15px] text-neutral-600 leading-relaxed mb-6">
              This isn&apos;t a list you plan. It&apos;s one that forms on its own.
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              When a book keeps coming back to you — in conversations, in quiet moments, in how you see the world — it belongs here.
            </p>
          </div>

          {/* How it works */}
          <div className="max-w-sm mx-auto text-center">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-6">
              How this page works
            </p>
            <div className="space-y-3 text-sm text-neutral-500">
              <p>Books appear here from your canon</p>
              <p>The ones with notes or five stars</p>
              <p>You can add your own thoughts anytime</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Link href="/my-books">
              <Button>Browse my books</Button>
            </Link>
          </div>

          {/* Quiet anchor */}
          <p className="text-center text-sm text-neutral-300 italic pt-8">
            Some books take years to understand.
          </p>
        </section>
      ) : (
        /* Books that stayed */
        <section>
          {/* Subtle context */}
          <p className="text-xs text-neutral-400 mb-8">
            These are books that kept resurfacing. Some came from people I trust. Some I found myself.
          </p>

          <div className="space-y-6">
            {books.map((item, index) => {
              const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
              const hasNotes = cleanedNotes && cleanedNotes.length > 0;
              const isLongNote = hasNotes && cleanedNotes.length > 120;
              const isExpanded = expandedNotes.has(item.id);
              const isLast = index === books.length - 1;
              const sourceName = item.sourcePersonName;

              return (
                <article
                  key={item.id}
                  className={`group pb-6 ${!isLast ? 'border-b border-neutral-100' : ''}`}
                >
                  <div className="flex gap-5">
                    {/* Cover */}
                    {item.book.coverUrl ? (
                      <img
                        src={item.book.coverUrl}
                        alt=""
                        className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-neutral-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg">📕</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and author */}
                      <h3 className="font-semibold text-[#1f1a17]">
                        {item.book.title}
                      </h3>
                      {item.book.author && (
                        <p className="text-sm text-neutral-500">{item.book.author}</p>
                      )}

                      {/* Source attribution - subtle */}
                      {sourceName && (
                        <p className="text-xs text-neutral-300 mt-1">
                          From {sourceName}
                        </p>
                      )}

                      {/* Notes - collapsed by default, framed as context */}
                      {hasNotes && (
                        <div className="mt-3">
                          {isLongNote && !isExpanded ? (
                            <>
                              <p className="text-sm text-neutral-500 leading-relaxed">
                                {cleanedNotes.slice(0, 120)}...
                              </p>
                              <button
                                onClick={() => toggleNotes(item.id)}
                                className="text-xs text-neutral-400 hover:text-neutral-600 mt-1 transition-colors"
                              >
                                Read note →
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-line">
                                {cleanedNotes}
                              </p>
                              {isLongNote && (
                                <button
                                  onClick={() => toggleNotes(item.id)}
                                  className="text-xs text-neutral-400 hover:text-neutral-600 mt-1 transition-colors"
                                >
                                  Show less
                                </button>
                              )}
                            </>
                          )}
                          {sourceName && isExpanded && (
                            <p className="text-xs text-neutral-300 mt-2 italic">
                              — {sourceName}&apos;s note
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-24 text-center">
        <p className="text-sm text-neutral-300 italic">
          This page isn&apos;t meant to be finished.
        </p>
      </footer>
    </div>
  );
}
