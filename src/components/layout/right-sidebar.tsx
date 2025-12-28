'use client';

import { useEffect, useState, useCallback } from 'react';
import { normalizeGoodreadsText } from '@/lib/text/normalize';

type FilterType = 'new' | 'seen' | 'all';
type SourceType = 'person' | 'feed';

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
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: item.status === 'UNSEEN' ? 'SEEN' : item.status,
          }))
        );
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
    <div className="flex flex-col h-full bg-[#faf9f7]">
      {/* Header - sticky */}
      <div className="sticky top-0 bg-[#faf9f7] z-10 p-4 pb-3 border-b border-black/5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-[#1f1a17]">
            Incoming signals
          </h2>
          <button
            onClick={() => setShowManageSources(true)}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Manage
          </button>
        </div>
        <p className="text-xs text-neutral-400 mb-3">
          New books from people you trust
          {unseenCount > 0 && <span className="ml-1 font-medium text-neutral-500">· {unseenCount} new</span>}
        </p>

        {/* Filters */}
        <div className="flex gap-1">
          {(['new', 'seen', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
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
      <div className="flex-1 overflow-y-auto p-4 pt-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-2.5">
                  <div className="w-10 h-[60px] bg-neutral-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-2 bg-neutral-50 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
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
            <p className="text-sm text-neutral-400 mb-2">
              {filter === 'new' ? 'No new signals yet' : 'No signals yet'}
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-[180px] mx-auto">
              Books appear when someone you trust finishes a five-star read.
            </p>
            <button
              onClick={() => setShowManageSources(true)}
              className="mt-4 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Add a source
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.actionId}
                className="bg-white rounded-xl border border-black/5 p-3 shadow-sm"
              >
                <div className="flex gap-2.5 mb-2">
                  {/* Cover - smaller */}
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt=""
                      className="w-10 h-[60px] object-cover rounded shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-[60px] bg-gradient-to-br from-stone-100 to-stone-200 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-stone-400 text-[10px] font-medium">
                        {item.title?.slice(0, 2).toUpperCase() || '📕'}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-[#1f1a17] leading-tight line-clamp-2">
                      {item.title || 'Untitled'}
                    </h3>
                    {item.author && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {item.author}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-400 mt-1">
                      From {item.source.title || 'Unknown'}
                      {item.publishedAt && ` · ${formatDaysAgo(item.publishedAt)}`}
                    </p>
                  </div>
                </div>

                {/* Excerpt - more compact */}
                {item.cleanText && (
                  <p className="text-[11px] text-neutral-500 italic leading-relaxed line-clamp-2 mb-2 pl-2 border-l border-neutral-100">
                    {normalizeGoodreadsText(item.cleanText)}
                  </p>
                )}

                {/* Actions - smaller */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(item.itemId, item.source.title)}
                    className="flex-1 px-2 py-1 text-[11px] font-medium text-[#1f1a17] bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleIgnore(item.itemId)}
                    className="px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Sources Modal */}
      {showManageSources && (
        <AddSourceModal
          onClose={() => {
            setShowManageSources(false);
            fetchInbox();
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal for adding sources with type selection and preview
 */
function AddSourceModal({ onClose }: { onClose: () => void }) {
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

  // Add source state
  const [sourceType, setSourceType] = useState<SourceType>('person');
  const [url, setUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Preview state
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    itemCount: number;
    qualifyingCount: number;
    sampleItems: Array<{ title: string; author: string | null }>;
  } | null>(null);

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

  const handlePreview = async () => {
    if (!url) return;
    setPreviewing(true);
    setAddError(null);
    setPreviewData(null);

    try {
      const res = await fetch('/api/rss/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAddError(data.error || 'Failed to preview feed');
        return;
      }

      const data = await res.json();
      setPreviewData({
        title: data.title || displayName || 'Unknown',
        itemCount: data.totalItems || 0,
        qualifyingCount: data.fiveStarItems || 0,
        sampleItems: data.sampleItems || [],
      });
    } catch (err) {
      setAddError('Failed to connect to feed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleAdd = async () => {
    if (!url) return;
    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/rss/inbox/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          titleOverride: displayName || previewData?.title || undefined,
        }),
      });

      if (res.ok) {
        setUrl('');
        setDisplayName('');
        setPreviewData(null);
        fetchSources();
      } else {
        const data = await res.json();
        setAddError(data.error || 'Failed to add source');
      }
    } catch (err) {
      setAddError('Failed to add source');
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

  const resetForm = () => {
    setUrl('');
    setDisplayName('');
    setPreviewData(null);
    setAddError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1f1a17]">
                Add a source you trust
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Books only appear when someone gives them five stars.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[65vh]">
          {/* Source Type Selection */}
          <div className="mb-6">
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  sourceType === 'person'
                    ? 'border-[#1f1a17] bg-neutral-50'
                    : 'border-black/5 hover:border-neutral-200'
                }`}
                onClick={() => { setSourceType('person'); resetForm(); }}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  sourceType === 'person' ? 'border-[#1f1a17]' : 'border-neutral-300'
                }`}>
                  {sourceType === 'person' && <div className="w-2 h-2 rounded-full bg-[#1f1a17]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1f1a17]">Person (Goodreads)</p>
                  <p className="text-xs text-neutral-400">Import 5-star books from someone you trust</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  sourceType === 'feed'
                    ? 'border-[#1f1a17] bg-neutral-50'
                    : 'border-black/5 hover:border-neutral-200'
                }`}
                onClick={() => { setSourceType('feed'); resetForm(); }}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  sourceType === 'feed' ? 'border-[#1f1a17]' : 'border-neutral-300'
                }`}>
                  {sourceType === 'feed' && <div className="w-2 h-2 rounded-full bg-[#1f1a17]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1f1a17]">Feed (RSS)</p>
                  <p className="text-xs text-neutral-400">For newsletters or blogs that recommend books</p>
                </div>
              </label>
            </div>
          </div>

          {/* Input Fields */}
          <div className="mb-6 space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPreviewData(null); setAddError(null); }}
              placeholder={sourceType === 'person' ? 'Goodreads RSS URL' : 'RSS feed URL'}
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
            />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={sourceType === 'person' ? 'Person\'s name (e.g., Laura)' : 'Display name (e.g., Austin Kleon\'s blog)'}
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
            />

            {/* Preview Button */}
            {!previewData && (
              <button
                onClick={handlePreview}
                disabled={!url || previewing}
                className="w-full px-4 py-2.5 text-sm font-medium text-[#1f1a17] bg-neutral-100 rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {previewing ? 'Checking...' : 'Preview source'}
              </button>
            )}

            {/* Error */}
            {addError && (
              <p className="text-xs text-red-500 text-center">{addError}</p>
            )}
          </div>

          {/* Preview Results */}
          {previewData && (
            <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-black/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#1f1a17]">
                  {displayName || previewData.title}
                </p>
                <button
                  onClick={resetForm}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Change
                </button>
              </div>

              <p className="text-xs text-neutral-500 mb-3">
                {previewData.qualifyingCount > 0 ? (
                  <span className="text-green-600">
                    {previewData.qualifyingCount} five-star book{previewData.qualifyingCount !== 1 ? 's' : ''} found
                  </span>
                ) : (
                  <span className="text-amber-600">
                    No five-star books yet. We&apos;ll notify you when there are.
                  </span>
                )}
              </p>

              {previewData.sampleItems.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Sample books</p>
                  {previewData.sampleItems.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-xs text-neutral-600 truncate">
                      {item.title}
                      {item.author && <span className="text-neutral-400"> · {item.author}</span>}
                    </p>
                  ))}
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-[#1f1a17] rounded-xl hover:bg-[#2f2a27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {adding ? 'Adding...' : `Add ${displayName || previewData.title}`}
              </button>
            </div>
          )}

          {/* Existing Sources */}
          {sources.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
                Your sources
              </h3>
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-[#1f1a17] truncate">
                        {source.title || 'Untitled'}
                      </p>
                      {source.lastError && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">
                          {source.lastError}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(source.id)}
                      className="ml-3 p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help text for Goodreads */}
          {sourceType === 'person' && !previewData && (
            <div className="mt-6 p-3 bg-neutral-50 rounded-xl">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <strong className="text-neutral-600">How to get a Goodreads RSS URL:</strong>
                <br />
                Go to their profile → click the RSS icon next to their shelves, or use:
                <br />
                <code className="text-[10px] bg-white px-1 py-0.5 rounded">
                  goodreads.com/review/list_rss/[USER_ID]?shelf=read
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
