'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { BookCover } from '@/components/ui/book-cover';
import Link from 'next/link';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface CanonEntry {
  id: string;
  position: number;
  reflectionNote: string | null;
  addedAt: string;
  removedAt: string | null;
}

interface UserBookStatus {
  id: string;
  status: 'WANT_TO_READ' | 'READING' | 'READ';
  userRating: number | null;
  userNotes: string | null;
  sourcePersonName: string | null;
  updatedAt: string;
  canonEntry: CanonEntry | null;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Empty State Definitions
// ═══════════════════════════════════════════════════════════════════

type EmptyStateType = 'true_empty' | 'no_canon' | 'has_canon_no_signals' | 'full';

function getEmptyStateType(
  hasCanon: boolean,
  hasFiveStars: boolean,
  hasNewSignals: boolean
): EmptyStateType {
  if (!hasFiveStars && !hasCanon) return 'true_empty';
  if (hasFiveStars && !hasCanon) return 'no_canon';
  if (hasCanon && !hasNewSignals) return 'has_canon_no_signals';
  return 'full';
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function MyBooksPage() {
  const [books, setBooks] = useState<UserBookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Canon promotion modal state
  const [promotingBook, setPromotingBook] = useState<UserBookStatus | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canon removal confirmation
  const [removingCanon, setRemovingCanon] = useState<{book: UserBookStatus; canonId: string} | null>(null);

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

  // Separate books into categories
  const { canonBooks, fiveStarBooks, otherBooks } = useMemo(() => {
    const canon: UserBookStatus[] = [];
    const fiveStars: UserBookStatus[] = [];
    const others: UserBookStatus[] = [];

    books.forEach((book) => {
      if (book.canonEntry && !book.canonEntry.removedAt) {
        canon.push(book);
      } else if (book.userRating === 5 || book.status === 'READ') {
        fiveStars.push(book);
      } else {
        others.push(book);
      }
    });

    // Sort canon by position
    canon.sort((a, b) => (a.canonEntry?.position ?? 0) - (b.canonEntry?.position ?? 0));

    return { canonBooks: canon, fiveStarBooks: fiveStars, otherBooks: others };
  }, [books]);

  // Determine empty state type
  const emptyStateType = getEmptyStateType(
    canonBooks.length > 0,
    fiveStarBooks.length > 0 || canonBooks.length > 0,
    fiveStarBooks.length > 0
  );

  // ─────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────

  const handlePromoteToCanon = async () => {
    if (!promotingBook) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBookId: promotingBook.id,
          reflectionNote: reflectionNote || undefined,
        }),
      });
      await fetchBooks();
      setPromotingBook(null);
      setReflectionNote('');
    } catch (error) {
      console.error('Failed to add to canon:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromCanon = async () => {
    if (!removingCanon) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/canon', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonEntryId: removingCanon.canonId }),
      });
      await fetchBooks();
      setRemovingCanon(null);
    } catch (error) {
      console.error('Failed to remove from canon:', error);
    } finally {
      setIsSubmitting(false);
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
          <p className="text-neutral-400 text-sm">Loading your library...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-12">
        <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
          My Books
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed max-w-lg">
          Not every book you read. Just the ones that stayed.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          EMPTY STATES
      ═══════════════════════════════════════════════════════════════════ */}
      {emptyStateType === 'true_empty' && (
        <TrueEmptyState />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: YOUR CANON (books that stayed)
      ═══════════════════════════════════════════════════════════════════ */}
      {canonBooks.length > 0 && (
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Your Canon
            </h2>
            <span className="text-xs text-neutral-300">
              {canonBooks.length} book{canonBooks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Books that changed how you see things.
          </p>

          <div className="space-y-4">
            {canonBooks.map((item, index) => (
              <CanonBookCard
                key={item.id}
                item={item}
                position={index + 1}
                expanded={expandedNotes.has(item.id)}
                onToggleNotes={() => toggleNotes(item.id)}
                onRemove={() => setRemovingCanon({
                  book: item,
                  canonId: item.canonEntry!.id
                })}
              />
            ))}
          </div>
        </section>
      )}

      {/* No canon prompt for users with 5-stars but no canon */}
      {emptyStateType === 'no_canon' && (
        <NoCanonPrompt count={fiveStarBooks.length} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: FIVE-STAR BOOKS (candidates for canon)
      ═══════════════════════════════════════════════════════════════════ */}
      {fiveStarBooks.length > 0 && (
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Five-Star Books
            </h2>
            <span className="text-xs text-neutral-300">
              {fiveStarBooks.length} book{fiveStarBooks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Books you loved. Some may belong in your canon.
          </p>

          <div className="space-y-3">
            {fiveStarBooks.map((item) => (
              <FiveStarBookCard
                key={item.id}
                item={item}
                expanded={expandedNotes.has(item.id)}
                onToggleNotes={() => toggleNotes(item.id)}
                onPromote={() => setPromotingBook(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Canon + no new signals state */}
      {emptyStateType === 'has_canon_no_signals' && canonBooks.length > 0 && (
        <HasCanonNoSignalsState canonCount={canonBooks.length} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      {(canonBooks.length > 0 || fiveStarBooks.length > 0) && (
        <footer className="mt-16 pt-8 border-t border-black/5 text-center space-y-4">
          <Link
            href="/reflections"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors block"
          >
            See your reflections
          </Link>
          <Link
            href="/import"
            className="text-xs text-neutral-300 hover:text-neutral-500 transition-colors block"
          >
            Import more from Goodreads
          </Link>
        </footer>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Canon Promotion Modal */}
      {promotingBook && (
        <PromoteToCanonModal
          book={promotingBook}
          reflectionNote={reflectionNote}
          onNoteChange={setReflectionNote}
          onConfirm={handlePromoteToCanon}
          onCancel={() => {
            setPromotingBook(null);
            setReflectionNote('');
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Canon Removal Confirmation */}
      {removingCanon && (
        <RemoveFromCanonModal
          book={removingCanon.book}
          onConfirm={handleRemoveFromCanon}
          onCancel={() => setRemovingCanon(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Empty State Components
// ═══════════════════════════════════════════════════════════════════

function TrueEmptyState() {
  return (
    <div className="bg-[#fdfcfa] border border-[#f0ebe3] rounded-2xl p-10 text-center">
      <div className="max-w-sm mx-auto">
        <h3 className="text-lg font-medium text-[#1f1a17] mb-3">
          Your library starts here
        </h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Import your reading history from Goodreads, or wait for
          recommendations from people you trust.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/import">
            <Button>Import from Goodreads</Button>
          </Link>
          <Link href="/feed">
            <Button variant="secondary">See incoming signals</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function NoCanonPrompt({ count }: { count: number }) {
  return (
    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-8 mb-16">
      <div className="max-w-md">
        <h3 className="text-base font-medium text-[#1f1a17] mb-2">
          You have {count} five-star book{count !== 1 ? 's' : ''}
        </h3>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Which ones stayed with you? Promote them to your canon—the
          books that changed how you see things.
        </p>
      </div>
    </div>
  );
}

function HasCanonNoSignalsState({ canonCount }: { canonCount: number }) {
  return (
    <div className="bg-neutral-50 rounded-2xl p-8 text-center">
      <p className="text-sm text-neutral-500 mb-4">
        Your canon has {canonCount} book{canonCount !== 1 ? 's' : ''}.
        <br />
        New signals will appear here as they arrive.
      </p>
      <Link href="/circle">
        <Button variant="secondary" size="sm">
          Add a source
        </Button>
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Book Card Components
// ═══════════════════════════════════════════════════════════════════

function CanonBookCard({
  item,
  position,
  expanded,
  onToggleNotes,
  onRemove,
}: {
  item: UserBookStatus;
  position: number;
  expanded: boolean;
  onToggleNotes: () => void;
  onRemove: () => void;
}) {
  const reflectionNote = item.canonEntry?.reflectionNote;
  const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
  const hasNotes = reflectionNote || cleanedNotes;
  const displayNote = reflectionNote || cleanedNotes;
  const isLongNote = displayNote && displayNote.length > 150;

  return (
    <div className="group bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Position indicator */}
        <div className="flex-shrink-0 w-6 text-center">
          <span className="text-xs font-medium text-neutral-300">
            {position}
          </span>
        </div>

        {/* Cover */}
        <BookCover
          src={item.book.coverUrl}
          title={item.book.title}
          author={item.book.author}
          size="lg"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1f1a17]">
            {item.book.title}
          </h3>
          {item.book.author && (
            <p className="text-sm text-neutral-500">{item.book.author}</p>
          )}

          {/* Reflection/Notes */}
          {hasNotes && (
            <div className="mt-3">
              {reflectionNote && (
                <p className="text-xs text-amber-600/70 mb-1">Your reflection</p>
              )}
              <p className="text-sm text-neutral-600 leading-relaxed italic">
                {isLongNote && !expanded
                  ? displayNote!.slice(0, 150) + '...'
                  : displayNote}
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
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onRemove}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
            >
              Remove from canon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiveStarBookCard({
  item,
  expanded,
  onToggleNotes,
  onPromote,
}: {
  item: UserBookStatus;
  expanded: boolean;
  onToggleNotes: () => void;
  onPromote: () => void;
}) {
  const cleanedNotes = item.userNotes ? normalizeGoodreadsText(item.userNotes) : null;
  const hasNotes = cleanedNotes && cleanedNotes.length > 0;
  const isLongNote = hasNotes && cleanedNotes.length > 150;
  const sourceName = item.sourcePersonName;

  return (
    <div className="group bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Cover */}
        <BookCover
          src={item.book.coverUrl}
          title={item.book.title}
          author={item.book.author}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-[#1f1a17]">
                {item.book.title}
              </h3>
              {item.book.author && (
                <p className="text-sm text-neutral-500">{item.book.author}</p>
              )}
            </div>
          </div>

          {/* Source attribution */}
          {sourceName && (
            <p className="text-xs text-neutral-400 mt-2">
              From {sourceName}
            </p>
          )}

          {/* Notes */}
          {hasNotes && (
            <div className="mt-3">
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
          <div className="mt-4">
            <button
              onClick={onPromote}
              className="px-4 py-1.5 text-xs font-medium text-[#1f1a17] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              Add to canon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Modal Components
// ═══════════════════════════════════════════════════════════════════

function PromoteToCanonModal({
  book,
  reflectionNote,
  onNoteChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  book: UserBookStatus;
  reflectionNote: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#1f1a17] mb-2">
          Add to your canon
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          Canon books are the ones that stayed with you—the ones that
          changed how you see things.
        </p>

        {/* Book preview */}
        <div className="flex gap-3 mb-6 p-4 bg-neutral-50 rounded-xl">
          <BookCover
            src={book.book.coverUrl}
            title={book.book.title}
            author={book.book.author}
            size="sm"
          />
          <div>
            <p className="font-medium text-[#1f1a17]">{book.book.title}</p>
            {book.book.author && (
              <p className="text-sm text-neutral-500">{book.book.author}</p>
            )}
          </div>
        </div>

        {/* Reflection prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1f1a17] mb-2">
            Why did this one stay with you?
            <span className="text-neutral-400 font-normal"> (optional)</span>
          </label>
          <textarea
            value={reflectionNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="A sentence or two..."
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add to canon'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RemoveFromCanonModal({
  book,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  book: UserBookStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#1f1a17] mb-2">
          Remove from canon?
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          <strong>{book.book.title}</strong> will move back to your
          five-star books. You can always add it back later.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Keep in canon
          </Button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
