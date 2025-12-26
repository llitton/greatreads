'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
import { WelcomeModule } from '@/components/feed/welcome-module';
import { SetupCard } from '@/components/feed/setup-card';
import { DemoFeed } from '@/components/feed/demo-feed-card';
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
  const { data: session } = useSession();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [sources, setSources] = useState<FriendSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showAddFriend, setShowAddFriend] = useState(false);

  // Get user's first name for personalization
  const userName = session?.user?.name?.split(' ')[0] || undefined;

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
          <div className="animate-spin text-4xl mb-3">📚</div>
          <p className="text-[var(--color-brown)]">Loading your feed...</p>
        </div>
      </div>
    );
  }

  const hasNoSources = sources.length === 0;
  const hasNoEvents = events.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content column */}
        <div className="flex-1 min-w-0">
          {/* Welcome module - shows when no sources */}
          {hasNoSources && (
            <WelcomeModule
              userName={userName}
              onSetupClick={() => setShowAddFriend(true)}
            />
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[var(--color-brown-dark)] mb-2">
              {hasNoSources ? 'Your next great read' : 'Books your friends loved'}
            </h1>
            {!hasNoSources && (
              <p className="text-[var(--color-brown)]">
                5-star picks from people you trust
              </p>
            )}
          </div>

          {/* Add friend form (modal-style) */}
          {showAddFriend && (
            <div className="mb-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-bold text-[var(--color-brown-dark)]">
                  Add a friend
                </h2>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="text-[var(--color-brown-light)] hover:text-[var(--color-brown-dark)]"
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
                <span className="text-sm text-[var(--color-brown-light)]">Following:</span>
                {sources.map((source) => (
                  <span
                    key={source.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-sm border border-[var(--color-tan)] shadow-sm"
                  >
                    <span className="font-medium text-[var(--color-brown-dark)]">{source.label}</span>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="text-[var(--color-brown-light)] hover:text-[var(--color-red)] transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="text-sm text-[var(--color-brown)] hover:text-[var(--color-brown-dark)] underline underline-offset-2"
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
                      ? 'bg-[var(--color-brown-dark)] text-white shadow-sm'
                      : 'bg-white text-[var(--color-brown)] border border-[var(--color-tan)] hover:border-[var(--color-brown-light)]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Already Read'}
                </button>
              ))}
            </div>
          )}

          {/* Feed content */}
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <FeedCard key={event.id} event={event} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          ) : hasNoSources ? (
            /* Empty state with demo feed */
            <div className="mt-4">
              <DemoFeed />
            </div>
          ) : (
            /* Has sources but no events yet */
            <div className="bg-white rounded-xl border border-[var(--color-tan)] p-8 text-center shadow-sm">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="font-serif font-bold text-[var(--color-brown-dark)] mb-2">
                No 5-star books yet
              </h3>
              <p className="text-[var(--color-brown)] mb-4">
                We&apos;re watching your friends&apos; feeds. When they rate something 5 stars, it&apos;ll show up here.
              </p>
              <Button onClick={() => setShowAddFriend(true)} variant="secondary">
                Add another friend
              </Button>
            </div>
          )}
        </div>

        {/* Right sidebar - setup & Top 10 teaser */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
          {/* Setup card */}
          <SetupCard
            friendsCount={sources.length}
            onAddFriend={() => setShowAddFriend(true)}
          />

          {/* Top 10 teaser */}
          <div className="bg-white rounded-xl border border-[var(--color-tan)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <h3 className="font-serif font-bold text-[var(--color-brown-dark)]">
                {userName ? `${userName}'s Top 10` : 'Your Top 10'}
              </h3>
            </div>
            <p className="text-sm text-[var(--color-brown)] mb-4">
              What are the 10 best books you&apos;ve ever read? Share your list with friends.
            </p>
            <a
              href="/top10"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brown-dark)] hover:underline"
            >
              Start your list
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 7h10M8 3l4 4-4 4" />
              </svg>
            </a>
          </div>

          {/* How it works - only show when no sources */}
          {hasNoSources && (
            <div className="bg-[var(--color-parchment)] rounded-xl p-5">
              <h3 className="font-serif font-bold text-[var(--color-brown-dark)] mb-3">
                How it works
              </h3>
              <ol className="space-y-3 text-sm text-[var(--color-brown)]">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-brown-dark)] text-white text-xs flex items-center justify-center">1</span>
                  <span>Add friends from Goodreads</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-brown-dark)] text-white text-xs flex items-center justify-center">2</span>
                  <span>We watch for their 5-star ratings</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-brown-dark)] text-white text-xs flex items-center justify-center">3</span>
                  <span>Great books show up in your feed</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
