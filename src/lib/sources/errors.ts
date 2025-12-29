/**
 * Source Error Copy
 *
 * No "something went wrong."
 * No technical jargon.
 * Each message answers: what happened + what to do next.
 */

import type { SourceErrorCode, SourceWarningCode, SourceStatus } from './types';

export interface ErrorCopy {
  title: string;
  body: string;
  action: string | null;
  showRetry: boolean;
}

export interface WarningCopy {
  title: string;
  body: string;
}

/**
 * Error copy for every failure mode
 */
export const ERROR_COPY: Record<SourceErrorCode, ErrorCopy> = {
  INVALID_URL: {
    title: "This link doesn't look right",
    body: "We couldn't recognize this as a Goodreads profile or feed.",
    action: "Try pasting a Goodreads profile page, or a Goodreads \"read\" shelf.",
    showRetry: false,
  },

  NOT_RSS: {
    title: "We couldn't find a feed here",
    body: "This page doesn't expose a readable feed, so we can't watch it for new books.",
    action: "If this is Goodreads, make sure you're linking to a profile or shelf — not a single book.",
    showRetry: false,
  },

  FETCH_FAILED: {
    title: "We couldn't reach this source",
    body: "The site didn't respond when we tried to check it.",
    action: "You can try again, or come back later.",
    showRetry: true,
  },

  TIMEOUT: {
    title: "This is taking too long",
    body: "We couldn't confirm this source in time.",
    action: "Try again, or use a different link.",
    showRetry: true,
  },

  NO_ITEMS: {
    // This typically becomes a warning, not an error
    title: "Connected — nothing to show yet",
    body: "We found the feed, but there are no recent five-star books.",
    action: null,
    showRetry: false,
  },

  RATE_LIMITED: {
    title: "Goodreads asked us to slow down",
    body: "We hit a temporary limit while checking this feed.",
    action: "We'll retry automatically later — no action needed.",
    showRetry: false,
  },

  UNAUTHORIZED: {
    title: "This feed isn't public",
    body: "We can't read this feed without permission.",
    action: "Make sure the profile or shelf is public on Goodreads.",
    showRetry: true,
  },

  PARSE_ERROR: {
    title: "We couldn't read this feed",
    body: "The feed exists, but we couldn't understand its format.",
    action: "Try a different link, or contact support if this keeps happening.",
    showRetry: true,
  },
};

/**
 * Warning copy for degraded states
 */
export const WARNING_COPY: Record<SourceWarningCode, WarningCopy> = {
  NO_RECENT_ITEMS: {
    title: "No recent five-star books",
    body: "Connected and working. We'll notify you when something appears.",
  },

  RATE_LIMITED: {
    title: "Temporarily limited",
    body: "We'll retry automatically in a few minutes.",
  },

  STALE: {
    title: "Needs a refresh",
    body: "We haven't been able to check this source recently.",
  },
};

/**
 * Get error copy by code
 */
export function getErrorCopy(code: SourceErrorCode): ErrorCopy {
  return ERROR_COPY[code] || ERROR_COPY.FETCH_FAILED;
}

/**
 * Get warning copy by code
 */
export function getWarningCopy(code: SourceWarningCode): WarningCopy {
  return WARNING_COPY[code] || WARNING_COPY.STALE;
}

/**
 * Status badge text for UI
 */
export function getStatusBadgeText(
  status: SourceStatus,
  warningCode?: SourceWarningCode | null
): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'warning':
      if (warningCode === 'NO_RECENT_ITEMS') return 'Waiting';
      if (warningCode === 'RATE_LIMITED') return 'Retrying soon';
      return 'Needs attention';
    case 'error':
      return 'Needs attention';
    case 'paused':
      return 'Paused';
    case 'checking':
      return 'Checking...';
    case 'draft':
      return 'Draft';
    default:
      return 'Unknown';
  }
}

/**
 * Status badge variant for StatusPill component
 * Maps to PillVariant: 'default' | 'new' | 'seen' | 'active' | 'muted' | 'danger'
 */
export function getStatusBadgeVariant(
  status: SourceStatus
): 'active' | 'new' | 'danger' | 'default' | 'muted' {
  switch (status) {
    case 'active':
      return 'active';
    case 'warning':
      return 'new';  // 'new' variant has amber styling, good for warnings
    case 'error':
      return 'danger';
    case 'paused':
      return 'muted';
    case 'checking':
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
}
