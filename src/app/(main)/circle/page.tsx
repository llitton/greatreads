'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { normalizeGoodreadsUrl } from '@/lib/goodreads/url';
import type { PersonStatus, CirclePerson, CircleSummary, CircleSource } from '@/lib/circle';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface CircleData {
  people: CirclePerson[];
  summary: CircleSummary;
}

// ═══════════════════════════════════════════════════════════════════
// Status Helpers
// ═══════════════════════════════════════════════════════════════════

function getStatusLabel(status: PersonStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'QUIET':
      return 'Quiet';
    case 'WARNING':
      return 'Needs attention';
    case 'PAUSED':
      return 'Paused';
    case 'MUTED':
      return 'Muted';
  }
}

function getStatusVariant(status: PersonStatus): 'active' | 'new' | 'danger' | 'muted' | 'default' {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'QUIET':
      return 'muted';
    case 'WARNING':
      return 'new'; // amber/warning color
    case 'PAUSED':
      return 'muted';
    case 'MUTED':
      return 'muted';
  }
}

function getStatusDescription(status: PersonStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Signals are flowing normally.';
    case 'QUIET':
      return 'No five-star reads recently.';
    case 'WARNING':
      return "We're having trouble checking one source.";
    case 'PAUSED':
      return 'All sources are paused.';
    case 'MUTED':
      return "You won't be interrupted by this person.";
  }
}

function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'never';
  const d = new Date(date);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════

function PersonAvatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover bg-neutral-100`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-neutral-100 flex items-center justify-center font-medium text-neutral-500`}
    >
      {initials}
    </div>
  );
}

