'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { normalizeGoodreadsText } from '@/lib/text/normalize';
import { normalizeGoodreadsUrl } from '@/lib/goodreads/url';
import { FilterPillGroup } from '@/components/ui/status-pill';
import { SignalAttribution, createSignal } from '@/components/ui/signal-attribution';
import { BookCover } from '@/components/ui/book-cover';

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

interface Source {
  id: string;
  url: string;
  title: string | null;
  status: 'DRAFT' | 'VALIDATING' | 'ACTIVE' | 'PAUSED' | 'BACKOFF' | 'FAILED';
  failureReasonCode: string | null;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  isActive: boolean;
}

// Contextual content for pages where signals aren't the focus
// The right rail is always present, but adapts its message per page
const CONTEXTUAL_PAGES: Record<string, { title: string; description: string; tip?: string }> = {
  '/import': {
    title: 'Signals start here',
    description: "We'll look for five-star books and ignore everything else.",
    tip: 'Your import history becomes visible to people who follow you.',
  },
  '/settings': {
    title: 'Signals are shaped by trust',
    description: 'Changes here affect what appears in your feed.',
  },
  '/under-the-hood': {
    title: 'Signal weights explained',
    description: 'These rules explain why some books surface and most do not.',
  },
  '/reflections': {
    title: 'Books that stayed',
    description: 'This page is for quiet reflection. Signals will wait.',
  },
  '/top10': {
    title: 'Your personal canon',
    description: 'Curating your Top 10 is a different kind of thinking.',
  },
  '/my-books': {
    title: 'Canon vs. five-star',
    description: 'Five-star books are ones you loved. Canon books are the ones that stayed with you—they changed how you see things.',
    tip: 'Promote books to your canon when they keep coming back to you.',
  },
  '/circle': {
    title: 'Managing your circle',
    description: 'Add, remove, or troubleshoot your trusted sources here.',
  },
};

