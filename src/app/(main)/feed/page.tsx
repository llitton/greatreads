'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
import { Button } from '@/components/ui/button';
import { WelcomeMessage } from '@/components/welcome-message';
import Link from 'next/link';

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
  rssUrl: string;
  active: boolean;
  lastFetchedAt: string | null;
}

// Mark's favorite books with Open Library covers
const marksFavorites = [
  {
    title: 'White Fragility',
    author: 'Robin DiAngelo',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807047415-M.jpg',
    why: 'Changed how I see conversations about race.',
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg',
    why: 'Made me question every decision I make.',
  },
  {
    title: 'The Art of Happiness',
    author: 'Dalai Lama',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781573221115-M.jpg',
    why: 'Simple wisdom that actually stuck.',
  },
];

// Preview books for empty state
const previewBooks = [
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author: 'Gabrielle Zevin',
    friend: 'Sarah',
    quote: 'This one stayed with me for weeks.',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    friend: 'Mike',
    quote: "Couldn't put it down. Finished in two days.",
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg',
  },
];

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [sources, setSources] = useState<FriendSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showAddFriend, setShowAddFriend] = useState(false);

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

  const handleAddFriend = async (label: string, rssUrl: string) => {
    const res = await fetch('/api/rss/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, rssUrl }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add friend');
    }

    await fetchSources();
    setShowAddFriend(false);
  };

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
          <p className="text-neutral-500">Loading your feed...</p>
        </div>
      </div>
    );
  }

  const hasNoSources = sources.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* One-time welcome message for first visit */}
      <WelcomeMessage />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO: Single clear moment with gravity
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoSources && (
        <section className="mb-24">
          {/* Hero - artifact, not landing page */}
          <header className="text-center mb-20">
            <h1 className="text-4xl font-semibold text-[#1f1a17] mb-4 font-serif">
              Made for Mark
            </h1>
            <p className="text-lg text-neutral-500 mb-4">
              A quiet place to discover books through people you trust.
            </p>
            <p className="text-xs text-neutral-300">
              Created December 2025
            </p>
          </header>

          {/* Personal shelf - declarative, not browsable */}
          <div className="bg-gradient-to-b from-[#faf8f5] to-[#f5f0e8] rounded-3xl p-10 shadow-sm">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2 text-center">
              Books that shaped how Mark thinks
            </p>
            <p className="text-xs text-neutral-400 text-center mb-8">
              A short list, not a feed
            </p>

            {/* Shelf with covers */}
            <div className="flex justify-center gap-8">
              {marksFavorites.map((book) => (
                <div
                  key={book.title}
                  className="group flex-shrink-0 text-center"
                >
                  {/* Cover with hover reflection */}
                  <div className="relative mb-4">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-24 h-36 object-cover rounded-lg shadow-lg transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-24 h-36 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg shadow-lg flex items-center justify-center">
                      <span className="text-3xl">📕</span>
                    </div>

                    {/* Hover tooltip - why it mattered */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-[#1f1a17] text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[160px] text-center">
                        {book.why}
                      </div>
                    </div>
                  </div>

                  {/* Title and author */}
                  <div className="max-w-[100px] mx-auto">
                    <p className="text-sm font-medium text-[#1f1a17] leading-tight line-clamp-2">
                      {book.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 truncate">
                      {book.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HOW THE FEED WORKS - with visual break
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-20">
        {/* Visual break / divider */}
        {hasNoSources && (
          <div className="border-t border-black/5 mb-12" />
        )}

        {/* Section header - smaller, why-focused */}
        <div className="mb-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            {hasNoSources ? 'Why books appear here' : 'Your feed'}
          </p>
          <p className="text-[17px] text-neutral-600 leading-relaxed max-w-md">
            {hasNoSources
              ? 'Only books someone you trust loved enough to rate five stars.'
              : 'Books your friends loved enough to rate five stars.'}
          </p>
        </div>

        {/* Add friend form */}
        {showAddFriend && (
          <div className="mb-10 max-w-lg">
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[#1f1a17]">Add a friend</h3>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <AddFriendForm onAdd={handleAddFriend} />
            </div>
          </div>
        )}

        {/* Friend sources - quiet pills */}
        {sources.length > 0 && !showAddFriend && (
          <div className="mb-10">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-neutral-400">Following:</span>
              {sources.map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full text-sm"
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
              <button
                onClick={() => setShowAddFriend(true)}
                className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
              >
                + Add more
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {events.length > 0 && (
          <div className="flex gap-2 mb-10">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-[#1f1a17] text-white'
                    : 'text-neutral-400 hover:text-[#1f1a17]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Already Read'}
              </button>
            ))}
          </div>
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
            /* Empty state - focused CTA */
            <div className="space-y-16">
              {/* Primary CTA */}
              {!showAddFriend && (
                <div className="py-4">
                  <Button onClick={() => setShowAddFriend(true)} size="lg">
                    Add someone you trust
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  PREVIEW: When this starts working
                  Visually distinct from real content
              ═══════════════════════════════════════════════════════════ */}
              <div className="bg-neutral-50/50 rounded-2xl p-8 border border-neutral-100">
                <div className="mb-6">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Example
                  </p>
                  <p className="text-sm text-neutral-500">
                    This is what it looks like when someone you trust loves a book.
                  </p>
                </div>
                <div className="space-y-6 opacity-80">
                  {previewBooks.map((book) => (
                    <div
                      key={book.title}
                      className="flex gap-5 p-5 bg-white rounded-xl border border-black/5"
                    >
                      {/* Book cover */}
                      <div className="flex-shrink-0">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-14 h-20 object-cover rounded-md shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-14 h-20 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-md flex items-center justify-center">
                          <span className="text-xl">📕</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#1f1a17] mb-0.5">{book.title}</h3>
                        <p className="text-sm text-neutral-400 mb-3">{book.author}</p>
                        <p className="text-sm text-neutral-500 italic leading-relaxed mb-3">
                          &ldquo;{book.quote}&rdquo;
                        </p>
                        <p className="text-xs text-neutral-400">
                          <span className="text-amber-500">★</span> {book.friend} loved this
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Has sources but no recent events detected */
            <div className="text-center py-16">
              <div className="text-5xl mb-6">📚</div>
              <h3 className="text-xl font-semibold text-[#1f1a17] mb-3">
                Still looking
              </h3>
              <p className="text-[15px] text-neutral-500 mb-4 max-w-md mx-auto leading-relaxed">
                We haven&apos;t detected any recent 5-star ratings yet. Some readers&apos; favorites go back years.
              </p>
              <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed italic">
                The best books don&apos;t always announce themselves loudly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setShowAddFriend(true)} variant="secondary">
                  Add another friend
                </Button>
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
        <aside className="max-w-md mx-auto text-center">
          <Link
            href="/top10"
            className="text-sm text-neutral-400 hover:text-[#1f1a17] transition-colors"
          >
            Or start your Top 10 →
          </Link>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - emotional close
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="mt-24 pt-8 border-t border-black/5 text-center space-y-2">
        <p className="text-sm text-neutral-400">
          Made with care.
        </p>
        <p className="text-xs text-neutral-300 italic">
          — Laura, December 2025
        </p>
      </footer>
    </div>
  );
}
