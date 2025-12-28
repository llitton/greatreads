'use client';

import { useEffect, useState, useMemo } from 'react';
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

// Micro-signals for why a book stayed (rotate through these)
const stayedReasons = [
  'Kept thinking about this',
  'Came back to this more than once',
  'Still feels unresolved',
  'Changed how I see things',
  'Words that wouldn\'t leave',
];

function getStayedReason(index: number): string {
  return stayedReasons[index % stayedReasons.length];
}

// Temporal bucket based on date
function getTemporalBucket(dateStr: string | null, updatedAt: string): 'recent' | 'still' | 'years' {
  const date = dateStr ? new Date(dateStr) : new Date(updatedAt);
  const now = new Date();
  const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsAgo < 6) return 'recent';
  if (monthsAgo < 24) return 'still';
  return 'years';
}

const bucketLabels = {
  recent: 'Recently resurfaced',
  still: 'Still with me',
  years: 'From years ago',
};

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

  // Group books by temporal bucket
  const groupedBooks = useMemo(() => {
    const groups: Record<'recent' | 'still' | 'years', ReflectionBook[]> = {
      recent: [],
      still: [],
      years: [],
    };

    books.forEach((book) => {
      const bucket = getTemporalBucket(book.dateRead, book.updatedAt);
      groups[bucket].push(book);
    });

    return groups;
  }, [books]);

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

  // Stats for context
  const stats = useMemo(() => {
    const withNotes = books.filter(b => b.userNotes && normalizeGoodreadsText(b.userNotes).length > 0).length;
    return { total: books.length, withNotes };
  }, [books]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">◌</div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Unhurried, reflective
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-16">
        <h1 className="text-2xl font-serif text-[#1f1a17] mb-3">
          Stayed
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          These are the books that kept coming back to me.
        </p>
      </header>

      {/* Content */}
      {books.length === 0 ? (
        /* Empty state - contemplative */
        <section className="py-8">
          <div className="space-y-8 text-center max-w-sm mx-auto">
            <p className="text-[15px] text-neutral-500 leading-relaxed">
              This isn&apos;t a list you plan.
              <br />
              It&apos;s one that forms on its own.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              When a book keeps coming back to you — in conversations, in quiet moments, in how you see the world — it belongs here.
            </p>
            <Link
              href="/my-books"
              className="inline-block text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
            >
              Browse my books →
            </Link>
          </div>

          {/* Quiet anchor */}
          <p className="text-center text-sm text-neutral-300 italic mt-24">
            Some books take years to understand.
          </p>
        </section>
      ) : (
        /* Books that stayed - journal entries, not cards */
        <section>
          {/* Quiet context - replaces repeated attribution */}
          {stats.total > 0 && (
            <div className="mb-16 pb-8 border-b border-neutral-100">
              <p className="text-xs text-neutral-300">
                {stats.total} book{stats.total !== 1 ? 's' : ''}
                {stats.withNotes > 0 && ` · ${stats.withNotes} with notes`}
              </p>
            </div>
          )}

          {/* Temporal groups */}
          {(['recent', 'still', 'years'] as const).map((bucket) => {
            const bucketBooks = groupedBooks[bucket];
            if (bucketBooks.length === 0) return null;

            return (
              <div key={bucket} className="mb-16">
                {/* Temporal label - subtle */}
                <p className="text-xs text-neutral-300 uppercase tracking-widest mb-10">
                  {bucketLabels[bucket]}
                </p>

                {/* Entries - journal style, no cards */}
                <div className="space-y-8">
                  {bucketBooks.map((item, index) => {
                    const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
                    const hasNotes = cleanedNotes && cleanedNotes.length > 0;
                    const isExpanded = expandedNotes.has(item.id);

                    return (
                      <article key={item.id} className="group">
                        {/* Why it stayed - micro-signal */}
                        <p className="text-xs text-neutral-300 italic mb-3">
                          {getStayedReason(index)}
                        </p>

                        {/* Book info - minimal */}
                        <div className="flex gap-5">
                          {/* Cover - quiet presence */}
                          {item.book.coverUrl ? (
                            <img
                              src={item.book.coverUrl}
                              alt=""
                              className="w-12 h-[72px] object-cover rounded opacity-90 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-[72px] bg-neutral-50 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-neutral-300 text-xs">◇</span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-medium text-[#1f1a17] leading-snug">
                              {item.book.title}
                            </h3>
                            {item.book.author && (
                              <p className="text-sm text-neutral-400 mt-0.5">
                                {item.book.author}
                              </p>
                            )}

                            {/* Note - collapsed by default, discoverable */}
                            {hasNotes && (
                              <div className="mt-5">
                                {!isExpanded ? (
                                  <button
                                    onClick={() => toggleNotes(item.id)}
                                    className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors text-left"
                                  >
                                    <span className="italic">A thought that lingered</span>
                                    <span className="ml-1.5 text-neutral-300">→</span>
                                  </button>
                                ) : (
                                  <div>
                                    <p className="text-sm text-neutral-500 leading-relaxed whitespace-pre-line">
                                      {cleanedNotes}
                                    </p>
                                    <button
                                      onClick={() => toggleNotes(item.id)}
                                      className="text-xs text-neutral-300 hover:text-neutral-500 mt-3 transition-colors"
                                    >
                                      collapse
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER: Emotional closure
      ═══════════════════════════════════════════════════════════════════ */}
      {books.length > 0 && (
        <footer className="mt-8 pt-8 border-t border-neutral-50 text-center">
          <p className="text-sm text-neutral-300 italic leading-relaxed">
            Some books leave when you close them.
            <br />
            These didn&apos;t.
          </p>
        </footer>
      )}
    </div>
  );
}
