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

interface CirclePerson {
  id: string;
  displayName: string;
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
  const [circlePeople, setCirclePeople] = useState<CirclePerson[]>([]);
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
      const [topTenRes, circleRes, signalsRes] = await Promise.all([
        fetch('/api/top10'),
        fetch('/api/circle'),
        fetch('/api/rss/inbox?filter=new&limit=10'),
      ]);

      if (topTenRes.ok) {
        const data = await topTenRes.json();
        setTopTen(data);
      }

      if (circleRes.ok) {
        const data = await circleRes.json();
        // Get unique people (deduped by person ID)
        setCirclePeople(data.people || []);
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
    if (!sourceName.trim()) return;
    setAddingSource(true);
    setAddSourceError(null);

    try {
      const res = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sourceName.trim(),
          rssUrl: sourceUrl || undefined,
        }),
      });

      if (res.ok) {
        setShowAddSource(false);
        setSourceUrl('');
        setSourceName('');
        setUrlConverted(false);
        fetchData(); // Refresh to show new person
      } else {
        const data = await res.json();
        setAddSourceError(data.error || 'Failed to add person');
      }
    } catch {
      setAddSourceError('Failed to add person');
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
  const hasCircle = circlePeople.length > 0;
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
          Visual, authoritative, scannable. Links to Manage, not inline add.
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-neutral-300 uppercase tracking-widest">
            Your circle
          </h2>
          {hasCircle && (
            <Link
              href="/circle"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Manage →
            </Link>
          )}
        </div>

        {/* Person avatars - visual, scannable */}
        <div className="flex items-center gap-2 mb-4">
          {hasCircle ? (
            <>
              {circlePeople
                .filter((p) => p.status !== 'MUTED')
                .slice(0, 8)
                .map((person) => (
                  <div
                    key={person.id}
                    className="group relative"
                    title={person.displayName}
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600 border-2 border-white shadow-sm">
                      {person.displayName.charAt(0).toUpperCase()}
                    </div>
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1f1a17] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {person.displayName}
                    </div>
                  </div>
                ))}
              {circlePeople.filter((p) => p.status !== 'MUTED').length > 8 && (
                <span className="text-xs text-neutral-400">
                  +{circlePeople.filter((p) => p.status !== 'MUTED').length - 8}
                </span>
              )}
            </>
          ) : (
            <Link
              href="/circle"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-50 rounded-full text-sm text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-400">+</span>
              <span>Add someone you trust</span>
            </Link>
          )}
        </div>

        {/* Single explanatory sentence */}
        <p className="text-sm text-neutral-400 leading-relaxed">
          Books appear here only when someone in your circle gives five stars.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Canon (baseline worldview)
          Functional clarity: explain what canon does, not just what it is.
      ═══════════════════════════════════════════════════════════════════ */}
      {hasCanon && (
        <section className="mb-16">
          <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] rounded-2xl p-8 border border-[#f0ebe3]">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1f1a17] mb-1">
                Your canon
              </h2>
              <p className="text-sm text-neutral-500 mb-1">
                These books shaped how you think.
              </p>
              <p className="text-xs text-neutral-400">
                They influence how recommendations are weighted and interpreted.
              </p>
            </div>

            {/* Canon shelf - clean, no repeated labels */}
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
                    <p className="text-[10px] text-neutral-400 truncate">
                      {item.book.author}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Source + link - shown once, not per book */}
            <div className="mt-6 pt-6 border-t border-[#f0ebe3] flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Sourced from your Top 10
              </span>
              <Link
                href="/top10"
                className="text-xs text-neutral-500 hover:text-[#1f1a17] transition-colors"
              >
                {topTen.items.length > 5 ? `See all ${topTen.items.length} →` : 'Edit canon →'}
              </Link>
            </div>
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
          <div className="space-y-4">
            {signals.map((signal) => (
              <article
                key={signal.actionId}
                className="group bg-white rounded-2xl border border-black/5 p-5 shadow-sm hover:shadow-md transition-shadow"
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
                    {/* Book info */}
                    <h3 className="font-semibold text-[#1f1a17] mb-0.5">
                      {signal.title || 'Untitled'}
                    </h3>
                    {signal.author && (
                      <p className="text-sm text-neutral-500 mb-3">
                        {signal.author}
                      </p>
                    )}

                    {/* Attribution - clean format */}
                    <p className="text-sm mb-2">
                      <span className="text-amber-500">★★★★★</span>
                      <span className="font-medium text-[#1f1a17] ml-1">
                        {signal.source.title || 'Someone'}
                      </span>
                    </p>

                    {/* Optional quote - compact */}
                    {signal.cleanText && (
                      <p className="text-sm text-neutral-500 italic leading-relaxed line-clamp-2">
                        &ldquo;{signal.cleanText}&rdquo;
                      </p>
                    )}

                    {/* Actions - quiet by default, prominent on hover */}
                    <div className="flex gap-3 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSaveSignal(signal.itemId, signal.source.title)}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleIgnoreSignal(signal.itemId)}
                        className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Pass
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
