'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { Button } from '@/components/ui/button';
import { FilterPillGroup } from '@/components/ui/status-pill';
import { SignalAttribution, createSignal } from '@/components/ui/signal-attribution';
import Link from 'next/link';
import type { SignalType } from '@/lib/signals/types';

interface FeedEvent {
  id: string;
  friendName: string;
  eventDate: string | null;
  reviewText: string | null;
  eventUrl: string | null;
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    goodreadsBookUrl: string | null;
  };
  userStatus: 'WANT_TO_READ' | 'READING' | 'READ' | null;
}

interface FriendSource {
  id: string;
  label: string;
  sourceType: 'rss' | 'import';
  active: boolean;
}

// Mark's Top 10 books - these are HIS favorites, not signals from others
// Signal type: 'top_10' | 'reflection' | 'favorite' | 'five_star'
const marksFavorites: Array<{
  title: string;
  author: string;
  coverUrl: string;
  signalType: SignalType;
  note: string;
}> = [
  {
    title: 'White Fragility',
    author: 'Robin DiAngelo',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807047415-M.jpg',
    signalType: 'top_10',
    note: 'Changed how I see conversations about race.',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg',
    signalType: 'top_10',
    note: 'Made me question every decision I make.',
  },
  {
    title: 'The Art of Happiness',
    author: 'Dalai Lama',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781573221115-M.jpg',
    signalType: 'top_10',
    note: 'Simple wisdom that actually stuck.',
  },
];

