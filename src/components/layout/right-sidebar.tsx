'use client';

import { useEffect, useState, useCallback } from 'react';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

type FilterType = 'new' | 'seen' | 'all';

interface InboxItem {
  actionId: string;
  itemId: string;
  status: 'UNSEEN' | 'SEEN' | 'SAVED' | 'IGNORED';
  title: string | null;
  author: string | null;
  url: string | null;
  publishedAt: string | null;
  cleanText: string | null;
  coverImageUrl: string | null;
  source: {
    id: string;
    title: string | null;
    siteUrl: string | null;
  };
}

interface InboxResponse {
  items: InboxItem[];
  unseenCount: number;
  nextCursor: string | null;
}

export function RightSidebar() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('new');
  const [showManageSources, setShowManageSources] = useState(false);

  const fetchInbox = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/rss/inbox?filter=${filter}&limit=10`);

      if (!res.ok) {
        throw new Error('Failed to load');
      }

      const data: InboxResponse = await res.json();
      setItems(data.items);
      setUnseenCount(data.unseenCount);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleSave = async (itemId: string, sourceName: string | null) => {
    try {
      const res = await fetch(`/api/rss/items/${itemId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePersonName: sourceName }),
      });

      if (res.ok) {
        // Remove from list optimistically
        setItems((prev) => prev.filter((item) => item.itemId !== itemId));
        setUnseenCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };

  const handleIgnore = async (itemId: string) => {
    try {
      const res = await fetch(`/api/rss/items/${itemId}/ignore`, {
        method: 'POST',
      });

      if (res.ok) {
        // Remove from list optimistically
        setItems((prev) => prev.filter((item) => item.itemId !== itemId));
        setUnseenCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to ignore item:', err);
    }
  };

  const handleMarkAllSeen = async () => {
    try {
      const res = await fetch('/api/rss/inbox/mark-all-seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setUnseenCount(0);
        // Update local state
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: item.status === 'UNSEEN' ? 'SEEN' : item.status,
          }))
        );
        // Refetch if on 'new' filter
        if (filter === 'new') {
          fetchInbox();
        }
      }
    } catch (err) {
      console.error('Failed to mark all seen:', err);
    }
  };

  const formatDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - sticky */}
      <div className="sticky top-0 bg-[#fdfcfa] z-10 p-5 pb-3 border-b border-black/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-medium text-[#1f1a17]">
              From people you follow
            </h2>
            {unseenCount > 0 && (
              <span className="text-xs text-neutral-400">{unseenCount} new</span>
            )}
          </div>
          <button
            onClick={() => setShowManageSources(true)}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Manage
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {(['new', 'seen', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? 'bg-[#1f1a17] text-white'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Mark all seen */}
        {unseenCount > 0 && filter === 'new' && (
          <button
            onClick={handleMarkAllSeen}
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Mark all seen
          </button>
        )}
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-5 pt-3">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-[72px] bg-neutral-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-2 bg-neutral-50 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 mb-3">{error}</p>
            <button
              onClick={fetchInbox}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-400">
              {filter === 'new' ? 'No new items' : 'No items'}
            </p>
            <p className="text-xs text-neutral-300 mt-2">
              {filter === 'new'
                ? 'New books from people you follow will appear here'
                : 'Add sources to start seeing items'}
            </p>
            <button
              onClick={() => setShowManageSources(true)}
              className="mt-4 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Add a source
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.actionId}
                className="bg-white rounded-xl border border-black/5 p-4 shadow-sm"
              >
                <div className="flex gap-3 mb-3">
                  {/* Cover */}
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt=""
                      className="w-12 h-[72px] object-cover rounded shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-[72px] bg-gradient-to-br from-stone-100 to-stone-200 rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-stone-500 text-xs font-medium">
                        {item.title?.slice(0, 2).toUpperCase() || '📕'}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1f1a17] leading-tight line-clamp-2">
                      {item.title || 'Untitled'}
                    </h3>
                    {item.author && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {item.author}
                      </p>
                    )}
                  </div>
                </div>

                {/* Source + time */}
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                  <span className="font-medium text-neutral-500">
                    From {item.source.title || 'Unknown'}
                  </span>
                  {item.publishedAt && (
                    <>
                      <span>·</span>
                      <span>{formatDaysAgo(item.publishedAt)}</span>
                    </>
                  )}
                </div>

                {/* Excerpt */}
                {item.cleanText && (
                  <p className="text-xs text-neutral-500 italic leading-relaxed line-clamp-2 mb-3 pl-2 border-l-2 border-neutral-100">
                    &ldquo;{normalizeGoodreadsText(item.cleanText)}&rdquo;
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(item.itemId, item.source.title)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-[#1f1a17] bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleIgnore(item.itemId)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {items.length > 0 && (
        <div className="p-4 pt-0 text-center">
          <p className="text-xs text-neutral-300 italic">
            Items expire after 14 days
          </p>
        </div>
      )}

      {/* Manage Sources Modal */}
      {showManageSources && (
        <ManageSourcesModal onClose={() => setShowManageSources(false)} />
      )}
    </div>
  );
}

/**
 * Modal for managing RSS sources
 */
function ManageSourcesModal({ onClose }: { onClose: () => void }) {
  const [sources, setSources] = useState<
    Array<{
      id: string;
      url: string;
      title: string | null;
      isActive: boolean;
      lastFetchedAt: string | null;
      lastError: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/rss/inbox/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newUrl) return;
    setAdding(true);

    try {
      const res = await fetch('/api/rss/inbox/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          titleOverride: newTitle || undefined,
        }),
      });

      if (res.ok) {
        setNewUrl('');
        setNewTitle('');
        fetchSources();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add source');
      }
    } catch (err) {
      console.error('Failed to add source:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/rss/inbox/sources/${id}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to remove source:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-5 border-b border-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1f1a17]">
              Manage Sources
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* Add new source */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">
              Add a source
            </h3>
            <div className="space-y-3">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="RSS feed URL"
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
              />
              <button
                onClick={handleAdd}
                disabled={!newUrl || adding}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#1f1a17] rounded-xl hover:bg-[#2f2a27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {adding ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </div>

          {/* Existing sources */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-3">
              Your sources
            </h3>
            {loading ? (
              <p className="text-sm text-neutral-400">Loading...</p>
            ) : sources.length === 0 ? (
              <p className="text-sm text-neutral-400">No sources yet</p>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-[#1f1a17] truncate">
                        {source.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {source.url}
                      </p>
                      {source.lastError && (
                        <p className="text-xs text-red-500 mt-1">
                          Error: {source.lastError}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(source.id)}
                      className="ml-3 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
