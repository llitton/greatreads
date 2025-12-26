'use client';

import { useState, useCallback, useRef } from 'react';
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

type Screen = 'upload' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

export default function ImportPage() {
  const [screen, setScreen] = useState<Screen>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({ added: 0, skipped: 0, failed: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
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

    setScreen('parsing');
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
      setScreen('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
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
          // Send the preview data back so we don't need server-side session storage
          preview,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await res.json();
      setResult(data.result);
      setProgress(data.progress);
      setScreen('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setScreen('error');
    }
  }, [preview, importFiveStars, importFavorites, importShelves, importNotes, visibility]);

  const handleReset = () => {
    setScreen('upload');
    setPreview(null);
    setProgress({ added: 0, skipped: 0, failed: 0, total: 0 });
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN A: Upload
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'upload') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
            Import from Goodreads
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            This is a one-time upload. GreatReads reads your file, extracts your strongest signals, and saves only what you choose to keep.
          </p>
        </header>

        {/* Step-by-step guide */}
        <section className="mb-12">
          <div className="bg-neutral-50 rounded-2xl p-6 space-y-4">
            <div className="flex gap-4">
              <span className="w-6 h-6 rounded-full bg-[#1f1a17] text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Export your Goodreads library (CSV)</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Go to Goodreads → My Books → Tools → Import and Export → Export Library
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-6 h-6 rounded-full bg-[#1f1a17] text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Upload it here</p>
                <p className="text-sm text-neutral-500 mt-1">
                  We&apos;ll look for your ratings, shelves, and read dates.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-6 h-6 rounded-full bg-[#1f1a17] text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <p className="text-[15px] text-[#1f1a17] font-medium">Preview what will be added</p>
                <p className="text-sm text-neutral-500 mt-1">
                  You&apos;ll see exactly what GreatReads will import before confirming.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Upload area */}
        <section className="mb-12">
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
            className="block w-full p-12 border-2 border-dashed border-neutral-200 rounded-2xl text-center cursor-pointer hover:border-neutral-300 hover:bg-neutral-50/50 transition-all"
          >
            <div className="text-4xl mb-4">📄</div>
            <p className="text-[15px] font-medium text-[#1f1a17] mb-2">
              Upload CSV
            </p>
            <p className="text-sm text-neutral-500">
              or drag and drop your file here
            </p>
          </label>
        </section>

        {/* Reassurance */}
        <section className="space-y-2 text-sm text-neutral-400">
          <p>We&apos;ll never post to Goodreads.</p>
          <p>You can delete imported data anytime.</p>
        </section>

        {/* Help link */}
        <section className="mt-12 pt-8 border-t border-black/5">
          <details className="group">
            <summary className="text-sm text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors">
              <span className="group-open:hidden">Show me how to export →</span>
              <span className="hidden group-open:inline">Hide instructions</span>
            </summary>
            <div className="mt-4 bg-neutral-50 rounded-xl p-5 space-y-3 text-sm text-neutral-600">
              <p><strong>1.</strong> Sign in to Goodreads.com</p>
              <p><strong>2.</strong> Click &quot;My Books&quot; in the navigation</p>
              <p><strong>3.</strong> Look for &quot;Tools&quot; in the left sidebar (below your shelves)</p>
              <p><strong>4.</strong> Click &quot;Import and Export&quot;</p>
              <p><strong>5.</strong> Click &quot;Export Library&quot; at the bottom</p>
              <p><strong>6.</strong> Wait for the download link to appear, then download</p>
              <p className="text-neutral-400 italic pt-2">
                The export may take a few minutes if you have many books.
              </p>
            </div>
          </details>
        </section>

        {/* Back link */}
        <footer className="mt-12 pt-8 border-t border-black/5">
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
  // SCREEN B: Parsing
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'parsing') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-6">📚</div>
            <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
              Reading your file...
            </h2>
            <p className="text-[15px] text-neutral-500">
              Looking for your ratings, shelves, and read dates.
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
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-6">⚠️</div>
            <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
              We couldn&apos;t read this file
            </h2>
            <p className="text-[15px] text-neutral-500 mb-6 leading-relaxed">
              {error || 'Make sure it\'s the Goodreads "Library Export" CSV (not a Kindle export).'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleReset}>
                Try another file
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                Start over
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREEN C: Preview
  // ═══════════════════════════════════════════════════════════════════
  if (screen === 'preview' && preview) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
            Preview your import
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            You&apos;re in control. Choose what to bring into GreatReads.
          </p>
        </header>

        {/* Signal counts */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Strong signals
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-semibold text-amber-600 mb-1">
                {preview.fiveStarBooks.length}
              </div>
              <div className="text-sm text-neutral-600">5-star books</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-semibold text-rose-600 mb-1">
                {preview.favorites.length}
              </div>
              <div className="text-sm text-neutral-600">Favorites</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-semibold text-blue-600 mb-1">
                {preview.booksWithNotes.length}
              </div>
              <div className="text-sm text-neutral-600">With notes</div>
            </div>
          </div>
        </section>

        {/* Library counts */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Library
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl p-5 text-center">
              <div className="text-2xl font-semibold text-neutral-600 mb-1">
                {preview.readBooks.length}
              </div>
              <div className="text-sm text-neutral-500">Read</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-5 text-center">
              <div className="text-2xl font-semibold text-neutral-600 mb-1">
                {preview.currentlyReading.length}
              </div>
              <div className="text-sm text-neutral-500">Reading</div>
            </div>
            <div className="bg-neutral-50 rounded-xl p-5 text-center">
              <div className="text-2xl font-semibold text-neutral-600 mb-1">
                {preview.wantToRead.length}
              </div>
              <div className="text-sm text-neutral-500">Want to Read</div>
            </div>
          </div>
        </section>

        {/* What GreatReads will do */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            What GreatReads will do
          </h2>
          <div className="bg-neutral-50 rounded-xl p-5 space-y-3 text-sm text-neutral-600">
            <p>Your 5-stars will appear in your friends&apos; feeds (if you share them).</p>
            <p>Favorites will populate &quot;Stayed With Me.&quot;</p>
            <p>Some books will be suggested for your Top 10.</p>
          </div>
        </section>

        {/* Import options */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Choose what to import
          </h2>

          <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-black/5 cursor-pointer hover:bg-neutral-50 transition-colors">
            <input
              type="checkbox"
              checked={importFiveStars}
              onChange={(e) => setImportFiveStars(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
            <div>
              <p className="text-[15px] font-medium text-[#1f1a17]">Import 5-star ratings</p>
              <p className="text-sm text-neutral-500">{preview.fiveStarBooks.length} books</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-black/5 cursor-pointer hover:bg-neutral-50 transition-colors">
            <input
              type="checkbox"
              checked={importFavorites}
              onChange={(e) => setImportFavorites(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
            <div>
              <p className="text-[15px] font-medium text-[#1f1a17]">Import Favorites shelf</p>
              <p className="text-sm text-neutral-500">{preview.favorites.length} books</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-black/5 cursor-pointer hover:bg-neutral-50 transition-colors">
            <input
              type="checkbox"
              checked={importShelves}
              onChange={(e) => setImportShelves(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
            <div>
              <p className="text-[15px] font-medium text-[#1f1a17]">Import Read/Want to Read shelves</p>
              <p className="text-sm text-neutral-500">{preview.readBooks.length + preview.currentlyReading.length + preview.wantToRead.length} books</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-black/5 cursor-pointer hover:bg-neutral-50 transition-colors">
            <input
              type="checkbox"
              checked={importNotes}
              onChange={(e) => setImportNotes(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-neutral-300 text-[#1f1a17] focus:ring-[#1f1a17]"
            />
            <div>
              <p className="text-[15px] font-medium text-[#1f1a17]">Import private notes/reviews</p>
              <p className="text-sm text-neutral-500">{preview.booksWithNotes.length} books — these stay private by default</p>
            </div>
          </label>
        </section>

        {/* Visibility */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">
            Visibility for imported 5-stars
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setVisibility('friends')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                visibility === 'friends'
                  ? 'border-[#1f1a17] bg-neutral-50'
                  : 'border-black/5 hover:border-neutral-200'
              }`}
            >
              <p className="text-[15px] font-medium text-[#1f1a17] mb-1">
                Friends
                {visibility === 'friends' && <span className="text-xs text-neutral-400 ml-2">(Recommended)</span>}
              </p>
              <p className="text-sm text-neutral-500">Show in friends&apos; feeds</p>
            </button>
            <button
              onClick={() => setVisibility('private')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                visibility === 'private'
                  ? 'border-[#1f1a17] bg-neutral-50'
                  : 'border-black/5 hover:border-neutral-200'
              }`}
            >
              <p className="text-[15px] font-medium text-[#1f1a17] mb-1">Only me</p>
              <p className="text-sm text-neutral-500">Keep private for now</p>
            </button>
          </div>
        </section>

        {/* Actions */}
        <section className="flex gap-4">
          <Button onClick={handleImport} size="lg" className="flex-1">
            Import selected books
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
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-6">📚</div>
            <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
              Importing...
            </h2>
            {progress.total > 0 && (
              <div className="space-y-2 text-sm text-neutral-500">
                <p>Added: {progress.added}</p>
                <p>Skipped (duplicates): {progress.skipped}</p>
                {progress.failed > 0 && (
                  <p className="text-amber-600">Couldn&apos;t match: {progress.failed}</p>
                )}
              </div>
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
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="text-5xl mb-6">✓</div>
          <h1 className="text-2xl font-semibold text-[#1f1a17] mb-3">
            Import complete
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            Your library is in. Here&apos;s what&apos;s ready now:
          </p>
        </div>

        {/* Results */}
        <section className="mb-12">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-semibold text-amber-600 mb-2">
                {result.feedBooks}
              </div>
              <div className="text-sm text-neutral-600">books your friends can see</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-semibold text-rose-600 mb-2">
                {result.stayedWithMe}
              </div>
              <div className="text-sm text-neutral-600">favorites waiting for your note</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-3xl font-semibold text-blue-600 mb-2">
                {result.topTenCandidates}
              </div>
              <div className="text-sm text-neutral-600">strong Top 10 candidates</div>
            </div>
          </div>
        </section>

        {/* Import stats */}
        {(progress.skipped > 0 || progress.failed > 0) && (
          <section className="mb-12 text-sm text-neutral-500 text-center space-y-1">
            {progress.skipped > 0 && <p>{progress.skipped} duplicates skipped</p>}
            {progress.failed > 0 && <p>{progress.failed} books couldn&apos;t be matched</p>}
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/feed">
            <Button className="w-full">Go to Feed</Button>
          </Link>
          <Link href="/top10">
            <Button variant="secondary" className="w-full">Review Top 10 candidates</Button>
          </Link>
          <Link href="/reflections">
            <Button variant="ghost" className="w-full">Add a &quot;Stayed With Me&quot; note</Button>
          </Link>
        </section>

        {/* Quiet note */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-neutral-300 italic">
            Your reading history is now part of GreatReads.
          </p>
        </footer>
      </div>
    );
  }

  // Fallback
  return null;
}
