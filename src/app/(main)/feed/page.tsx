'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
import { SetupCard } from '@/components/feed/setup-card';
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

// Mark's favorite books for the shelf
const marksFavorites = [
  { title: 'White Fragility', author: 'Robin DiAngelo', color: '#f5f5f5', textColor: '#1f1a17' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', color: '#1f1a17', textColor: '#ffffff' },
  { title: 'The Art of Happiness', author: 'Dalai Lama', color: '#d4a855', textColor: '#1f1a17' },
];

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [sources, setSources] = useState<FriendSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);

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
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Main content column */}
      <div className="flex-1 min-w-0 space-y-12">

        {/* Hero section - Made for Mark + Shelf integrated */}
        {hasNoSources && (
          <section className="bg-[#faf8f5] rounded-3xl py-10 px-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#1f1a17] text-white text-xl flex items-center justify-center">
                🎁
              </div>
              <div className="max-w-lg">
                <h1 className="text-2xl font-semibold text-[#1f1a17] mb-2">
                  Made for Mark
                </h1>
                <p className="text-[15px] leading-7 text-neutral-600">
                  A place where only the best recommendations rise to the top.
                  When someone you trust loves a book, you&apos;ll see it here.
                </p>
                <p className="mt-4 text-sm text-neutral-400 italic">
                  — Laura, December 2025
                </p>
              </div>
            </div>

            {/* Mark's Favorites - integrated into hero */}
            <div className="pt-6 border-t border-black/5">
              <p className="text-sm text-neutral-500 mb-4">Books that shaped how Mark thinks</p>
              <div className="flex gap-3">
                {marksFavorites.map((book) => (
                  <button
                    key={book.title}
                    onMouseEnter={() => setHoveredBook(book.title)}
                    onMouseLeave={() => setHoveredBook(null)}
                    className="group relative flex-shrink-0 transition-transform hover:-translate-y-1"
                  >
                    <div
                      className="w-12 h-40 rounded-sm shadow-md flex flex-col justify-between py-3 px-1.5 border-l-[3px] transition-shadow hover:shadow-lg"
                      style={{
                        backgroundColor: book.color,
                        borderLeftColor: book.color === '#f5f5f5' ? '#e0e0e0' : 'rgba(0,0,0,0.15)',
                      }}
                    >
                      <div
                        className="text-[9px] font-medium leading-tight overflow-hidden"
                        style={{
                          color: book.textColor,
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        {book.title}
                      </div>
                      <div
                        className="text-[8px] font-medium opacity-60 text-center"
                        style={{ color: book.textColor }}
                      >
                        {book.author.split(' ').pop()?.[0]}
                      </div>
                    </div>
                    {hoveredBook === book.title && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1f1a17] text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
                        <p className="font-medium">{book.title}</p>
                        <p className="text-white/60 text-[10px]">{book.author}</p>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#1f1a17] rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Shelf surface */}
              <div className="w-40 h-2 mt-1 bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8] rounded-b-sm" />
            </div>
          </section>
        )}

        {/* Feed section */}
        <section>
          {/* Section header - no box, just typography */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#1f1a17] mb-2">
              {hasNoSources ? 'Worth your time' : 'Books your friends loved'}
            </h2>
            <p className="text-[15px] text-neutral-500 max-w-md leading-relaxed">
              {hasNoSources
                ? 'Add a friend to see their 5-star picks, or explore the preview below.'
                : '5-star picks from people you trust.'}
            </p>
          </div>

          {/* Add friend form */}
          {showAddFriend && (
            <div className="mb-8 max-w-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1f1a17]">Add a friend</h3>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <AddFriendForm onAdd={handleAddFriend} />
            </div>
          )}

          {/* Friend sources - minimal pills */}
          {sources.length > 0 && !showAddFriend && (
            <div className="mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-400">Following:</span>
                {sources.map((source) => (
                  <span
                    key={source.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm border border-black/5"
                  >
                    <span className="font-medium text-[#1f1a17]">{source.label}</span>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="text-sm text-neutral-500 hover:text-[#1f1a17] transition-colors"
                >
                  + Add more
                </button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {events.length > 0 && (
            <div className="flex gap-2 mb-8">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-[#1f1a17] text-white'
                      : 'text-neutral-500 hover:text-[#1f1a17]'
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
              <div className="space-y-6">
                {events.map((event) => (
                  <FeedCard key={event.id} event={event} onUpdateStatus={handleUpdateStatus} />
                ))}
              </div>
            ) : hasNoSources ? (
              /* Empty state - minimal, not boxed */
              <div className="space-y-8">
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-6">
                    Add a friend to start seeing their 5-star picks.
                  </p>
                  <Button onClick={() => setShowAddFriend(true)}>
                    Add your first friend
                  </Button>
                </div>

                {/* Preview feed - no "Example" labels */}
                <div className="opacity-50 space-y-4">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Preview</p>
                  {[
                    { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', friend: 'Sarah' },
                    { title: 'Project Hail Mary', author: 'Andy Weir', friend: 'Mike' },
                  ].map((book) => (
                    <div key={book.title} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/5">
                      <div className="w-10 h-14 bg-neutral-100 rounded flex items-center justify-center text-lg">📕</div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1f1a17]">{book.title}</p>
                        <p className="text-sm text-neutral-500">{book.author}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          <span className="text-amber-500">★</span> {book.friend} loved this
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="font-semibold text-[#1f1a17] mb-2">
                  No 5-star books yet
                </h3>
                <p className="text-[15px] text-neutral-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  We&apos;re watching your friends&apos; feeds. When they rate something 5 stars, it&apos;ll show up here.
                </p>
                <Button onClick={() => setShowAddFriend(true)} variant="secondary">
                  Add another friend
                </Button>
              </div>
            )}
          </div>

          {/* Feed footer - philosophy line */}
          {events.length > 0 && (
            <p className="text-center text-sm text-neutral-300 italic mt-12">
              That&apos;s it — only the best rise to the top.
            </p>
          )}
        </section>
      </div>

      {/* Right sidebar - simplified */}
      <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-8 lg:self-start space-y-6">
        {/* Setup card */}
        <SetupCard
          friendsCount={sources.length}
          onAddFriend={() => setShowAddFriend(true)}
        />

        {/* Top 10 teaser */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">🏆</span>
            <h3 className="font-semibold text-[#1f1a17]">Mark&apos;s Top 10</h3>
          </div>
          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
            What are the 10 best books you&apos;ve ever read?
          </p>
          <Link
            href="/top10"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1a17] hover:underline"
          >
            Start your list →
          </Link>
        </div>
      </div>
    </div>
  );
}
