'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BookCover } from '@/components/ui/book-cover';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface BookSignal {
  id: string;
  type: 'REVISITED' | 'UNRESOLVED' | 'PERSPECTIVE_SHIFT';
  confidence: number;
}

interface Reflection {
  id: string;
  content: string;
  updatedAt: string;
}

interface StayedEntry {
  id: string;
  source: 'SYSTEM' | 'USER';
  enteredAt: string;
}

interface StayedBook {
  id: string;
  userRating: number | null;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  stayedEntry: StayedEntry | null;
  reflection: Reflection | null;
  signals: BookSignal[];
}

// ═══════════════════════════════════════════════════════════════════
// Signal Copy
// ═══════════════════════════════════════════════════════════════════

const SIGNAL_LABELS: Record<BookSignal['type'], string> = {
  REVISITED: 'Returned more than once',
  UNRESOLVED: 'Still unresolved',
  PERSPECTIVE_SHIFT: 'Shifted how I see things',
};

function getStrongestSignal(signals: BookSignal[]): BookSignal | null {
  if (signals.length === 0) return null;
  // Return highest confidence signal
  return signals.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function StayedPage() {
  const [books, setBooks] = useState<StayedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReflection, setEditingReflection] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revisit a thought state
  const [revisitBook, setRevisitBook] = useState<StayedBook | null>(null);
  const [revisitText, setRevisitText] = useState('');

  useEffect(() => {
    fetchStayed();
  }, []);

  const fetchStayed = async () => {
    try {
      const res = await fetch('/api/stayed');
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);

        // Find a book eligible for "Revisit a thought"
        // Signal confidence >= 0.35, no recent reflection update
        const eligible = data.books?.find((b: StayedBook) => {
          const signal = getStrongestSignal(b.signals);
          if (!signal || signal.confidence < 0.35) return false;
          // If has reflection updated in last 45 days, skip
          if (b.reflection) {
            const updatedAt = new Date(b.reflection.updatedAt);
            const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 45) return false;
          }
          return true;
        });
        setRevisitBook(eligible || null);
      }
    } catch (error) {
      console.error('Failed to fetch stayed books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToStayed = async (userBookId: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/stayed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBookId }),
      });
      await fetchStayed();
    } catch (error) {
      console.error('Failed to add to stayed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromStayed = async (stayedEntryId: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/stayed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stayedEntryId }),
      });
      await fetchStayed();
    } catch (error) {
      console.error('Failed to remove from stayed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReflection = async (userBookId: string) => {
    if (!reflectionText.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBookId,
          content: reflectionText.trim(),
        }),
      });
      await fetchStayed();
      setEditingReflection(null);
      setReflectionText('');
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevisitSubmit = async () => {
    if (!revisitBook || !revisitText.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBookId: revisitBook.id,
          content: revisitText.trim(),
        }),
      });
      await fetchStayed();
      setRevisitBook(null);
      setRevisitText('');
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissRevisit = () => {
    setRevisitBook(null);
    setRevisitText('');
  };

  const handlePromoteToCanon = async (userBookId: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBookId }),
      });
      // Redirect to my-books to see the canon
      window.location.href = '/my-books';
    } catch (error) {
      console.error('Failed to promote to canon:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">
            <span className="text-neutral-300">...</span>
          </div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Empty State
  // ─────────────────────────────────────────────────────────────────

  if (books.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <header className="mb-12">
          <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
            Stayed
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed mb-2">
            Books that return to you, unprompted.
          </p>
          <p className="text-sm text-neutral-400 leading-relaxed">
            This page gathers books you&apos;ve reflected on more than once—or kept thinking about long after you finished.
          </p>
        </header>

        <div className="bg-[#fdfcfa] border border-[#f0ebe3] rounded-2xl p-10 mb-8">
          <div className="max-w-sm mx-auto text-center">
            <h3 className="text-lg font-medium text-[#1f1a17] mb-3">
              Nothing has stayed yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
              And that&apos;s normal.
            </p>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Some books land all at once.
              <br />
              Others return slowly, when you&apos;re ready for them.
            </p>
            <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
              When you revisit a reflection, or write about the same book again later, it will begin to appear here.
            </p>

            <Link href="/reflections">
              <Button>Revisit a past reflection</Button>
            </Link>
          </div>
        </div>

        {/* Quiet manual add - secondary */}
        <p className="text-center">
          <Link
            href="/my-books"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Or add one manually
          </Link>
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
          Stayed
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-2">
          Books that return to you, unprompted.
        </p>
        <p className="text-sm text-neutral-400 leading-relaxed">
          These books surfaced here because you reflected on them more than once, or returned to them after time passed.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          REVISIT A THOUGHT (gentle resurfacing)
      ═══════════════════════════════════════════════════════════════════ */}
      {revisitBook && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Revisit a thought
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            A book you might still be carrying.
          </p>

          <RevisitCard
            book={revisitBook}
            text={revisitText}
            onTextChange={setRevisitText}
            onSubmit={handleRevisitSubmit}
            onDismiss={handleDismissRevisit}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STAYED BOOKS
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="space-y-6">
          {books.map((book) => (
            <StayedBookCard
              key={book.id}
              book={book}
              isEditing={editingReflection === book.id}
              reflectionText={reflectionText}
              onReflectionChange={setReflectionText}
              onStartEdit={() => {
                setEditingReflection(book.id);
                setReflectionText(book.reflection?.content || '');
              }}
              onSaveReflection={() => handleSaveReflection(book.id)}
              onCancelEdit={() => {
                setEditingReflection(null);
                setReflectionText('');
              }}
              onRemove={() => book.stayedEntry && handleRemoveFromStayed(book.stayedEntry.id)}
              onPromoteToCanon={() => handlePromoteToCanon(book.id)}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="mt-16 pt-8 border-t border-black/5 text-center space-y-3">
        <Link
          href="/reflections"
          className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors block"
        >
          Revisit past reflections
        </Link>
        <Link
          href="/my-books"
          className="text-xs text-neutral-300 hover:text-neutral-500 transition-colors block"
        >
          Add one manually
        </Link>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Revisit Card Component
// ═══════════════════════════════════════════════════════════════════

function RevisitCard({
  book,
  text,
  onTextChange,
  onSubmit,
  onDismiss,
  isSubmitting,
}: {
  book: StayedBook;
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
  isSubmitting: boolean;
}) {
  const [showInput, setShowInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showInput]);

  const signal = getStrongestSignal(book.signals);

  return (
    <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
      <div className="flex gap-4">
        <BookCover
          src={book.book.coverUrl}
          title={book.book.title}
          author={book.book.author}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-medium text-[#1f1a17]">{book.book.title}</h3>
          {book.book.author && (
            <p className="text-sm text-neutral-500">{book.book.author}</p>
          )}
          {signal && (
            <p className="text-xs text-amber-600/70 mt-2">
              {SIGNAL_LABELS[signal.type]}
            </p>
          )}
        </div>
      </div>

      {showInput ? (
        <div className="mt-4">
          <label className="block text-sm text-[#1f1a17] mb-2">
            What&apos;s still bothering you?
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="A question, a tension, a moment you can't quite set down."
            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 bg-white"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSubmit}
              disabled={!text.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                onTextChange('');
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowInput(true)}
            className="px-4 py-2 text-sm font-medium text-[#1f1a17] bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Add a thought
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Stayed Book Card Component
// ═══════════════════════════════════════════════════════════════════

function StayedBookCard({
  book,
  isEditing,
  reflectionText,
  onReflectionChange,
  onStartEdit,
  onSaveReflection,
  onCancelEdit,
  onRemove,
  onPromoteToCanon,
  isSubmitting,
}: {
  book: StayedBook;
  isEditing: boolean;
  reflectionText: string;
  onReflectionChange: (text: string) => void;
  onStartEdit: () => void;
  onSaveReflection: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  onPromoteToCanon: () => void;
  isSubmitting: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const signal = getStrongestSignal(book.signals);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="group bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-all">
      {/* Signal label */}
      {signal && signal.confidence >= 0.6 && (
        <p className="text-xs text-amber-600/70 mb-3">
          {SIGNAL_LABELS[signal.type]}
        </p>
      )}

      <div className="flex gap-4">
        <BookCover
          src={book.book.coverUrl}
          title={book.book.title}
          author={book.book.author}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1f1a17]">{book.book.title}</h3>
          {book.book.author && (
            <p className="text-sm text-neutral-500">{book.book.author}</p>
          )}

          {/* Reflection */}
          {isEditing ? (
            <div className="mt-4">
              <label className="block text-sm text-[#1f1a17] mb-2">
                What stayed with you?
              </label>
              <p className="text-xs text-neutral-400 mb-2">
                A question, a tension, a moment you can&apos;t quite set down.
              </p>
              <textarea
                ref={textareaRef}
                value={reflectionText}
                onChange={(e) => onReflectionChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onSaveReflection}
                  disabled={!reflectionText.trim() || isSubmitting}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={onCancelEdit}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : book.reflection ? (
            <div className="mt-4">
              <p className="text-sm text-neutral-600 leading-relaxed italic">
                {book.reflection.content}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={onStartEdit}
                className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
              >
                What stayed with you?
              </button>
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {book.reflection && (
                <button
                  onClick={onStartEdit}
                  className="text-neutral-400 hover:text-[#1f1a17] transition-colors"
                >
                  Edit reflection
                </button>
              )}
              <button
                onClick={onPromoteToCanon}
                disabled={isSubmitting}
                className="text-neutral-400 hover:text-[#1f1a17] transition-colors"
              >
                Move to canon
              </button>
              <button
                onClick={onRemove}
                disabled={isSubmitting}
                className="text-neutral-400 hover:text-red-500 transition-colors"
              >
                Remove from Stayed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
