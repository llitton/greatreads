'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookCover } from '@/components/ui/book-cover';
import { Button } from '@/components/ui/button';
import { normalizeGoodreadsUrl } from '@/lib/goodreads/url';
import Link from 'next/link';

interface TopTenItem {
  id: string;
  rank: number;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
}

interface TopTen {
  id: string;
  items: TopTenItem[];
}

interface Source {
  id: string;
  title: string | null;
  status: string;
}

interface SignalItem {
  actionId: string;
  itemId: string;
  status: string;
  title: string | null;
  author: string | null;
  coverImageUrl: string | null;
  cleanText: string | null;
  publishedAt: string | null;
  source: {
    id: string;
    title: string | null;
  };
}

export default function FeedPage() {
  const [topTen, setTopTen] = useState<TopTen | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSource, setShowAddSource] = useState(false);

  // Add source form state
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [urlConverted, setUrlConverted] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [addSourceError, setAddSourceError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [topTenRes, sourcesRes, signalsRes] = await Promise.all([
        fetch('/api/top10'),
        fetch('/api/rss/inbox/sources'),
        fetch('/api/rss/inbox?filter=new&limit=10'),
      ]);

      if (topTenRes.ok) {
        const data = await topTenRes.json();
        setTopTen(data);
      }

      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSources(data.sources || []);
      }

      if (signalsRes.ok) {
        const data = await signalsRes.json();
        setSignals(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSignal = async (itemId: string, sourceName: string | null) => {
    try {
      const res = await fetch(`/api/rss/items/${itemId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePersonName: sourceName }),
      });

      if (res.ok) {
        setSignals((prev) => prev.filter((s) => s.itemId !== itemId));
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleIgnoreSignal = async (itemId: string) => {
    try {
      const res = await fetch(`/api/rss/items/${itemId}/ignore`, {
        method: 'POST',
      });

      if (res.ok) {
        setSignals((prev) => prev.filter((s) => s.itemId !== itemId));
      }
    } catch (error) {
      console.error('Failed to ignore:', error);
    }
  };

  const handleUrlChange = (inputUrl: string) => {
    setAddSourceError(null);
    const result = normalizeGoodreadsUrl(inputUrl);
    setSourceUrl(result.url);
    setUrlConverted(result.converted);
    if (result.error && inputUrl.includes('goodreads')) {
      setAddSourceError(result.error);
    }
  };

  const handleAddSource = async () => {
    if (!sourceUrl || !sourceName) return;
    setAddingSource(true);
    setAddSourceError(null);

    try {
      const res = await fetch('/api/rss/inbox/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sourceUrl,
          titleOverride: sourceName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSources((prev) => [data.source, ...prev]);
        setShowAddSource(false);
        setSourceUrl('');
        setSourceName('');
        setUrlConverted(false);
      } else {
        const data = await res.json();
        setAddSourceError(data.error || 'Failed to add source');
      }
    } catch {
      setAddSourceError('Failed to add source');
    } finally {
      setAddingSource(false);
    }
  };

  const closeAddSourceModal = () => {
    setShowAddSource(false);
    setSourceUrl('');
    setSourceName('');
    setUrlConverted(false);
    setAddSourceError(null);
  };

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

  const hasCanon = topTen && topTen.items.length > 0;
  const hasSources = sources.length > 0;
  const hasSignals = signals.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — Context (why this page exists)
          Establish rules before content. Philosophy first, evidence second.
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-16">
        <h1 className="text-3xl font-serif font-semibold text-[#1f1a17] mb-3">
          Made for Mark
        </h1>
        <p className="text-[17px] text-neutral-500 leading-relaxed">
          Books that matter, surfaced only when someone you trust truly endorses them.
        </p>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — Your circle (cause → effect)
          Anchors causality: People → signals → books
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-5">
          Your circle
        </h2>

        {/* Person pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {hasSources ? (
            <>
              {sources.map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center px-4 py-2 bg-neutral-50 rounded-full text-sm font-medium text-[#1f1a17]"
                >
                  {source.title || 'Untitled'}
                </span>
              ))}
              <button
                onClick={() => setShowAddSource(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add someone</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAddSource(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-50 rounded-full text-sm text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              <span>Add someone you trust</span>
            </button>
          )}
        </div>

        {/* Explanatory sentence */}
        <p className="text-sm text-neutral-400 leading-relaxed">
          GreatReads doesn&apos;t guess. Books appear here only when someone in your circle gives a five-star signal or adds a book to their canon.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Canon (baseline worldview)
          This is identity, not recommendation. Context, not content.
      ═══════════════════════════════════════════════════════════════════ */}
      {hasCanon && (
        <section className="mb-16">
          <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] rounded-2xl p-8 border border-[#f0ebe3]">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
                Mark&apos;s canon
              </h2>
              <p className="text-sm text-neutral-500">
                These books shaped how you think. They anchor everything else you see here.
              </p>
            </div>

            {/* Canon shelf */}
            <div className="flex flex-wrap gap-6">
              {topTen.items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex-shrink-0 w-24">
                  <BookCover
                    src={item.book.coverUrl}
                    title={item.book.title}
                    author={item.book.author}
                    size="xl"
                    className="shadow-lg mb-3"
                  />
                  <p className="text-xs font-medium text-[#1f1a17] leading-tight line-clamp-2 mb-0.5">
                    {item.book.title}
                  </p>
                  {item.book.author && (
                    <p className="text-[10px] text-neutral-400 truncate mb-1.5">
                      {item.book.author}
                    </p>
                  )}
                  <span className="inline-block text-[10px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                    From your Top 10
                  </span>
                </div>
              ))}
            </div>

            {/* Link to full Top 10 */}
            {topTen.items.length > 5 && (
              <div className="mt-6 pt-6 border-t border-[#f0ebe3]">
                <Link
                  href="/top10"
                  className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
                >
                  See all {topTen.items.length} books in your canon →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — New signals (the actual discovery moment)
          The emotional core: "Someone I trust paused and thought of me."
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-8">
          New signals from your circle
        </h2>

        {hasSignals ? (
          <div className="space-y-6">
            {signals.map((signal) => (
              <article
                key={signal.actionId}
                className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  <BookCover
                    src={signal.coverImageUrl}
                    title={signal.title || 'Untitled'}
                    author={signal.author}
                    size="lg"
                    className="shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1f1a17] mb-0.5">
                      {signal.title || 'Untitled'}
                    </h3>
                    {signal.author && (
                      <p className="text-sm text-neutral-500 mb-3">
                        {signal.author}
                      </p>
                    )}

                    {/* Attribution */}
                    <p className="text-sm text-neutral-600 mb-2">
                      <span className="text-amber-500">★★★★★</span>
                      <span className="text-neutral-400"> from </span>
                      <span className="font-medium text-[#1f1a17]">
                        {signal.source.title || 'Someone'}
                      </span>
                    </p>

                    {/* Optional quote/note */}
                    {signal.cleanText && (
                      <p className="text-sm text-neutral-500 italic leading-relaxed line-clamp-2">
                        &ldquo;{signal.cleanText}&rdquo;
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleSaveSignal(signal.itemId, signal.source.title)}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                      >
                        Save to My Books
                      </button>
                      <button
                        onClick={() => handleIgnoreSignal(signal.itemId)}
                        className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Not for me
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty state - intentional, not broken */
          <div className="py-8">
            <p className="text-[15px] text-neutral-500 leading-relaxed mb-2">
              Nothing new right now.
            </p>
            <p className="text-sm text-neutral-400">
              We&apos;ll interrupt you only when someone you trust finishes a book they truly loved.
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Next action (single, calm action)
          Discovery grows by people, not data.
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex flex-col items-start gap-3">
          <Button size="lg" onClick={() => setShowAddSource(true)}>
            Add someone you trust
          </Button>
          <Link
            href="/import"
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Bring in your past reading history
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — Footer: quiet reassurance, not features
          End the story. No buttons. No cards.
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="pt-8 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-300 italic leading-relaxed">
          No popularity. No averages. No algorithms.
          <br />
          Only trust.
        </p>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          Add Someone Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1f1a17]">
                    Add someone you trust
                  </h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    Books appear only when they give five stars.
                  </p>
                </div>
                <button
                  onClick={closeAddSourceModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1l12 12M13 1L1 13" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Their name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g., Laura, Ken, Mom"
                  className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Their Goodreads profile or RSS feed
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste any Goodreads URL"
                  className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
                {urlConverted && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ Converted to RSS format. We&apos;ll follow their reads.
                  </p>
                )}
                {!sourceUrl && !urlConverted && (
                  <p className="mt-2 text-xs text-neutral-400">
                    We&apos;ll automatically convert Goodreads URLs to RSS feeds.
                  </p>
                )}
              </div>

              {/* Error */}
              {addSourceError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-600">{addSourceError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAddSource}
                  disabled={!sourceUrl || !sourceName || addingSource}
                  className="flex-1"
                  size="lg"
                >
                  {addingSource ? 'Adding...' : `Add ${sourceName || 'person'}`}
                </Button>
              </div>

              {/* Help text */}
              <div className="pt-2">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  <strong className="text-neutral-500">How to find the URL:</strong> Go to their Goodreads profile and copy the URL from your browser, or share link.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
