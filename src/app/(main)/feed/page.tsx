'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
import { Button } from '@/components/ui/button';
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
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-M.jpg',
  },
  {
    title: 'The Art of Happiness',
    author: 'Dalai Lama',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781573221115-M.jpg',
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
      {/* ═══════════════════════════════════════════════════════════════════
          ACT 1: EMOTIONAL ANCHOR (HERO)
          This should dominate — personal, intentional, calm
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoSources && (
        <section className="mb-16">
          {/* Hero card - generous breathing room */}
          <div className="bg-[#faf8f5] rounded-3xl px-10 py-12 mb-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎁</span>
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  A gift for you
                </span>
              </div>

              <h1 className="text-3xl font-semibold text-[#1f1a17] mb-4 leading-snug">
                Made for Mark
              </h1>

              <p className="text-[17px] leading-8 text-neutral-600 mb-6">
                A quiet place to discover books through people you trust.
              </p>

              <p className="text-sm text-neutral-400 italic">
                — Laura, December 2025
              </p>
            </div>
          </div>

          {/* Mark's Favorites - its own special card */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-8">
              Books that shaped how Mark thinks
            </p>

            <div className="flex gap-6">
              {marksFavorites.map((book) => (
                <div
                  key={book.title}
                  className="group flex-shrink-0 transition-transform hover:-translate-y-1"
                >
                  {/* Real book cover */}
                  <div className="relative">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-20 h-[120px] object-cover rounded-md shadow-md transition-shadow hover:shadow-lg"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback placeholder (hidden by default) */}
                    <div className="hidden w-20 h-[120px] bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-md shadow-md flex items-center justify-center">
                      <span className="text-2xl">📕</span>
                    </div>
                  </div>
                  {/* Title and author below */}
                  <div className="mt-3 max-w-[80px]">
                    <p className="text-xs font-medium text-[#1f1a17] leading-tight line-clamp-2">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1 truncate">
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
          ACT 2: WHAT SHOWS UP HERE
          Clear, inevitable, not instructional
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        {/* Section header */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-[#1f1a17] mb-3">
            {hasNoSources ? 'What shows up here' : 'Books your friends loved'}
          </h2>
          <p className="text-[15px] text-neutral-500 leading-relaxed max-w-lg">
            {hasNoSources
              ? 'Only books someone you trust loved.'
              : 'Books someone you trust loved.'}
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
            /* Empty state with CTA */
            <div className="space-y-12">
              {!showAddFriend && (
                <div className="text-center py-6">
                  <Button onClick={() => setShowAddFriend(true)} size="lg">
                    Add someone you trust
                  </Button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  ACT 3: THE PROMISE (PREVIEW)
                  What this will feel like — elevated, not placeholder-ish
              ═══════════════════════════════════════════════════════════ */}
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-8">
                  What this will feel like
                </p>
                <div className="space-y-6">
                  {previewBooks.map((book) => (
                    <div
                      key={book.title}
                      className="flex gap-6 p-6 bg-white rounded-2xl border border-black/5 shadow-sm"
                    >
                      {/* Real book cover */}
                      <div className="flex-shrink-0">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-md shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-16 h-24 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-md flex items-center justify-center">
                          <span className="text-2xl">📕</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1f1a17] mb-1">{book.title}</h3>
                        <p className="text-sm text-neutral-500 mb-4">{book.author}</p>
                        <p className="text-[15px] text-neutral-600 italic leading-relaxed bg-neutral-50 rounded-xl px-4 py-3 mb-4">
                          &ldquo;{book.quote}&rdquo;
                        </p>
                        <p className="text-sm text-neutral-400">
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
          QUIET SIDEBAR CONTENT (inline for mobile, could be sidebar on lg)
      ═══════════════════════════════════════════════════════════════════ */}
      {hasNoSources && (
        <aside className="max-w-md mx-auto">
          {/* Top 10 teaser - quiet margin note */}
          <div className="text-center py-8 border-t border-black/5">
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              What are the 10 best books you&apos;ve ever read?
            </p>
            <Link
              href="/top10"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1a17] hover:underline"
            >
              Start your Top 10 →
            </Link>
          </div>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          QUIET FOOTER - a small delight
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="mt-20 pt-8 border-t border-black/5 text-center">
        <p className="text-xs text-neutral-300">
          Made with care. December 2025.
        </p>
      </footer>
    </div>
  );
}
