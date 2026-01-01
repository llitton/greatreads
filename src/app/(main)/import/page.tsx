'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Types for parsed CSV data
interface ParsedBook {
  goodreadsBookId: string;
  title: string;
  author: string | null;
  isbn13: string | null;
  myRating: number;
  exclusiveShelf: 'read' | 'currently-reading' | 'to-read' | null;
  bookshelves: string[];
  dateRead: string | null;
  dateAdded: string | null;
  myReview: string | null;
  readCount: number;
  yearPublished: number | null;
  isFavorite: boolean;
}

interface ImportPreview {
  fiveStarBooks: ParsedBook[];
  favorites: ParsedBook[];
  booksWithNotes: ParsedBook[];
  readBooks: ParsedBook[];
  currentlyReading: ParsedBook[];
  wantToRead: ParsedBook[];
  allBooks: ParsedBook[];
}

interface ImportProgress {
  added: number;
  skipped: number;
  failed: number;
  total: number;
}

interface ImportResult {
  feedBooks: number;
  stayedWithMe: number;
  topTenCandidates: number;
}

type Screen = 'upload' | 'reading' | 'preview' | 'importing' | 'done' | 'error';

export default function ImportPage() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({ added: 0, skipped: 0, failed: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import options
  const [importFiveStars, setImportFiveStars] = useState(true);
  const [importFavorites, setImportFavorites] = useState(true);
  const [importShelves, setImportShelves] = useState(true);
  const [importNotes, setImportNotes] = useState(false);
  const [visibility, setVisibility] = useState<'friends' | 'private'>('friends');

  // Books to exclude from import (user removed during review)
  const [excludedBookIds, setExcludedBookIds] = useState<Set<string>>(new Set());

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreen('reading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse file');
      }

      const data: ImportPreview = await res.json();
      setPreview(data);

      // Brief pause before showing results - let it settle
      setTimeout(() => {
        setScreen('preview');
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setErrorCode('FILE_PARSE_ERROR');
      setScreen('error');
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!preview) return;

    setScreen('importing');
    setProgress({ added: 0, skipped: 0, failed: 0, total: 0 });

    try {
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importFiveStars,
          importFavorites,
          importShelves,
          importNotes,
          visibility,
          preview,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import could not be completed');
        setErrorCode(data.errorCode || 'IMPORT_FAILED');
        setScreen('error');
        return;
      }

      setResult(data.result);
      setProgress(data.progress);
      setScreen('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setErrorCode('CONNECTION_ERROR');
      setScreen('error');
    }
  }, [preview, importFiveStars, importFavorites, importShelves, importNotes, visibility]);

  const handleReset = () => {
    setScreen('upload');
    setPreview(null);
    setProgress({ added: 0, skipped: 0, failed: 0, total: 0 });
    setResult(null);
    setError('');
    setErrorCode('');
    setExcludedBookIds(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveBook = (bookId: string) => {
    setExcludedBookIds(prev => new Set([...prev, bookId]));
  };

  const handleRemoveAll = () => {
    if (!preview) return;
    const allIds = preview.fiveStarBooks.map(b => b.goodreadsBookId);
    setExcludedBookIds(new Set(allIds));
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN A: Upload - Ceremonial threshold
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'upload') {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* Header - lead with intent */}
        <header className="mb-10">
          <h1 className="text-2xl font-serif text-[#1f1a17] mb-3">
            Bring in only what stayed with you
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            We&apos;ll bring in only the books you loved enough to give five stars — and quietly ignore the rest.
          </p>
        </header>

        {/* What this import will never do - a pledge (trust builder first) */}
        <section className="py-6 border-y border-neutral-100 mb-10">
          <p className="text-xs text-neutral-400 mb-4">
            This import is intentionally limited.
          </p>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>It will never create a feed you need to check</p>
            <p>It will never track your reading progress</p>
            <p>It will never surface books you didn&apos;t love</p>
            <p>It will never post anything back to Goodreads</p>
          </div>
        </section>

        {/* Upload area - a promise, not a box */}
        <section className="mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="block w-full p-8 bg-[#fdfcfa] border-2 border-dashed border-[#f0ebe3] rounded-2xl text-center cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition-all"
          >
            <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
              Upload Goodreads export
            </p>
            <p className="text-sm text-neutral-400 mb-5">
              Preview before saving
            </p>

            {/* Expectation setting */}
            <div className="inline-flex flex-col items-start text-left bg-white rounded-xl p-5 border border-black/5">
              <p className="text-xs text-neutral-400 mb-2">What usually comes through</p>
              <p className="text-sm text-neutral-600">• 5–20 books you truly loved</p>
              <p className="text-sm text-neutral-600">• Only five-star reads</p>
              <p className="text-sm text-neutral-400">• No shelves, averages, or reading stats</p>
            </div>
          </label>
        </section>

        {/* Where books go - the outcome */}
        <section className="mb-8 p-5 bg-neutral-50 rounded-xl">
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-3">After import</p>
          <p className="text-sm text-neutral-600 leading-relaxed mb-2">
            These books will appear in <span className="font-medium text-[#1f1a17]">My Books</span> — not your canon.
          </p>
          <p className="text-sm text-neutral-500 leading-relaxed">
            You&apos;ll decide what stays, what fades, and what belongs in your Top 10.
          </p>
        </section>

        {/* Review step expectation */}
        <section className="mb-8 text-center">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Before anything is saved, you&apos;ll review the list.
            <br />
            <span className="text-neutral-400">Remove anything that doesn&apos;t feel right.</span>
          </p>
        </section>

        {/* Instructions */}
        <section className="mb-8">
          <details className="group">
            <summary className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors">
              How to export from Goodreads →
            </summary>
            <div className="mt-3 pl-5 border-l-2 border-neutral-100 space-y-2 text-xs text-neutral-500">
              <p>Sign in to Goodreads.com</p>
              <p>Click &quot;My Books&quot; in the navigation</p>
              <p>Look for &quot;Tools&quot; in the left sidebar</p>
              <p>Click &quot;Import and Export&quot;</p>
              <p>Click &quot;Export Library&quot;</p>
              <p className="text-neutral-400 italic">May take a few minutes for large libraries.</p>
            </div>
          </details>
        </section>

        {/* Quiet reassurance */}
        <section className="text-center mb-8">
          <p className="text-sm text-neutral-400 leading-relaxed">
            Most people import once.
            <br />
            You can delete everything later.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-neutral-50 text-center">
          <Link
            href="/feed"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
          >
            ← Back to Feed
          </Link>
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN B: Reading - Calm interstitial
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'reading') {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-4xl mb-8 opacity-50">◌</div>
            <p className="text-lg text-[#1f1a17] mb-2">
              Reading your history...
            </p>
            <p className="text-sm text-neutral-400">
              Looking only for books that earned your highest rating.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN: Error
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'error') {
    const isFileError = errorCode === 'FILE_PARSE_ERROR';
    const isBackendError = ['STORAGE_NOT_READY', 'CONNECTION_ERROR', 'IMPORT_FAILED', 'DUPLICATE_ENTRY'].includes(errorCode);

    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-8 opacity-50">◌</div>

            <h2 className="text-lg font-medium text-[#1f1a17] mb-4">
              {isFileError
                ? 'We couldn\'t read this file'
                : 'We hit a snag'}
            </h2>

            {isBackendError ? (
              <div className="space-y-3 mb-8">
                <p className="text-sm text-neutral-500">
                  Your file looks fine. We ran into an internal issue.
                </p>
                <p className="text-sm text-neutral-400">
                  Nothing was added yet, and nothing was lost.
                </p>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 mb-8">
                Make sure it&apos;s the Goodreads &quot;Library Export&quot; CSV.
              </p>
            )}

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={handleReset}>
                {isBackendError ? 'Try again' : 'Try a different file'}
              </Button>
              <Link href="/feed">
                <Button variant="secondary" className="w-full">
                  Back to Feed
                </Button>
              </Link>
            </div>

            <p className="mt-12 text-sm text-neutral-300 italic">
              GreatReads is built to be careful with your reading history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN C: Preview - Simple review, not a checklist
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'preview' && preview) {
    const qualifyingBooks = preview.fiveStarBooks.filter(
      book => !excludedBookIds.has(book.goodreadsBookId)
    );
    const selectedCount = qualifyingBooks.length;
    const hasBooks = selectedCount > 0;

    // Empty state - nothing qualifies
    if (preview.fiveStarBooks.length === 0) {
      return (
        <div className="max-w-xl mx-auto px-5 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-8 opacity-50">◌</div>
              <h2 className="text-lg font-medium text-[#1f1a17] mb-4">
                Nothing qualifies — and that&apos;s okay.
              </h2>
              <p className="text-sm text-neutral-500 mb-8">
                Five-star imports are intentionally rare.
              </p>
              <Link href="/feed">
                <Button>Back to Feed</Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-serif text-[#1f1a17] mb-3">
            Review what qualifies
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed mb-1">
            These are the books you rated five stars.
          </p>
          <p className="text-sm text-neutral-400">
            They&apos;ll be added to <span className="font-medium text-neutral-500">My Books</span> — not your canon.
          </p>
        </header>

        {/* Count and bulk action */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-neutral-500">
            {selectedCount} book{selectedCount !== 1 ? 's' : ''} selected
          </p>
          {selectedCount > 0 && (
            <button
              onClick={handleRemoveAll}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
            >
              Remove all
            </button>
          )}
        </div>

        {/* Book list */}
        <section className="mb-8 space-y-2">
          {qualifyingBooks.map((book) => (
            <div
              key={book.goodreadsBookId}
              className="flex items-center gap-4 p-4 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3] group"
            >
              {/* Placeholder cover */}
              <div className="w-10 h-14 bg-neutral-100 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-neutral-300 text-xs">📖</span>
              </div>

              {/* Book info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1f1a17] truncate">
                  {book.title}
                </p>
                {book.author && (
                  <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                )}
                <p className="text-[10px] text-neutral-300 mt-1">From Goodreads</p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveBook(book.goodreadsBookId)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-all"
                aria-label="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* All removed state */}
          {selectedCount === 0 && preview.fiveStarBooks.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-500 mb-4">All books removed.</p>
              <button
                onClick={() => setExcludedBookIds(new Set())}
                className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
              >
                Restore all →
              </button>
            </div>
          )}
        </section>

        {/* Actions - sticky at bottom */}
        <section className="flex gap-3">
          <Button
            onClick={handleImport}
            size="lg"
            className="flex-1"
            disabled={!hasBooks}
          >
            Add to My Books
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Cancel import
          </Button>
        </section>

        {/* Trust footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-neutral-300 italic">
            You can delete or change anything later.
          </p>
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN D: Importing
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'importing') {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-4xl mb-8 opacity-50">◌</div>
            <p className="text-lg text-[#1f1a17] mb-2">
              Adding to your library...
            </p>
            {progress.added > 0 && (
              <p className="text-sm text-neutral-400">
                {progress.added} added
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN E: Done
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'done' && result) {
    const totalAdded = progress.added;

    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="text-center mb-12">
          <p className="text-4xl font-serif text-[#1f1a17] mb-4">
            {totalAdded} book{totalAdded !== 1 ? 's' : ''} added
          </p>
          <p className="text-lg text-neutral-500">
            They&apos;re in My Books now.
          </p>
        </div>

        {/* What happens next - quiet */}
        <section className="mb-8 p-5 bg-neutral-50 rounded-xl">
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-3">What happens next</p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            These books are yours to revisit. When you&apos;re ready, add reflections to the ones that shaped you — and consider them for your canon.
          </p>
        </section>

        {/* Import notes */}
        {(progress.skipped > 0 || progress.failed > 0) && (
          <section className="mb-8 text-center text-sm text-neutral-400 space-y-1">
            {progress.skipped > 0 && <p>{progress.skipped} duplicates skipped</p>}
            {progress.failed > 0 && <p>{progress.failed} couldn&apos;t be matched</p>}
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/my-books">
            <Button className="w-full">Go to My Books</Button>
          </Link>
          <Link href="/feed">
            <Button variant="secondary" className="w-full">Back to Feed</Button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-50 text-center">
          <p className="text-sm text-neutral-300 italic leading-relaxed">
            Importing saves books to My Books.
            <br />
            Canon takes reflection and time.
          </p>
        </footer>
      </div>
    );
  }

  return null;
}