// Preview book for empty state (just one, cleaner)
const previewBook = {
  title: 'Tomorrow, and Tomorrow, and Tomorrow',
  author: 'Gabrielle Zevin',
  friend: 'Sarah',
  quote: 'This one stayed with me for weeks.',
  coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg',
};

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [sources, setSources] = useState<FriendSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed?filter=${filter}`);
      const data = await res.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    }
  }, [filter]);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/rss/sources');
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFeed(), fetchSources()]);
      setLoading(false);
    };
    loadData();
  }, [fetchFeed]);

  const handleUpdateStatus = async (bookId: string, status: 'WANT_TO_READ' | 'READ') => {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status }),
    });

    setEvents((prev) =>
      prev.map((event) =>
        event.book.id === bookId ? { ...event, userStatus: status } : event
      )
    );
  };

  const handleDeleteSource = async (id: string) => {
    await fetch(`/api/rss/sources/${id}`, { method: 'DELETE' });
    await fetchSources();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="text-neutral-500">Loading signals...</p>
        </div>
      </div>
    );
  }

  const hasNoSources = sources.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO: Single clear moment with gravity
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoSources && (
        <section className="mb-32">
          {/* Hero - confident, not explanatory */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-semibold text-[#1f1a17] mb-3 font-serif">
              Made for Mark
            </h1>
            <p className="text-lg text-neutral-400">
              Only five-star books from people you trust.
            </p>
          </header>

          {/* Personal canon - the emotional anchor */}
          <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] rounded-3xl px-8 pt-8 pb-8 shadow-sm border border-[#f0ebe3]">
            {/* Label */}
            <div className="text-center mb-8">
              <p className="text-base font-semibold text-[#1f1a17] tracking-wide mb-2">
                Personal canon
              </p>
              <p className="text-sm text-neutral-400">
                Books that stayed
              </p>
            </div>

            {/* Shelf with covers - larger, more presence */}
            <div className="flex justify-center gap-8">
              {marksFavorites.map((book) => (
                <div
                  key={book.title}
                  className="group relative flex-shrink-0 text-center"
                >
                  {/* Cover with depth and hover delight */}
                  <div className="relative mb-3">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-28 h-[168px] object-cover rounded-lg shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-28 h-[168px] bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg shadow-xl flex items-center justify-center">
                      <span className="text-3xl">📕</span>
                    </div>

                    {/* Hover overlay with note */}
                    <div className="pointer-events-none absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-b-lg p-3 pt-8">
                        <p className="text-xs text-white/90 italic leading-relaxed line-clamp-3">
                          &ldquo;{book.note}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Title, author, and signal badge - always visible */}
                  <div className="max-w-[112px] mx-auto">
                    <p className="text-sm font-medium text-[#1f1a17] leading-tight line-clamp-2">
                      {book.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 truncate">
                      {book.author}
                    </p>
                    {/* Signal type badge - shows provenance, not viewer */}
                    <SignalAttribution
                      signal={createSignal({
                        type: book.signalType,
                        sourcePersonId: 'mark', // Mark is the owner
                        sourcePersonName: 'Mark',
                        sourceKind: 'person',
                      })}
                      viewerId="mark" // Viewer is also Mark, so shows "Your Top 10"
                      variant="muted"
                      showBadge={true}
                      className="mt-1.5 justify-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FEED SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        {/* Section header - only show for non-empty states */}
        {!hasNoSources && (
          <div className="mb-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
              Signals
            </p>
            <p className="text-[17px] text-neutral-600 leading-relaxed max-w-md">
              Books your friends loved enough to rate five stars.
            </p>
          </div>
        )}

        {/* Friend sources - quiet pills */}
        {sources.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-neutral-400">Following:</span>
              {sources.map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-full text-sm"
                >
                  <span className="font-medium text-[#1f1a17]">{source.label}</span>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-neutral-300 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {events.length > 0 && (
          <FilterPillGroup
            filters={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Already Read' },
            ]}
            activeFilter={filter}
            onFilterChange={(v) => setFilter(v as 'all' | 'unread' | 'read')}
            className="mb-8"
          />
        )}

        {/* Feed content */}
        <div className="max-w-2xl">
          {events.length > 0 ? (
            <div className="space-y-8">
              {events.map((event) => (
                <FeedCard key={event.id} event={event} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          ) : hasNoSources ? (
            /* Empty state - example first, then import */
            <div className="space-y-16">
              {/* ═══════════════════════════════════════════════════════════
                  EXAMPLE: Shows what value looks like before asking for action
              ═══════════════════════════════════════════════════════════ */}
              <div className="pt-5">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-5">
                  Example from someone you trust
                </p>
                <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                  <div className="flex gap-5">
                    {/* Book cover */}
                    <div className="flex-shrink-0">
                      <img
                        src={previewBook.coverUrl}
                        alt={previewBook.title}
                        className="w-16 h-24 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-16 h-24 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📕</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1f1a17] text-lg mb-0.5">{previewBook.title}</h3>
                      <p className="text-sm text-neutral-400 mb-3">{previewBook.author}</p>
                      <p className="text-[15px] text-neutral-500 italic leading-relaxed mb-3">
                        &ldquo;{previewBook.quote}&rdquo;
                      </p>
                      {/* Signal attribution - source person, not viewer */}
                      <SignalAttribution
                        signal={createSignal({
                          type: 'five_star',
                          sourcePersonId: 'sarah',
                          sourcePersonName: previewBook.friend,
                          sourceKind: 'person',
                        })}
                        variant="inline"
                        showStars={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Import invitation - after demonstrating value */}
              <div className="bg-[#fdfcfa] rounded-3xl border border-[#f0ebe3] p-8">
                <h3 className="text-xl font-semibold text-[#1f1a17] mb-3">
                  Import books that mattered to you
                </h3>
                <p className="text-[15px] text-neutral-500 leading-relaxed mb-5 max-w-md">
                  GreatReads doesn&apos;t guess what mattered. If you&apos;ve already taken the time to rate books elsewhere, you can bring that history with you — on your terms.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <Link href="/import">
                    <Button size="lg">Bring your reading history</Button>
                  </Link>
                  <Link
                    href="/import"
                    className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors py-2"
                  >
                    How to export from Goodreads →
                  </Link>
                </div>
                {/* Clarify who this is for */}
                <p className="text-xs text-neutral-300 mt-5 italic">
                  Usually done by the person sharing their recommendations.
                </p>
              </div>
            </div>
          ) : (
            /* Has sources but no events yet */
            <div className="text-center py-8">
              <div className="text-5xl mb-5">📚</div>
              <h3 className="text-xl font-semibold text-[#1f1a17] mb-3">
                No signal yet
              </h3>
              <p className="text-[15px] text-neutral-500 mb-3 max-w-md mx-auto leading-relaxed">
                GreatReads only shows 5-stars (or favorites, if they choose). Ask your friends to import their Goodreads history.
              </p>
              <p className="text-sm text-neutral-400 mb-5 max-w-sm mx-auto leading-relaxed italic">
                The best books don&apos;t always announce themselves loudly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/import">
                  <Button>Import your own library</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Feed footer - philosophy line */}
        {events.length > 0 && (
          <p className="text-center text-sm text-neutral-300 italic mt-16">
            That&apos;s it — only the best rise to the top.
          </p>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECONDARY PATH - quiet, optional
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoSources && (
        <aside className="max-w-md mx-auto text-center mb-16">
          <Link
            href="/top10"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
          >
            Or start your Top 10 →
          </Link>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - dedication with timestamp
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="pt-8 border-t border-black/5 text-center">
        <p className="text-xs text-neutral-300 italic">
          — Laura, December 2025
        </p>
      </footer>
    </div>
  );
}
