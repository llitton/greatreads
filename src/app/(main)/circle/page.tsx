'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { normalizeGoodreadsUrl } from '@/lib/goodreads/url';
import {
  mapDatabaseStatus,
  inferSourceType,
  type SourceState,
  type SourceStatus,
  type SourceType,
} from '@/lib/sources/types';
import {
  getErrorCopy,
  getWarningCopy,
  getStatusBadgeText,
  getStatusBadgeVariant,
} from '@/lib/sources/errors';

interface DatabaseSource {
  id: string;
  url: string;
  title: string | null;
  status: string;
  failureReasonCode: string | null;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  itemCount?: number;
  createdAt: string;
}

export default function CirclePage() {
  const [sources, setSources] = useState<SourceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Add source form state
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlConverted, setUrlConverted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/rss/inbox/sources');
      if (res.ok) {
        const data = await res.json();
        const mapped: SourceState[] = (data.sources || []).map((s: DatabaseSource) => {
          const { status, errorCode, warningCode } = mapDatabaseStatus(
            s.status,
            s.failureReasonCode
          );
          return {
            id: s.id,
            name: s.title || 'Untitled',
            url: s.url,
            type: inferSourceType(s.url),
            status,
            errorCode,
            warningCode,
            lastCheckedAt: s.lastSuccessAt ? new Date(s.lastSuccessAt) : null,
            nextRetryAt: s.nextAttemptAt ? new Date(s.nextAttemptAt) : null,
            itemCount: s.itemCount || 0,
            createdAt: new Date(s.createdAt),
          };
        });
        setSources(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Group sources by status
  const activeSources = sources.filter((s) => s.status === 'active');
  const warningSources = sources.filter((s) => s.status === 'warning');
  const errorSources = sources.filter((s) => s.status === 'error');
  const pausedSources = sources.filter((s) => s.status === 'paused');
  const needsAttention = [...warningSources, ...errorSources];

  const handleUrlChange = (inputUrl: string) => {
    setAddError(null);
    const result = normalizeGoodreadsUrl(inputUrl);
    setSourceUrl(result.url);
    setUrlConverted(result.converted);
    if (result.error && inputUrl.includes('goodreads')) {
      setAddError(result.error);
    }
  };

  const handleAdd = async () => {
    if (!sourceUrl || !sourceName) return;
    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/rss/inbox/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sourceUrl,
          titleOverride: sourceName,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setSourceName('');
        setSourceUrl('');
        setUrlConverted(false);
        fetchSources();
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

  const handleRetry = async (sourceId: string) => {
    setRetrying(sourceId);
    try {
      // Trigger a re-check of the source
      const res = await fetch(`/api/rss/inbox/sources/${sourceId}/retry`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (error) {
      console.error('Failed to retry:', error);
    } finally {
      setRetrying(null);
    }
  };

  const handlePause = async (sourceId: string) => {
    try {
      await fetch(`/api/rss/inbox/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' }),
      });
      fetchSources();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleResume = async (sourceId: string) => {
    try {
      await fetch(`/api/rss/inbox/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      fetchSources();
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  const handleRemove = async (sourceId: string) => {
    if (!confirm('Remove this source? You can always add them back later.')) return;

    try {
      await fetch(`/api/rss/inbox/sources/${sourceId}`, {
        method: 'DELETE',
      });
      fetchSources();
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  const formatLastChecked = (date: Date | null) => {
    if (!date) return 'Never checked';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSourceTypeLabel = (type: SourceType) => {
    switch (type) {
      case 'goodreads':
        return 'Goodreads';
      case 'newsletter':
        return 'Newsletter';
      default:
        return 'RSS';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">◌</div>
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-2xl font-serif font-semibold text-[#1f1a17] mb-2">
          Your Circle
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          People and publications shaping your recommendations.
        </p>
      </header>

      {sources.length === 0 ? (
        /* Empty state */
        <section className="text-center py-16">
          <p className="text-[17px] text-neutral-500 mb-2">
            Your circle is empty.
          </p>
          <p className="text-sm text-neutral-400 mb-8">
            Add one person whose taste you trust.
          </p>
          <Button size="lg" onClick={() => setShowAddModal(true)}>
            Add someone
          </Button>
        </section>
      ) : (
        <div className="space-y-12">
          {/* Active sources */}
          {activeSources.length > 0 && (
            <section>
              <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-5">
                Active
              </h2>
              <div className="space-y-3">
                {activeSources.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    onRetry={() => handleRetry(source.id)}
                    onPause={() => handlePause(source.id)}
                    onResume={() => handleResume(source.id)}
                    onRemove={() => handleRemove(source.id)}
                    retrying={retrying === source.id}
                    formatLastChecked={formatLastChecked}
                    getSourceTypeLabel={getSourceTypeLabel}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <section>
              <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-5">
                Needs attention
              </h2>
              <div className="space-y-3">
                {needsAttention.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    onRetry={() => handleRetry(source.id)}
                    onPause={() => handlePause(source.id)}
                    onResume={() => handleResume(source.id)}
                    onRemove={() => handleRemove(source.id)}
                    retrying={retrying === source.id}
                    formatLastChecked={formatLastChecked}
                    getSourceTypeLabel={getSourceTypeLabel}
                    showIssue
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paused */}
          {pausedSources.length > 0 && (
            <section>
              <h2 className="text-xs text-neutral-300 uppercase tracking-widest mb-5">
                Paused
              </h2>
              <div className="space-y-3">
                {pausedSources.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    onRetry={() => handleRetry(source.id)}
                    onPause={() => handlePause(source.id)}
                    onResume={() => handleResume(source.id)}
                    onRemove={() => handleRemove(source.id)}
                    retrying={retrying === source.id}
                    formatLastChecked={formatLastChecked}
                    getSourceTypeLabel={getSourceTypeLabel}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Add action */}
          <section className="pt-4">
            <Button onClick={() => setShowAddModal(true)}>
              Add someone
            </Button>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-300 italic">
          Quality over quantity.
        </p>
      </footer>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1f1a17]">
                    Add someone you trust
                  </h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    Books appear only when they give five stars.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSourceName('');
                    setSourceUrl('');
                    setUrlConverted(false);
                    setAddError(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1l12 12M13 1L1 13" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Their name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g., Laura, Ken, Mom"
                  className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1f1a17] mb-2">
                  Their Goodreads profile or RSS feed
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste any Goodreads URL"
                  className="w-full px-4 py-3 text-[15px] bg-neutral-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f1a17]/10"
                />
                {urlConverted && (
                  <p className="mt-2 text-xs text-green-600">
                    ✓ Converted to RSS format.
                  </p>
                )}
              </div>

              {addError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-600">{addError}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={!sourceUrl || !sourceName || adding}
                  className="w-full"
                  size="lg"
                >
                  {adding ? 'Adding...' : `Add ${sourceName || 'person'}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Source Row Component
 */
function SourceRow({
  source,
  onRetry,
  onPause,
  onResume,
  onRemove,
  retrying,
  formatLastChecked,
  getSourceTypeLabel,
  showIssue = false,
}: {
  source: SourceState;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
  retrying: boolean;
  formatLastChecked: (date: Date | null) => string;
  getSourceTypeLabel: (type: SourceType) => string;
  showIssue?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const errorCopy = source.errorCode ? getErrorCopy(source.errorCode) : null;
  const warningCopy = source.warningCode ? getWarningCopy(source.warningCode) : null;

  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        source.status === 'error'
          ? 'border-red-100 bg-red-50/30'
          : source.status === 'warning'
            ? 'border-amber-100 bg-amber-50/30'
            : 'border-black/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[#1f1a17] truncate">
              {source.name}
            </h3>
            <StatusPill variant={getStatusBadgeVariant(source.status)}>
              {getStatusBadgeText(source.status, source.warningCode)}
            </StatusPill>
          </div>
          <p className="text-xs text-neutral-400">
            {getSourceTypeLabel(source.type)} · Last checked {formatLastChecked(source.lastCheckedAt)}
          </p>

          {/* Show issue details if applicable */}
          {showIssue && (errorCopy || warningCopy) && (
            <div className="mt-3 pt-3 border-t border-black/5">
              <p className={`text-sm font-medium ${source.status === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                {errorCopy?.title || warningCopy?.title}
              </p>
              <p className={`text-xs mt-1 ${source.status === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                {errorCopy?.body || warningCopy?.body}
              </p>
              {errorCopy?.action && (
                <p className="text-xs text-neutral-500 mt-2">
                  {errorCopy.action}
                </p>
              )}
              {errorCopy?.showRetry && (
                <button
                  onClick={onRetry}
                  disabled={retrying}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] disabled:opacity-50 transition-colors"
                >
                  {retrying ? 'Checking...' : 'Try again'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-lg border border-black/5 py-1 z-20">
                {source.status === 'paused' ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onResume();
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-[#1f1a17] hover:bg-neutral-50"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onPause();
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-[#1f1a17] hover:bg-neutral-50"
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRetry();
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-[#1f1a17] hover:bg-neutral-50"
                >
                  Check now
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onRemove();
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
