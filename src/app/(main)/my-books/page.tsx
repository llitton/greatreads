'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BookCover } from '@/components/ui/book-cover';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface CanonReadyBook {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  userRating: number | null;
  sourcePersonName: string | null;
  reflection: {
    id: string;
    content: string;
    kind: 'NOTE' | 'PROMPT' | 'REVISIT';
    updatedAt: string;
  } | null;
  score: number;
  scoreBreakdown: {
    promptOrRevisitKind: boolean;
    multipleReflections: boolean;
    fromTrustedSource: boolean;
    recentReflection: boolean;
    fiveStar: boolean;
  };
}

interface FiveStarBook {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  userRating: number | null;
  sourcePersonName: string | null;
  hasReflection: boolean;
  isInCanon: boolean;
  canonPosition: number | null;
}

interface MyBooksData {
  canonReady: CanonReadyBook[];
  allFiveStar: FiveStarBook[];
  inCanon: FiveStarBook[];
  stats: {
    totalFiveStar: number;
    canonReadyCount: number;
    inCanonCount: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const CANON_MAX_SIZE = 10;

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function MyBooksPage() {
  const [data, setData] = useState<MyBooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Modal states
  const [promotingBook, setPromotingBook] = useState<CanonReadyBook | FiveStarBook | null>(null);
  const [canonFullBook, setCanonFullBook] = useState<CanonReadyBook | FiveStarBook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/my-books');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────

  const handlePromoteClick = (book: CanonReadyBook | FiveStarBook) => {
    // Check if canon is full
    if (data && data.inCanon.length >= CANON_MAX_SIZE) {
      setCanonFullBook(book);
    } else {
      setPromotingBook(book);
    }
  };

  const handleConfirmPromotion = async (reflectionContent: string) => {
    if (!promotingBook) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/canon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBookId: promotingBook.userBookId,
          reflectionContent,
          reflectionKind: 'PROMPT',
        }),
      });

      if (res.ok) {
        setPromotingBook(null);
        await fetchBooks();
      } else {
        const error = await res.json();
        console.error('Failed to add to canon:', error);
      }
    } catch (error) {
      console.error('Failed to add to canon:', error);
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
          <p className="text-neutral-400 text-sm">Loading your books...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-neutral-500">Failed to load books.</p>
      </div>
    );
  }

  const { canonReady, allFiveStar, inCanon, stats } = data;
  const hasNoBooks = stats.totalFiveStar === 0;
  const hasCanon = inCanon.length > 0;

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
          Which books belong in your canon? Add a reflection to make them canon-ready.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUE EMPTY STATE
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoBooks && <TrueEmptyState />}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: CANON-READY
          Books with reflections, sorted by score. These are ready for promotion.
      ═══════════════════════════════════════════════════════════════════ */}
      {canonReady.length > 0 && (
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Canon-ready
            </h2>
            <span className="text-xs text-neutral-300">
              {canonReady.length} book{canonReady.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            You&apos;ve reflected on these. Ready when you are.
          </p>

          <div className="space-y-3">
            {canonReady.map((book) => (
              <CanonReadyCard
                key={book.userBookId}
                book={book}
                expanded={expandedNotes.has(book.userBookId)}
                onToggleNotes={() => toggleNotes(book.userBookId)}
                onPromote={() => handlePromoteClick(book)}
                canonFull={inCanon.length >= CANON_MAX_SIZE}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: ALL FIVE-STAR BOOKS
          Books without reflections. Need reflection before canon.
      ═══════════════════════════════════════════════════════════════════ */}
      {allFiveStar.length > 0 && (
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              All five-star books
            </h2>
            <span className="text-xs text-neutral-300">
              {allFiveStar.length} book{allFiveStar.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Add a reflection to make them canon-ready.
          </p>

          <div className="space-y-3">
            {allFiveStar.map((book) => (
              <FiveStarCard
                key={book.userBookId}
                book={book}
                onAddReflection={() => handlePromoteClick(book)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          IN YOUR CANON (summary link)
      ═══════════════════════════════════════════════════════════════════ */}
      {hasCanon && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 mb-16">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1f1a17] mb-1">
                Your Canon
              </h3>
              <p className="text-sm text-neutral-500">
                {inCanon.length} of {CANON_MAX_SIZE} books
              </p>
            </div>
            <Link href="/top10">
              <Button variant="secondary" size="sm">
                View canon
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* No five-star books prompt */}
      {!hasNoBooks && canonReady.length === 0 && allFiveStar.length === 0 && !hasCanon && (
        <NoCanonPrompt />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      {(canonReady.length > 0 || allFiveStar.length > 0 || hasCanon) && (
        <footer className="mt-16 pt-8 border-t border-black/5 text-center space-y-4">
          <Link
            href="/stayed"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors block"
          >
            See books that stayed
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

      {/* Add to Canon Modal (requires reflection) */}
      {promotingBook && (
        <AddToCanonModal
          book={promotingBook}
          existingReflection={'reflection' in promotingBook ? promotingBook.reflection : null}
          onConfirm={handleConfirmPromotion}
          onCancel={() => setPromotingBook(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Canon Full Modal */}
      {canonFullBook && (
        <CanonFullModal
          book={canonFullBook}
          onReviewCanon={() => {
            setCanonFullBook(null);
            window.location.href = '/top10?mode=revisit';
          }}
          onCancel={() => setCanonFullBook(null)}
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

function NoCanonPrompt() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-8 text-center">
      <p className="text-sm text-neutral-500 mb-4">
        No five-star books yet.
        <br />
        Import from Goodreads or save books from your feed.
      </p>
      <Link href="/import">
        <Button variant="secondary" size="sm">
          Import books
        </Button>
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Book Card Components
// ═══════════════════════════════════════════════════════════════════

function CanonReadyCard({
  book,
  expanded,
  onToggleNotes,
  onPromote,
  canonFull,
}: {
  book: CanonReadyBook;
  expanded: boolean;
  onToggleNotes: () => void;
  onPromote: () => void;
  canonFull: boolean;
}) {
  const reflection = book.reflection;
  const isLongNote = reflection && reflection.content.length > 150;
  const displayContent = reflection?.content ?? '';

  return (
    <div className="group bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-all relative">
      <div className="flex gap-4">
        {/* Cover */}
        <BookCover
          src={book.coverUrl}
          title={book.title}
          author={book.author}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-[#1f1a17]">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-sm text-neutral-500">{book.author}</p>
              )}
            </div>

            {/* Score indicator */}
            {book.score >= 6 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                Strong match
              </span>
            )}
          </div>

          {/* Source attribution */}
          {book.sourcePersonName && (
            <p className="text-xs text-neutral-400 mt-2">
              From {book.sourcePersonName}
            </p>
          )}

          {/* Reflection preview */}
          {reflection && (
            <div className="mt-3">
              <p className="text-sm text-neutral-600 leading-relaxed italic">
                {isLongNote && !expanded
                  ? displayContent.slice(0, 150) + '...'
                  : displayContent}
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
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#1f1a17] hover:bg-[#2f2a27] rounded-lg transition-colors"
            >
              {canonFull ? 'Review canon to add' : 'Add to canon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiveStarCard({
  book,
  onAddReflection,
}: {
  book: FiveStarBook;
  onAddReflection: () => void;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-all relative">
      <div className="flex gap-4">
        {/* Cover */}
        <BookCover
          src={book.coverUrl}
          title={book.title}
          author={book.author}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div>
            <h3 className="font-medium text-[#1f1a17]">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-sm text-neutral-500">{book.author}</p>
            )}
          </div>

          {/* Source attribution */}
          {book.sourcePersonName && (
            <p className="text-xs text-neutral-400 mt-2">
              From {book.sourcePersonName}
            </p>
          )}

          {/* Prompt to add reflection */}
          <div className="mt-4">
            <button
              onClick={onAddReflection}
              className="px-4 py-1.5 text-xs font-medium text-[#1f1a17] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              Add reflection
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

function AddToCanonModal({
  book,
  existingReflection,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  book: CanonReadyBook | FiveStarBook;
  existingReflection: { content: string } | null;
  onConfirm: (reflectionContent: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [reflectionText, setReflectionText] = useState(existingReflection?.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = () => {
    if (reflectionText.trim()) {
      onConfirm(reflectionText.trim());
    }
  };

  const isValid = reflectionText.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-semibold text-[#1f1a17] mb-2">
          Add to your canon?
        </h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          Canon is for books that shaped how you think.
          <br />
          <span className="text-amber-600">A reflection is required.</span>
        </p>

        {/* Book preview */}
        <div className="flex gap-3 mb-6 p-4 bg-neutral-50 rounded-xl">
          <BookCover
            src={book.coverUrl}
            title={book.title}
            author={book.author}
            size="sm"
          />
          <div>
            <p className="font-medium text-[#1f1a17]">{book.title}</p>
            {book.author && (
              <p className="text-sm text-neutral-500">{book.author}</p>
            )}
          </div>
        </div>

        {/* Reflection input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1f1a17] mb-2">
            Why did this one stay with you?
          </label>
          <textarea
            ref={textareaRef}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="One sentence is enough..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-neutral-400 mt-1 text-right">
            {reflectionText.length}/500
          </p>
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
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? 'Adding...' : 'Add to canon'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CanonFullModal({
  book,
  onReviewCanon,
  onCancel,
}: {
  book: CanonReadyBook | FiveStarBook;
  onReviewCanon: () => void;
  onCancel: () => void;
}) {
  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-semibold text-[#1f1a17] mb-3">
          Your canon is full
        </h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          To add <strong>{book.title}</strong>, remove one from your canon first.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={onReviewCanon}
            autoFocus
          >
            Review canon
          </Button>
        </div>
      </div>
    </div>
  );
}
