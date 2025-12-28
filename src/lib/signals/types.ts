/**
 * Signal Types
 *
 * Signals are the core unit of recommendation in GreatReads.
 * Every signal has a type, a source person, and provenance metadata.
 *
 * CRITICAL RULE: Never use viewerId for copy. Show source person.
 */

export type SignalType =
  | 'top_10'        // From someone's curated Top 10 list
  | 'reflection'    // They wrote about it later
  | 'favorite'      // Marked as a favorite
  | 'five_star'     // Generic 5-star rating
  | 'import_five_star'  // 5-star from Goodreads import
  | 'rss_five_star';    // 5-star from RSS feed

export type SourceKind = 'person' | 'rss' | 'import';

export interface Signal {
  type: SignalType;
  sourcePersonId: string;
  sourcePersonName: string;
  sourceKind?: SourceKind;
  createdAt?: string;
  rating?: number;        // For star signals (usually 5)
  listName?: string;      // e.g., "Top 10"
  quote?: string;         // Optional reflection snippet
}

/**
 * Badge configuration for each signal type
 */
export const SIGNAL_BADGES: Record<SignalType, { icon: string; label: string }> = {
  top_10: { icon: '◆', label: 'Top 10' },
  reflection: { icon: '✎', label: 'Reflection' },
  favorite: { icon: '♥', label: 'Favorite' },
  five_star: { icon: '★', label: '5 stars' },
  import_five_star: { icon: '★', label: '5 stars' },
  rss_five_star: { icon: '★', label: '5 stars' },
};

/**
 * Format attribution text for a signal
 *
 * CRITICAL: Never use viewerId for display text.
 * The only exception is explicitly saying "You" when source === viewer.
 *
 * @param signal - The signal to format
 * @param viewerId - Optional viewer ID for "You" substitution
 * @param options - Formatting options
 */
export function formatAttribution(
  signal: Signal,
  viewerId?: string,
  options: { useYou?: boolean } = {}
): string {
  // Dev warning for missing provenance
  if (process.env.NODE_ENV === 'development') {
    if (!signal.sourcePersonId) {
      console.warn('Signal missing sourcePersonId', signal);
    }
    if (!signal.sourcePersonName) {
      console.warn('Signal missing sourcePersonName', signal);
    }
  }

  const { useYou = true } = options;

  // Determine display name: "You" if viewer is source, else source name
  const displayName =
    useYou && viewerId && signal.sourcePersonId === viewerId
      ? 'You'
      : signal.sourcePersonName || 'someone';

  // Check if this is the viewer's own signal
  const isOwnSignal = useYou && viewerId && signal.sourcePersonId === viewerId;

  // Format based on signal type
  switch (signal.type) {
    case 'top_10':
      // Special case: "Your Top 10" when viewing own signal
      return isOwnSignal ? 'Your Top 10' : `From ${displayName}'s Top 10`;

    case 'reflection':
      return isOwnSignal ? 'You wrote about this' : `${displayName} wrote about this`;

    case 'favorite':
      return isOwnSignal ? 'A favorite of yours' : `A favorite of ${displayName}`;

    case 'five_star':
    case 'import_five_star':
    case 'rss_five_star':
      return `★★★★★ from ${displayName}`;

    default:
      return `From ${displayName}`;
  }
}

/**
 * Get the badge for a signal type
 */
export function getSignalBadge(type: SignalType): { icon: string; label: string } {
  return SIGNAL_BADGES[type] || { icon: '★', label: 'Signal' };
}

/**
 * Assert that a signal has valid provenance
 * Throws in development, logs warning in production
 */
export function assertSignalProvenance(signal: Partial<Signal>, context?: string): void {
  const missing: string[] = [];

  if (!signal.sourcePersonId) missing.push('sourcePersonId');
  if (!signal.sourcePersonName) missing.push('sourcePersonName');
  if (!signal.type) missing.push('type');

  if (missing.length > 0) {
    const message = `Signal missing provenance: ${missing.join(', ')}${context ? ` (${context})` : ''}`;

    if (process.env.NODE_ENV === 'development') {
      console.error(message, signal);
      // Optionally throw in strict mode
      // throw new Error(message);
    } else {
      console.warn(message);
    }
  }
}
