'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
import { WelcomeModule } from '@/components/feed/welcome-module';
import { SetupCard } from '@/components/feed/setup-card';
import { DemoFeed } from '@/components/feed/demo-feed-card';
import { MarksShelf } from '@/components/feed/marks-shelf';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main content column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Welcome module - shows when no sources */}
        {hasNoSources && (
          <WelcomeModule onSetupClick={() => setShowAddFriend(true)} />
        )}

        {/* Mark's Shelf */}
        <MarksShelf />

        {/* Feed section */}
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#1f1a17] mb-1">
              {hasNoSources ? 'Your next great read' : 'Books your friends loved'}
            </h1>
            <p className="text-[15px] text-neutral-500">
              {hasNoSources
                ? 'Add a friend to see their 5-star picks'
                : '5-star picks from people you trust'}
            </p>
          </div>

          {/* Add friend form */}
          {showAddFriend && (
            <div className="mb-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#1f1a17]">Add a friend</h2>
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

          {/* Friend sources - compact pills */}
          {sources.length > 0 && !showAddFriend && (
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-neutral-400">Following:</span>
                {sources.map((source) => (
                  <span
                    key={source.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm border border-black/5 shadow-sm"
                  >
                    <span className="font-medium text-[#1f1a17]">{source.label}</span>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                      title="Remove"
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
            <div className="flex gap-2 mb-6">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-[#1f1a17] text-white'
                      : 'bg-white text-neutral-600 border border-black/5 hover:border-neutral-300'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Already Read'}
                </button>
              ))}
            </div>
          )}

          {/* Feed content */}
          <div className="max-w-3xl">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <FeedCard key={event.id} event={event} onUpdateStatus={handleUpdateStatus} />
                ))}
              </div>
            ) : hasNoSources ? (
              /* Empty state with demo feed */
              <div>
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 mb-6 text-center">
                  <h3 className="font-semibold text-[#1f1a17] mb-2">
                    Start with your favorites
                  </h3>
                  <p className="text-[15px] leading-6 text-neutral-600 mb-6 max-w-sm mx-auto">
                    Add Mark&apos;s favorite books to your list, or connect a friend to see their picks.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="secondary">Add these to My Books</Button>
                    <Button onClick={() => setShowAddFriend(true)}>Add a friend</Button>
                  </div>
                </div>
                <DemoFeed />
              </div>
            ) : (
              /* Has sources but no events yet */
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="font-semibold text-[#1f1a17] mb-2">
                  No 5-star books yet
                </h3>
                <p className="text-[15px] leading-6 text-neutral-600 mb-6">
                  We&apos;re watching your friends&apos; feeds. When they rate something 5 stars, it&apos;ll show up here.
                </p>
                <Button onClick={() => setShowAddFriend(true)} variant="secondary">
                  Add another friend
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-6 lg:self-start space-y-4">
        {/* Setup card */}
        <SetupCard
          friendsCount={sources.length}
          onAddFriend={() => setShowAddFriend(true)}
        />

        {/* Top 10 teaser */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">🏆</span>
            <h3 className="font-semibold text-[#1f1a17]">Mark&apos;s Top 10</h3>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            What are the 10 best books you&apos;ve ever read? Share your list with friends.
          </p>
          <a
            href="/top10"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1a17] hover:underline"
          >
            Start your list
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6h8M6 2l4 4-4 4" />
            </svg>
          </a>
        </div>

        {/* Laura's Note - the gift message */}
        <div className="bg-[#faf8f5] rounded-2xl border border-black/5 p-5">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Why this exists
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            I made this because I love how much you love books, and I wanted a place
            where only the best recommendations rise to the top.
          </p>
          <p className="text-sm text-neutral-500 italic">
            — Laura
          </p>
          <p className="text-xs text-neutral-300 mt-3">
            December 2025
          </p>
        </div>
      </div>
    </div>
  );
}
