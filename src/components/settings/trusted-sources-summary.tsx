'use client';

import { useEffect, useState } from 'react';
import { StatusPill } from '@/components/ui/status-pill';

interface Source {
  id: string;
  title: string | null;
  url: string;
  status: 'ACTIVE' | 'VALIDATING' | 'BACKOFF' | 'FAILED' | 'PAUSED';
  failureReasonCode: string | null;
  lastSuccessAt: string | null;
}

type SourceStatus = 'connected' | 'pending' | 'error';

function getSourceStatus(source: Source): SourceStatus {
  if (source.status === 'ACTIVE') return 'connected';
  if (source.status === 'VALIDATING') return 'pending';
  return 'error';
}

function getSourceType(url: string): 'goodreads' | 'rss' {
  return url.includes('goodreads.com') ? 'goodreads' : 'rss';
}

function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const config = {
    connected: { label: 'Connected', variant: 'active' as const },
    pending: { label: 'Checking...', variant: 'default' as const },
    error: { label: 'Error', variant: 'danger' as const },
  };

  const { label, variant } = config[status];

  return <StatusPill variant={variant}>{label}</StatusPill>;
}

interface TrustedSourcesSummaryProps {
  onManage?: () => void;
  showExpanded?: boolean;
  className?: string;
}

export function TrustedSourcesSummary({
  onManage,
  showExpanded = false,
  className = '',
}: TrustedSourcesSummaryProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showExpanded);

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
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = sources.some((s) => getSourceStatus(s) === 'error');
  const errorCount = sources.filter((s) => getSourceStatus(s) === 'error').length;

  if (loading) {
    return (
      <div className={`text-sm text-neutral-400 ${className}`}>
        Loading sources...
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-neutral-500">
          No trusted sources yet.
        </p>
        {onManage && (
          <button
            onClick={onManage}
            className="text-sm text-[#1f1a17] hover:underline mt-2"
          >
            Add your first source →
          </button>
        )}
      </div>
    );
  }

  // Collapsed view: just show names
  if (!expanded) {
    const names = sources.map((s) => s.title || 'Untitled').join(', ');
    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-neutral-600">
              {names}
              <span className="text-neutral-400 ml-1">({sources.length})</span>
            </p>
            {hasErrors && (
              <StatusPill variant="danger">{errorCount} error{errorCount !== 1 ? 's' : ''}</StatusPill>
            )}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            View
          </button>
        </div>
      </div>
    );
  }

  // Expanded view: show full list with status
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-400">
          Trusted sources ({sources.length})
        </p>
        <div className="flex items-center gap-3">
          {onManage && (
            <button
              onClick={onManage}
              className="text-xs text-[#1f1a17] hover:underline"
            >
              Manage
            </button>
          )}
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sources.map((source) => {
          const status = getSourceStatus(source);
          const type = getSourceType(source.url);

          return (
            <div
              key={source.id}
              className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#1f1a17]">
                  {source.title || 'Untitled'}
                </span>
                <span className="text-xs text-neutral-400">
                  · {type === 'goodreads' ? 'Goodreads' : 'RSS'}
                </span>
              </div>
              <SourceStatusBadge status={status} />
            </div>
          );
        })}
      </div>

      {hasErrors && (
        <p className="text-xs text-amber-600 mt-3">
          Some sources have errors. Check "Incoming signals" to fix them.
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline version for headers
 */
export function TrustedSourcesInline({ className = '' }: { className?: string }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch {
      // Silently fail for inline display
    } finally {
      setLoading(false);
    }
  };

  if (loading || sources.length === 0) {
    return null;
  }

  const names = sources.slice(0, 3).map((s) => s.title || 'Untitled').join(', ');
  const remaining = sources.length - 3;

  return (
    <span className={`text-neutral-500 ${className}`}>
      {names}
      {remaining > 0 && ` +${remaining} more`}
    </span>
  );
}