function PersonCard({
  person,
  onManage,
  onMute,
  onRemove,
}: {
  person: CirclePerson;
  onManage: () => void;
  onMute: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/5 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <PersonAvatar name={person.displayName} avatarUrl={person.avatarUrl} size="lg" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#1f1a17] truncate">
              {person.displayName}
            </h3>
            <StatusPill variant={getStatusVariant(person.status)}>
              {getStatusLabel(person.status)}
            </StatusPill>
          </div>

          {/* Impact stats */}
          <p className="text-sm text-neutral-500">
            {person.booksSurfaced > 0 ? (
              <>
                <span className="text-amber-500">★★★★★</span>{' '}
                {person.booksSurfaced} book{person.booksSurfaced !== 1 ? 's' : ''} surfaced
                {person.booksInCanon > 0 && (
                  <> · {person.booksInCanon} in your canon</>
                )}
              </>
            ) : (
              'No signals yet'
            )}
          </p>

          {/* Last signal */}
          {person.lastSignalBookTitle && (
            <p className="text-xs text-neutral-400 mt-1">
              Last signal: {person.lastSignalBookTitle} · {formatRelativeTime(person.lastSignalAt)}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            {person.booksSurfaced > 0 && (
              <button
                onClick={() => {/* TODO: Navigate to signals filtered by person */}}
                className="text-xs text-neutral-500 hover:text-[#1f1a17] transition-colors"
              >
                View signals
              </button>
            )}
            <button
              onClick={onManage}
              className="text-xs text-neutral-500 hover:text-[#1f1a17] transition-colors"
            >
              Manage
            </button>
            <button
              onClick={onMute}
              className="text-xs text-neutral-500 hover:text-[#1f1a17] transition-colors"
            >
              {person.isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageDrawer({
  person,
  sources,
  impact,
  onClose,
  onRetrySource,
  onMute,
  onRemove,
}: {
  person: { id: string; displayName: string; avatarUrl?: string | null; trustedSince: Date | string; isMuted: boolean };
  sources: Array<CircleSource & { title?: string }>;
  impact: { booksSurfaced: number; booksInCanon: number; lastSignalAt: Date | null; lastSignalBookTitle: string | null };
  onClose: () => void;
  onRetrySource: (sourceId: string) => void;
  onMute: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-black/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PersonAvatar name={person.displayName} avatarUrl={person.avatarUrl} />
              <div>
                <h2 className="font-semibold text-[#1f1a17]">{person.displayName}</h2>
                <p className="text-xs text-neutral-400">
                  Trusted since {formatDate(person.trustedSince)}
                </p>
              </div>
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

        {/* Impact summary */}
        <div className="p-5 border-b border-black/5">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Impact</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-amber-500">★★★★★</span>{' '}
              {impact.booksSurfaced} book{impact.booksSurfaced !== 1 ? 's' : ''} surfaced
            </p>
            {impact.booksInCanon > 0 && (
              <p className="text-neutral-600">
                {impact.booksInCanon} promoted to your canon
              </p>
            )}
            {impact.lastSignalBookTitle && (
              <p className="text-neutral-500">
                Last signal: {impact.lastSignalBookTitle} · {formatRelativeTime(impact.lastSignalAt)}
              </p>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="p-5 border-b border-black/5">
          <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-3">
            Sources connected to {person.displayName}
          </h3>
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`p-4 rounded-xl border ${
                  source.status === 'FAILED' || source.status === 'error'
                    ? 'border-red-100 bg-red-50/30'
                    : source.status === 'WARNING' || source.status === 'BACKOFF' || source.status === 'warning'
                      ? 'border-amber-100 bg-amber-50/30'
                      : 'border-black/5 bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-neutral-400 uppercase">
                    {source.type}
                  </span>
                  <StatusPill
                    variant={
                      source.status === 'ACTIVE' || source.status === 'active'
                        ? 'active'
                        : source.status === 'FAILED' || source.status === 'error'
                          ? 'danger'
                          : source.status === 'WARNING' || source.status === 'BACKOFF' || source.status === 'warning'
                            ? 'new'
                            : 'muted'
                    }
                  >
                    {source.status === 'ACTIVE' || source.status === 'active'
                      ? 'Active'
                      : source.status === 'FAILED' || source.status === 'error'
                        ? 'Failed'
                        : source.status === 'WARNING' || source.status === 'BACKOFF' || source.status === 'warning'
                          ? 'Needs attention'
                          : 'Paused'}
                  </StatusPill>
                </div>
                <p className="text-sm text-neutral-600 truncate mb-1">
                  {source.url || 'No URL'}
                </p>
                <p className="text-xs text-neutral-400">
                  Last checked {formatRelativeTime(source.lastSuccessAt)}
                </p>

                {(source.status === 'FAILED' || source.status === 'WARNING' || source.status === 'BACKOFF' || source.status === 'error' || source.status === 'warning') && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onRetrySource(source.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#1f1a17] rounded-lg hover:bg-[#2f2a27] transition-colors"
                    >
                      Retry now
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-[#1f1a17] transition-colors"
                    >
                      Edit URL
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4">
          <button
            onClick={onMute}
            className="w-full p-4 text-left rounded-xl border border-black/5 hover:bg-neutral-50 transition-colors"
          >
            <p className="font-medium text-[#1f1a17]">
              {person.isMuted ? 'Unmute' : 'Mute'} {person.displayName}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {person.isMuted
                ? 'Start receiving signals again.'
                : 'Stops future interruptions without removing trust.'}
            </p>
          </button>

          <button
            onClick={onRemove}
            className="w-full p-4 text-left rounded-xl border border-red-100 hover:bg-red-50/50 transition-colors"
          >
            <p className="font-medium text-red-600">
              Remove from circle
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Removes {person.displayName} and all associated signals.
            </p>
          </button>

          <p className="text-xs text-neutral-300 text-center pt-2">
            Changes affect future signals only. Your library stays intact.
          </p>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════

export default function CirclePage() {
  const [data, setData] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [managingPerson, setManagingPerson] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<{
    person: { id: string; displayName: string; avatarUrl?: string | null; trustedSince: Date; isMuted: boolean };
    sources: Array<CircleSource & { title?: string }>;
    impact: { booksSurfaced: number; booksInCanon: number; lastSignalAt: Date | null; lastSignalBookTitle: string | null };
  } | null>(null);

  // Add form state
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlConverted, setUrlConverted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchCircle = useCallback(async () => {
    try {
      const res = await fetch('/api/circle');
      if (res.ok) {
        const circleData = await res.json();
        setData(circleData);
      }
    } catch (error) {
      console.error('Failed to fetch circle:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPersonDetails = useCallback(async (personId: string) => {
    try {
      const res = await fetch(`/api/circle/${personId}`);
      if (res.ok) {
        const details = await res.json();
        setPersonDetails(details);
      }
    } catch (error) {
      console.error('Failed to fetch person details:', error);
    }
  }, []);

  useEffect(() => {
    fetchCircle();
  }, [fetchCircle]);

  useEffect(() => {
    if (managingPerson) {
      fetchPersonDetails(managingPerson);
    } else {
      setPersonDetails(null);
    }
  }, [managingPerson, fetchPersonDetails]);

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
    if (!sourceName.trim()) return;
    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sourceName.trim(),
          rssUrl: sourceUrl || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setSourceName('');
        setSourceUrl('');
        setUrlConverted(false);
        fetchCircle();
      } else {
        const errorData = await res.json();
        setAddError(errorData.error || 'Failed to add person');
      }
    } catch {
      setAddError('Failed to add person');
    } finally {
      setAdding(false);
    }
  };

  const handleMute = async (personId: string, currentlyMuted: boolean) => {
    try {
      await fetch('/api/circle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, muted: !currentlyMuted }),
      });
      fetchCircle();
      if (managingPerson) {
        fetchPersonDetails(managingPerson);
      }
    } catch (error) {
      console.error('Failed to mute/unmute:', error);
    }
  };

  const handleRemove = async (personId: string) => {
    if (!confirm('Remove this person? You can always add them back later.')) return;

    try {
      await fetch(`/api/circle/${personId}`, { method: 'DELETE' });
      setManagingPerson(null);
      fetchCircle();
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  const handleRetrySource = async (sourceId: string) => {
    try {
      await fetch(`/api/rss/inbox/sources/${sourceId}/retry`, { method: 'POST' });
      if (managingPerson) {
        fetchPersonDetails(managingPerson);
      }
    } catch (error) {
      console.error('Failed to retry source:', error);
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

  const people = data?.people || [];
  const summary = data?.summary;

  // Group people by status
  const activePeople = people.filter((p) => p.status === 'ACTIVE' || p.status === 'QUIET');
  const warningPeople = people.filter((p) => p.status === 'WARNING');
  const mutedPeople = people.filter((p) => p.status === 'MUTED');
  const pausedPeople = people.filter((p) => p.status === 'PAUSED');

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-[#1f1a17] mb-2">
          Your circle
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed">
          The people whose taste can interrupt you.
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Only five-star reads from your circle surface as signals.
        </p>
      </header>

      {/* Summary strip */}
      {summary && people.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-8 pb-8 border-b border-black/5">
          <span>
            {summary.peopleCount} {summary.peopleCount === 1 ? 'person' : 'people'}
          </span>
          <span className="text-neutral-200">·</span>
          <span>{summary.sourceCount} {summary.sourceCount === 1 ? 'source' : 'sources'}</span>
          {summary.lastSignalAt && (
            <>
              <span className="text-neutral-200">·</span>
              <span>Last signal {formatRelativeTime(summary.lastSignalAt)}</span>
            </>
          )}
        </div>
      )}

      {people.length === 0 ? (
        /* Empty state */
        <section className="text-center py-16">
          <p className="text-[17px] text-neutral-500 mb-2">
            Your circle is empty.
          </p>
          <p className="text-sm text-neutral-400 mb-8 max-w-xs mx-auto">
            Add one person whose taste you trust. Books appear only when they give five stars.
          </p>
          <Button size="lg" onClick={() => setShowAddModal(true)}>
            Add someone you trust
          </Button>
        </section>
      ) : (
        <div className="space-y-10">
          {/* Active people */}
          {activePeople.length > 0 && (
            <section>
              <div className="space-y-3">
                {activePeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onManage={() => setManagingPerson(person.id)}
                    onMute={() => handleMute(person.id, person.isMuted)}
                    onRemove={() => handleRemove(person.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Needs attention */}
          {warningPeople.length > 0 && (
            <section>
              <h2 className="text-xs text-amber-600 uppercase tracking-widest mb-4">
                Needs attention
              </h2>
              <div className="space-y-3">
                {warningPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onManage={() => setManagingPerson(person.id)}
                    onMute={() => handleMute(person.id, person.isMuted)}
                    onRemove={() => handleRemove(person.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Muted */}
          {mutedPeople.length > 0 && (
            <section>
              <h2 className="text-xs text-neutral-400 uppercase tracking-widest mb-4">
                Muted
              </h2>
              <div className="space-y-3">
                {mutedPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onManage={() => setManagingPerson(person.id)}
                    onMute={() => handleMute(person.id, person.isMuted)}
                    onRemove={() => handleRemove(person.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paused */}
          {pausedPeople.length > 0 && (
            <section>
              <h2 className="text-xs text-neutral-400 uppercase tracking-widest mb-4">
                Paused
              </h2>
              <div className="space-y-3">
                {pausedPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onManage={() => setManagingPerson(person.id)}
                    onMute={() => handleMute(person.id, person.isMuted)}
                    onRemove={() => handleRemove(person.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Add action */}
          <section className="pt-4">
            <p className="text-xs text-neutral-400 mb-3">
              Add someone whose five-star reads you trust.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Add someone
            </Button>
          </section>
        </div>
      )}

      {/* Philosophy footer */}
      <footer className="mt-16 pt-8 border-t border-neutral-100">
        <div className="bg-neutral-50/50 rounded-xl p-5 text-center">
          <p className="text-sm text-neutral-400 mb-2">
            A small circle is a strong one.
          </p>
          <p className="text-xs text-neutral-300">
            Most people trust 3–7 sources. Quality over quantity.
          </p>
        </div>
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
                  <span className="font-normal text-neutral-400"> (optional)</span>
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
                  disabled={!sourceName.trim() || adding}
                  className="w-full"
                  size="lg"
                >
                  {adding ? 'Adding...' : `Add ${sourceName.trim() || 'person'}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Drawer */}
      {managingPerson && personDetails && (
        <ManageDrawer
          person={personDetails.person}
          sources={personDetails.sources}
          impact={personDetails.impact}
          onClose={() => setManagingPerson(null)}
          onRetrySource={handleRetrySource}
          onMute={() => handleMute(personDetails.person.id, personDetails.person.isMuted)}
          onRemove={() => handleRemove(personDetails.person.id)}
        />
      )}
    </div>
  );
}
