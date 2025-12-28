'use client';

import {
  Signal,
  SignalType,
  formatAttribution,
  getSignalBadge,
  assertSignalProvenance,
} from '@/lib/signals/types';

type AttributionVariant = 'default' | 'inline' | 'rail' | 'muted' | 'badge-only';

interface SignalAttributionProps {
  signal: Signal;
  viewerId?: string;
  variant?: AttributionVariant;
  showBadge?: boolean;
  showStars?: boolean;
  className?: string;
}

/**
 * SignalAttribution Component
 *
 * THE single source of truth for rendering signal attribution.
 *
 * CRITICAL RULES:
 * - Never use viewerId for display copy (except "You" substitution)
 * - Always show source person, never viewer
 * - All attribution copy flows through this component
 *
 * Variants:
 * - default: Full attribution with optional badge
 * - inline: Compact inline display
 * - rail: Tighter layout for right rail
 * - muted: Subtle/gray text
 * - badge-only: Just the badge icon
 */
export function SignalAttribution({
  signal,
  viewerId,
  variant = 'default',
  showBadge = true,
  showStars = false,
  className = '',
}: SignalAttributionProps) {
  // Assert provenance in development
  assertSignalProvenance(signal, 'SignalAttribution');

  const badge = getSignalBadge(signal.type);
  const text = formatAttribution(signal, viewerId);

  // Determine if this is a star-type signal
  const isStarSignal = ['five_star', 'import_five_star', 'rss_five_star'].includes(signal.type);

  // Variant-specific styling
  const variantStyles: Record<AttributionVariant, string> = {
    default: 'text-sm text-neutral-500',
    inline: 'text-xs text-neutral-400',
    rail: 'text-[11px] text-neutral-400',
    muted: 'text-xs text-neutral-300',
    'badge-only': 'text-sm',
  };

  if (variant === 'badge-only') {
    return (
      <span className={`${variantStyles[variant]} ${className}`} title={badge.label}>
        {badge.icon}
      </span>
    );
  }

  // For star signals with showStars, render with star display
  if (isStarSignal && showStars) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${className}`}>
        <span className="text-amber-400">★★★★★</span>
        <span>from {signal.sourcePersonName || 'someone'}</span>
      </span>
    );
  }

  // Default rendering
  return (
    <span className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${className}`}>
      {showBadge && (
        <span
          className={
            signal.type === 'top_10'
              ? 'text-[#1f1a17]'
              : signal.type === 'reflection'
                ? 'text-neutral-600'
                : signal.type === 'favorite'
                  ? 'text-rose-400'
                  : 'text-amber-400'
          }
        >
          {badge.icon}
        </span>
      )}
      <span>{text}</span>
    </span>
  );
}

/**
 * Helper to create a signal object from common props
 * Use this when you have scattered props and need to create a signal
 */
export function createSignal(props: {
  type: SignalType;
  sourcePersonId: string;
  sourcePersonName: string;
  sourceKind?: 'person' | 'rss' | 'import';
  rating?: number;
  quote?: string;
}): Signal {
  return {
    type: props.type,
    sourcePersonId: props.sourcePersonId,
    sourcePersonName: props.sourcePersonName,
    sourceKind: props.sourceKind,
    rating: props.rating,
    quote: props.quote,
  };
}

/**
 * SignalPill - A chip-style attribution for feed cards
 */
export function SignalPill({
  signal,
  viewerId,
  className = '',
}: {
  signal: Signal;
  viewerId?: string;
  className?: string;
}) {
  assertSignalProvenance(signal, 'SignalPill');

  const isStarSignal = ['five_star', 'import_five_star', 'rss_five_star'].includes(signal.type);
  const isOwnSignal = viewerId && signal.sourcePersonId === viewerId;
  const displayName =
    isOwnSignal ? 'You' : signal.sourcePersonName || 'someone';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium ${className}`}
    >
      {isStarSignal ? (
        <>
          <span className="text-amber-400">★★★★★</span>
          <span>from {displayName}</span>
        </>
      ) : signal.type === 'top_10' ? (
        <>
          <span className="text-[#1f1a17]">◆</span>
          <span>{isOwnSignal ? 'Your Top 10' : `${displayName}'s Top 10`}</span>
        </>
      ) : signal.type === 'reflection' ? (
        <>
          <span>✎</span>
          <span>{isOwnSignal ? 'You wrote about this' : `${displayName} wrote about this`}</span>
        </>
      ) : signal.type === 'favorite' ? (
        <>
          <span className="text-rose-400">♥</span>
          <span>{isOwnSignal ? 'A favorite of yours' : `A favorite of ${displayName}`}</span>
        </>
      ) : (
        <span>From {displayName}</span>
      )}
    </span>
  );
}
