'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { AddFriendForm } from '@/components/feed/add-friend-form';
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

    // Update local state
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">📚</div>
          <p className="text-[var(--color-brown)]">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)]">
          5-Star Books from Friends
        </h1>
        <Button onClick={() => setShowAddFriend(!showAddFriend)} variant="secondary">
          {showAddFriend ? 'Cancel' : '+ Add Friend'}
        </Button>
      </div>

      {/* Add friend form */}
      {showAddFriend && (
        <div className="mb-6">
          <AddFriendForm onAdd={handleAddFriend} />
        </div>
      )}

      {/* No sources message */}
      {sources.length === 0 && !showAddFriend && (
        <div className="card p-8 text-center mb-6">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-brown-dark)] mb-2">
            Welcome to GreatReads!
          </h2>
          <p className="text-[var(--color-brown)] mb-4">
            Start by adding a friend&apos;s Goodreads RSS feed to see their 5-star books.
          </p>
          <Button onClick={() => setShowAddFriend(true)}>Add Your First Friend</Button>
        </div>
      )}

      {/* Friend sources list */}
      {sources.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-medium text-[var(--color-brown)]">Following:</h2>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-parchment)] rounded-full text-sm"
                >
                  {source.label}
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="ml-1 text-[var(--color-brown-light)] hover:text-[var(--color-red)]"
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {events.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[var(--color-brown-dark)] text-white'
                  : 'bg-[var(--color-parchment)] text-[var(--color-brown)] hover:bg-[var(--color-tan)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Already Read'}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <FeedCard key={event.id} event={event} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      ) : sources.length > 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-[var(--color-brown)]">
            No 5-star books found yet. Check back after the next poll runs, or add more friends!
          </p>
        </div>
      ) : null}
    </div>
  );
}
