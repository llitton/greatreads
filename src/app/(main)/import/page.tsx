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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN A: Upload - Ceremonial threshold
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'upload') {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* Header - lead with intent */}
        <header className="mb-16">
          <h1 className="text-2xl font-serif text-[#1f1a17] mb-3">
            Bring in only what mattered
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            This import looks for the books you loved enough to give five stars — and quietly ignores the rest.
          </p>
        </header>

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
            <p className="text-[15px] font-medium text-[#1f1a17] mb-2">
              Upload your Goodreads export
            </p>
            <p className="text-sm text-neutral-500 mb-5">
              We&apos;ll show you exactly what qualifies.
            </p>

            {/* Expectation setting */}
            <div className="inline-flex flex-col items-start text-left bg-white rounded-xl p-5 border border-black/5">
              <p className="text-xs text-neutral-400 mb-2">Typical result</p>
              <p className="text-sm text-neutral-600">5–20 books</p>
              <p className="text-sm text-neutral-600">All rated ★★★★★</p>
              <p className="text-sm text-neutral-400">No shelves, no averages, no noise</p>
            </div>
          </label>
        </section>

        {/* Single narrative flow for instructions */}
        <section className="mb-8">
          <p className="text-sm text-neutral-500 leading-relaxed mb-3">
            Export your Goodreads library, upload the CSV here, and review what qualifies before anything is saved.
          </p>
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

        {/* What this will never do - a pledge */}
        <section className="py-8 border-y border-neutral-100 mb-8">
          <p className="text-xs text-neutral-300 uppercase tracking-widest mb-5">
            What this import will never do
          </p>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>Create a feed you need to check</p>
            <p>Track your reading progress</p>
            <p>Surface books you didn&apos;t love</p>
            <p>Post anything back to Goodreads</p>
          </div>
        </section>

        {/* Quiet reassurance */}
        <section className="text-center mb-8">
          <p className="text-sm text-neutral-400 leading-relaxed">
            This is a one-time import.
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
  // SCREEN C: Preview - A reveal, not a checklist
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'preview' && preview) {
    const qualifyingCount = preview.fiveStarBooks.length + preview.favorites.length;

    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* Reveal header */}
        <header className="mb-8 text-center">
          <p className="text-4xl font-serif text-[#1f1a17] mb-3">
            {qualifyingCount}
          </p>
          <p className="text-lg text-neutral-600 mb-2">
            books showed the strongest signal
          </p>
          <p className="text-sm text-neutral-400">
            These are the books that earned their place.
          </p>
        </header>

        {/* Signal breakdown - subtle */}
        <section className="mb-8 py-5 border-y border-neutral-100">
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-medium text-amber-600">{preview.fiveStarBooks.length}</p>
              <p className="text-xs text-neutral-400">five-star</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-rose-500">{preview.favorites.length}</p>
              <p className="text-xs text-neutral-400">favorites</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-neutral-400">{preview.booksWithNotes.length}</p>
              <p className="text-xs text-neutral-400">with notes</p>
            </div>
          </div>
        </section>

        {/* What happens - quiet */}
        <section className="mb-8">
          <p className="text-xs text-neutral-300 uppercase tracking-widest mb-3">
            What this means
          </p>
          <div className="space-y-2 text-sm text-neutral-500 leading-relaxed">
            <p>Your 5-stars will appear in your friends&apos; feeds.</p>
            <p>Favorites will populate &quot;Stayed.&quot;</p>
            <p>Some may be suggested for your Top 10.</p>
          </div>
        </section>

        {/* Options - simplified */}
        <section className="mb-8 space-y-3">
          <p className="text-xs text-neutral-300 uppercase tracking-widest mb-3">
            What to bring in
          </p>

          <label className="flex items-center justify-between p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3] cursor-pointer hover:bg-neutral-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-[#1f1a17]">5-star ratings</p>
              <p className="text-xs text-neutral-400">{preview.fiveStarBooks.length} books</p>
            </div>
            <input
              type="checkbox"
              checked={importFiveStars}
              onChange={(e) => setImportFiveStars(e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
          </label>

          <label className="flex items-center justify-between p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3] cursor-pointer hover:bg-neutral-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-[#1f1a17]">Favorites shelf</p>
              <p className="text-xs text-neutral-400">{preview.favorites.length} books</p>
            </div>
            <input
              type="checkbox"
              checked={importFavorites}
              onChange={(e) => setImportFavorites(e.target.checked)}
              className="w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
          </label>

          {preview.booksWithNotes.length > 0 && (
            <label className="flex items-center justify-between p-5 bg-[#fdfcfa] rounded-xl border border-[#f0ebe3] cursor-pointer hover:bg-neutral-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-[#1f1a17]">Notes (private)</p>
                <p className="text-xs text-neutral-400">{preview.booksWithNotes.length} books</p>
              </div>
              <input
                type="checkbox"
                checked={importNotes}
                onChange={(e) => setImportNotes(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
              />
            </label>
          )}
        </section>

        {/* Visibility - cleaner */}
        <section className="mb-8">
          <p className="text-xs text-neutral-300 uppercase tracking-widest mb-3">
            Visibility
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setVisibility('friends')}
              className={`flex-1 p-5 rounded-xl border transition-all text-left ${
                visibility === 'friends'
                  ? 'border-[#1f1a17] bg-neutral-50'
                  : 'border-[#f0ebe3] hover:border-neutral-200'
              }`}
            >
              <p className="text-sm font-medium text-[#1f1a17]">Friends</p>
              <p className="text-xs text-neutral-400">Show in feeds</p>
            </button>
            <button
              onClick={() => setVisibility('private')}
              className={`flex-1 p-5 rounded-xl border transition-all text-left ${
                visibility === 'private'
                  ? 'border-[#1f1a17] bg-neutral-50'
                  : 'border-[#f0ebe3] hover:border-neutral-200'
              }`}
            >
              <p className="text-sm font-medium text-[#1f1a17]">Only me</p>
              <p className="text-xs text-neutral-400">Keep private</p>
            </button>
          </div>
        </section>

        {/* Actions */}
        <section className="flex gap-3">
          <Button onClick={handleImport} size="lg" className="flex-1">
            Bring these in
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Cancel
          </Button>
        </section>
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
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="text-center mb-16">
          <p className="text-4xl font-serif text-[#1f1a17] mb-4">
            Done
          </p>
          <p className="text-lg text-neutral-500">
            Your library is in.
          </p>
        </div>

        {/* Results - quiet revelation */}
        <section className="mb-8 py-8 border-y border-neutral-100">
          <div className="flex justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-medium text-amber-600">{result.feedBooks}</p>
              <p className="text-xs text-neutral-400">for friends</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-rose-500">{result.stayedWithMe}</p>
              <p className="text-xs text-neutral-400">in Stayed</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-neutral-500">{result.topTenCandidates}</p>
              <p className="text-xs text-neutral-400">Top 10 candidates</p>
            </div>
          </div>
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
          <Link href="/feed">
            <Button className="w-full">Go to Feed</Button>
          </Link>
          <Link href="/reflections">
            <Button variant="secondary" className="w-full">See what stayed</Button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-neutral-50 text-center">
          <p className="text-sm text-neutral-300 italic leading-relaxed">
            If a book appears after import, it&apos;s because it earned its place.
          </p>
        </footer>
      </div>
    );
  }

  return null;
}