export function RightSidebar() {
  const pathname = usePathname();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('new');
  const [showManageSources, setShowManageSources] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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
      setLastChecked(new Date());
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
      setError('Couldn\'t load signals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/rss/inbox/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
    fetchSources();
  }, [fetchInbox, fetchSources]);

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

  const formatLastChecked = () => {
    if (!lastChecked) return null;
    const mins = Math.floor((Date.now() - lastChecked.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const formatNextAttempt = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Derive state - sidebar only shows usable sources (active/warning)
  // Errors are handled on the /circle management page
  const usableSources = sources.filter(s =>
    s.status === 'ACTIVE' || s.status === 'VALIDATING' || s.status === 'BACKOFF'
  );
  const hasSources = usableSources.length > 0;
  const hasErrorSources = sources.some(s => s.status === 'FAILED');
  const totalSources = sources.length;

  // Check if we're on a contextual page
  const contextualContent = CONTEXTUAL_PAGES[pathname];

  // Get status message for sources with issues
  const getSourceStatusMessage = (source: Source) => {
    switch (source.status) {
      case 'VALIDATING':
        return 'Checking this source...';
      case 'BACKOFF':
        const retryTime = formatNextAttempt(source.nextAttemptAt);
        return retryTime
          ? `Having trouble. Retrying at ${retryTime}.`
          : 'Having trouble reaching this source.';
      case 'FAILED':
        switch (source.failureReasonCode) {
          case 'NOT_FEED':
            return "This doesn't look like an RSS feed.";
          case 'UNAUTHORIZED':
            return 'This feed requires authentication.';
          case 'NOT_FOUND':
            return "This feed couldn't be found.";
          case 'PARSE_ERROR':
            return "Couldn't read this feed.";
          default:
            return source.lastError || 'This source needs attention.';
        }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f7]">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Always present - identity of this space
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 bg-[#faf9f7] z-10 p-5 pb-3 border-b border-black/5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-[#1f1a17]">
            Incoming signals
          </h2>
          {totalSources > 0 && (
            <a
              href="/circle"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Manage
            </a>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          New books from people you trust
          {unseenCount > 0 && (
            <span className="ml-1 font-medium text-neutral-500">· {unseenCount} new</span>
          )}
        </p>
        <p className="text-[10px] text-neutral-300 mt-1">Rare by design</p>

        {/* Filters - only show when we have sources and items */}
        {hasSources && !contextualContent && (
          <>
            <FilterPillGroup
              filters={[
                { value: 'new', label: 'New' },
                { value: 'seen', label: 'Seen' },
                { value: 'all', label: 'All' },
              ]}
              activeFilter={filter}
              onFilterChange={(v) => setFilter(v as FilterType)}
              className="mt-3"
            />

            {/* Mark all seen + last checked */}
            <div className="flex items-center justify-between mt-2">
              {unseenCount > 0 && filter === 'new' ? (
                <button
                  onClick={handleMarkAllSeen}
                  className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  Mark all seen
                </button>
              ) : (
                <span />
              )}
              {lastChecked && !loading && (
                <span className="text-[10px] text-neutral-300">
                  Checked {formatLastChecked()}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STATE CONTENT: Changes by context, but container never collapses
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5 pt-3">
        {contextualContent ? (
          /* Contextual page state - explain relevance */
          <div className="py-5">
            <p className="text-sm font-medium text-neutral-500 mb-2">
              {contextualContent.title}
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {contextualContent.description}
            </p>
            {contextualContent.tip && (
              <p className="text-xs text-neutral-300 mt-3 italic">
                {contextualContent.tip}
              </p>
            )}
          </div>
        ) : loading ? (
          /* Loading state - skeleton cards */
          <div className="space-y-3">
            <p className="text-xs text-neutral-400 mb-2">Checking for new signals...</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-black/5 p-3 animate-pulse">
                <div className="flex gap-2 mb-2">
                  <div className="w-10 h-[60px] bg-neutral-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-100 rounded w-3/4" />
                    <div className="h-2 bg-neutral-50 rounded w-1/2" />
                    <div className="h-2 bg-neutral-50 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error state */
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 mb-2">{error}</p>
            <p className="text-xs text-neutral-400 mb-5">Check your connection and try again.</p>
            <button
              onClick={fetchInbox}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors px-3 py-2 bg-neutral-100 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : !hasSources ? (
          /* STATE A: No sources yet (onboarding) */
          <div className="py-5">
            <p className="text-sm font-medium text-neutral-500 mb-2">
              You haven&apos;t added any sources yet.
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed mb-5">
              Signals appear when someone you trust finishes a five-star book.
            </p>

            {/* Ghost cards - preview format */}
            <div className="space-y-3 mb-5 opacity-40 pointer-events-none">
              <div className="bg-white rounded-xl border border-black/5 p-3">
                <div className="flex gap-2">
                  <div className="w-10 h-[60px] bg-neutral-100 rounded" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400 italic">&ldquo;A book that stayed with me&rdquo;</p>
                    <p className="text-[10px] text-neutral-300 mt-1">From someone you trust</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-black/5 p-3">
                <div className="flex gap-2">
                  <div className="w-10 h-[60px] bg-neutral-100 rounded" />
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400 italic">&ldquo;Five stars from Ken&rdquo;</p>
                    <p className="text-[10px] text-neutral-300 mt-1">Added yesterday</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowManageSources(true)}
              className="w-full px-5 py-3 text-sm font-medium text-white bg-[#1f1a17] rounded-xl hover:bg-[#2f2a27] transition-colors"
            >
              Add a person or feed
            </button>
          </div>
        ) : items.length === 0 ? (
          /* STATE B: Has sources, nothing new (quiet) */
          <div className="py-5">
            <p className="text-sm font-medium text-neutral-500 mb-2">
              Nothing new right now.
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              We&apos;ll show books here when someone finishes a five-star read.
            </p>

            {/* Last checked status - builds trust */}
            {lastChecked && (
              <p className="text-[10px] text-neutral-300 mb-5">
                Last checked {formatLastChecked()}
              </p>
            )}

            {/* If there are sources with issues, show ONE line linking to /circle */}
            {hasErrorSources && (
              <a
                href="/circle"
                className="block p-3 bg-amber-50 rounded-xl border border-amber-100 mb-5 hover:bg-amber-100/50 transition-colors"
              >
                <p className="text-xs text-amber-700">
                  Some sources need attention. <span className="underline">Manage your circle →</span>
                </p>
              </a>
            )}

            <button
              onClick={() => setShowManageSources(true)}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Add another source
            </button>
          </div>
        ) : (
          /* STATE C: Active signals */
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.actionId}
                className="bg-white rounded-xl border border-black/5 p-3 shadow-sm"
              >
                <div className="flex gap-2 mb-2">
                  {/* Cover - smaller */}
                  <BookCover
                    src={item.coverImageUrl}
                    title={item.title || 'Untitled'}
                    size="sm"
                  />

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
                      <SignalAttribution
                        signal={createSignal({
                          type: 'rss_five_star',
                          sourcePersonId: item.source.id,
                          sourcePersonName: item.source.title || 'Unknown',
                          sourceKind: 'rss',
                        })}
                        variant="rail"
                        showBadge={false}
                      />
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

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER: Always present - action or status
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-5 pt-3 border-t border-black/5">
        {contextualContent ? (
          /* Contextual pages: show relevant action */
          <p className="text-xs text-neutral-300 text-center">
            We notify you only for five-star reads
          </p>
        ) : !hasSources ? (
          /* No sources: primary CTA */
          <button
            onClick={() => setShowManageSources(true)}
            className="w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-2"
          >
            Add a source
          </button>
        ) : items.length > 0 ? (
          /* Active: see all link */
          <a
            href="/circle"
            className="block w-full text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-2 text-center"
          >
            Manage sources
          </a>
        ) : (
          /* Quiet: reassurance */
          <p className="text-xs text-neutral-300 text-center">
            We notify you only for five-star reads
          </p>
        )}
      </div>

      {/* Manage Sources Modal */}
      {showManageSources && (
        <AddSourceModal
          sources={sources}
          onClose={() => {
            setShowManageSources(false);
            fetchInbox();
            fetchSources();
          }}
          onRemove={async (id) => {
            try {
              await fetch(`/api/rss/inbox/sources/${id}`, { method: 'DELETE' });
              setSources((prev) => prev.filter((s) => s.id !== id));
            } catch (err) {
              console.error('Failed to remove source:', err);
            }
          }}
          getSourceStatusMessage={getSourceStatusMessage}
        />
      )}
    </div>
  );
}

/**
 * Modal for adding sources with type selection and preview
 */
function AddSourceModal({
  sources: initialSources,
  onClose,
  onRemove,
  getSourceStatusMessage,
}: {
  sources: Source[];
  onClose: () => void;
  onRemove: (id: string) => Promise<void>;
  getSourceStatusMessage: (source: Source) => string | null;
}) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [loading, setLoading] = useState(false);

  // Add source state
  const [sourceType, setSourceType] = useState<SourceType>('person');
  const [url, setUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [urlConverted, setUrlConverted] = useState(false);

  // Preview state
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    itemCount: number;
    qualifyingCount: number;
    sampleItems: Array<{ title: string; author: string | null }>;
  } | null>(null);

  const handleUrlChange = (inputUrl: string) => {
    setPreviewData(null);
    setAddError(null);

    if (sourceType === 'person') {
      // Use centralized Goodreads URL normalization
      const result = normalizeGoodreadsUrl(inputUrl);
      setUrl(result.url);
      setUrlConverted(result.converted);

      // Show error if we couldn't parse a Goodreads URL
      if (result.error && inputUrl.includes('goodreads')) {
        setAddError(result.error);
      }
    } else {
      setUrl(inputUrl);
      setUrlConverted(false);
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
    } catch {
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
        const data = await res.json();
        setSources((prev) => [data.source, ...prev]);
        setUrl('');
        setDisplayName('');
        setPreviewData(null);
      } else {
        const data = await res.json();
        setAddError(data.error || 'Failed to add source');
      }
    } catch {
      setAddError('Failed to add source');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    await onRemove(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const resetForm = () => {
    setUrl('');
    setDisplayName('');
    setPreviewData(null);
    setAddError(null);
    setUrlConverted(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
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
          {/* Step 1: Source Type Selection */}
          <div className="mb-5">
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Step 1: Choose source type
            </p>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  sourceType === 'person'
                    ? 'border-[#1f1a17] bg-neutral-50'
                    : 'border-black/5 hover:border-neutral-200'
                }`}
                onClick={() => { setSourceType('person'); resetForm(); }}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
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
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
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

          {/* Step 2: Add Details */}
          <div className="mb-5">
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Step 2: Add details
            </p>
            <div className="space-y-3">
              <div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={sourceType === 'person' ? 'Paste any Goodreads profile or shelf URL' : 'RSS feed URL'}
                  className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
                {/* Show conversion message when URL was auto-converted */}
                {urlConverted && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ Converted to RSS format. We&apos;ll follow their reads.
                  </p>
                )}
                {/* Help text when no URL entered */}
                {sourceType === 'person' && !url && !urlConverted && (
                  <p className="mt-2 text-xs text-neutral-400">
                    We&apos;ll automatically convert it to their RSS feed.
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={sourceType === 'person' ? "Person's name (required)" : 'Display name (e.g., Austin Kleon)'}
                  className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
                {/* Live preview of how signals will appear */}
                {sourceType === 'person' && displayName && (
                  <p className="mt-2 text-xs text-neutral-500 italic">
                    Will appear as:{' '}
                    <SignalAttribution
                      signal={createSignal({
                        type: 'rss_five_star',
                        sourcePersonId: 'preview',
                        sourcePersonName: displayName,
                        sourceKind: 'person',
                      })}
                      variant="inline"
                      showStars={true}
                      className="text-neutral-700"
                    />
                  </p>
                )}
                {sourceType === 'person' && !displayName && url && (
                  <p className="mt-2 text-xs text-amber-600">
                    Add a name so signals read naturally
                  </p>
                )}
              </div>

              {/* Preview Button */}
              {!previewData && (
                <button
                  onClick={handlePreview}
                  disabled={!url || previewing || (sourceType === 'person' && !displayName)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-[#1f1a17] bg-neutral-100 rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {previewing ? 'Checking...' : 'Preview source'}
                </button>
              )}

              {/* Error */}
              {addError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600">{addError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Results */}
          {previewData && (
            <div className="mb-5 p-5 bg-neutral-50 rounded-xl border border-black/5">
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
                    {previewData.qualifyingCount} five-star book{previewData.qualifyingCount !== 1 ? 's' : ''} ready to import
                  </span>
                ) : (
                  <span className="text-neutral-500">
                    Connected. When a book truly lands, you&apos;ll know.
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
                className="w-full mt-5 px-3 py-2 text-sm font-medium text-white bg-[#1f1a17] rounded-xl hover:bg-[#2f2a27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                {sources.map((source) => {
                  const statusMessage = getSourceStatusMessage(source);
                  const hasIssue = source.status === 'FAILED' || source.status === 'BACKOFF';

                  return (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        hasIssue
                          ? source.status === 'FAILED'
                            ? 'bg-red-50 border border-red-100'
                            : 'bg-amber-50 border border-amber-100'
                          : 'bg-neutral-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm truncate ${
                          hasIssue
                            ? source.status === 'FAILED' ? 'text-red-700' : 'text-amber-700'
                            : 'text-[#1f1a17]'
                        }`}>
                          {source.title || 'Untitled'}
                        </p>
                        {statusMessage && (
                          <p className={`text-[10px] mt-0.5 truncate ${
                            source.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {statusMessage}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(source.id)}
                        className="ml-3 p-2 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Help text for Goodreads */}
          {sourceType === 'person' && !previewData && (
            <div className="mt-5 p-3 bg-neutral-50 rounded-xl">
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
