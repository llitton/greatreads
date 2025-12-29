/**
 * Retry / Backoff Logic for Source Validation
 *
 * Provides:
 * - Fast retries for transient failures
 * - Slow retries for persistent failures
 * - Automatic recovery from "warning" states
 * - Hard cap so we don't DDOS Goodreads / archive.org / etc.
 */

import type { SourceErrorCode } from './types';

const BASE_RETRY_MIN = 2;        // First retry 2 minutes later
const MAX_RETRY_MIN = 24 * 60;   // Cap at 24 hours
const JITTER_PCT = 0.2;          // +/-20%

/**
 * Backoff ladder: exponential-ish with reasonable steps
 * 2, 5, 15, 30, 60, 180, 360, 720, 1440 minutes
 */
const BACKOFF_LADDER = [2, 5, 15, 30, 60, 180, 360, 720, 1440];

/**
 * Compute retry delay in minutes based on backoff level
 */
export function computeRetryMinutes(backoffLevel: number): number {
  const raw = BACKOFF_LADDER[Math.min(backoffLevel, BACKOFF_LADDER.length - 1)];
  return Math.min(raw, MAX_RETRY_MIN);
}

/**
 * Add jitter to prevent thundering herd
 */
export function withJitter(minutes: number): number {
  const jitter = minutes * JITTER_PCT;
  const delta = (Math.random() * 2 - 1) * jitter;
  return Math.max(1, Math.round(minutes + delta));
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Attempt outcome types
 */
export type AttemptOutcome =
  | { kind: 'success'; feedUrl: string; itemCount: number; lastItemAt?: Date }
  | { kind: 'no_items'; feedUrl: string }
  | { kind: 'fail'; errorCode: SourceErrorCode; httpStatus?: number; message?: string }
  | { kind: 'timeout' };

/**
 * Source update data to apply after an attempt
 */
export interface SourceUpdate {
  status: 'active' | 'warning' | 'error';
  feedUrl?: string;
  errorCode: SourceErrorCode | null;
  errorMessage: string | null;
  backoffLevel: number;
  lastSuccessAt?: Date;
  lastCheckedAt: Date;
  itemCount?: number;
  lastItemAt?: Date;
  nextCheckAt: Date;
}

/**
 * Apply outcome to source and compute new state
 */
export function applyOutcomeToSource(
  currentBackoffLevel: number,
  baseIntervalMinutes: number,
  outcome: AttemptOutcome,
  now = new Date()
): SourceUpdate {
  if (outcome.kind === 'success') {
    return {
      status: 'active',
      feedUrl: outcome.feedUrl,
      errorCode: null,
      errorMessage: null,
      backoffLevel: 0,
      lastSuccessAt: now,
      lastCheckedAt: now,
      itemCount: outcome.itemCount,
      lastItemAt: outcome.lastItemAt,
      nextCheckAt: addMinutes(now, baseIntervalMinutes),
    };
  }

  if (outcome.kind === 'no_items') {
    // Valid feed, just nothing to show. Keep it healthy.
    return {
      status: 'warning',
      feedUrl: outcome.feedUrl,
      errorCode: 'NO_ITEMS',
      errorMessage: null,
      backoffLevel: 0,
      lastCheckedAt: now,
      nextCheckAt: addMinutes(now, baseIntervalMinutes),
    };
  }

  // Failures: increment backoff
  const nextBackoff = Math.min(currentBackoffLevel + 1, 20);
  const retryMin = withJitter(computeRetryMinutes(nextBackoff));

  const errorCode: SourceErrorCode =
    outcome.kind === 'timeout' ? 'TIMEOUT' : outcome.errorCode;

  // Treat rate limit as WARNING (recoverable), not ERROR
  const status = errorCode === 'RATE_LIMITED' ? 'warning' : 'error';

  return {
    status,
    errorCode,
    errorMessage: outcome.kind === 'fail' ? (outcome.message ?? null) : null,
    backoffLevel: nextBackoff,
    lastCheckedAt: now,
    nextCheckAt: addMinutes(now, retryMin),
  };
}

/**
 * Check if a source is due for checking
 */
export function isDueForCheck(
  nextCheckAt: Date | null,
  status: string,
  now = new Date()
): boolean {
  // Never check paused sources
  if (status === 'PAUSED' || status === 'paused') return false;

  // If no next check scheduled, it's due
  if (!nextCheckAt) return true;

  // Check if we've passed the scheduled time
  return now >= nextCheckAt;
}

/**
 * Format next retry time for display
 */
export function formatNextRetry(nextCheckAt: Date | null): string | null {
  if (!nextCheckAt) return null;

  const now = Date.now();
  const then = nextCheckAt.getTime();
  const diffMs = then - now;

  if (diffMs <= 0) return 'Now';

  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `in ${diffMins}m`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `in ${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  return `in ${diffDays}d`;
}

/**
 * Maximum backoff level to prevent infinite escalation
 */
export const MAX_BACKOFF_LEVEL = 20;

/**
 * Default check interval for healthy sources (in minutes)
 */
export const DEFAULT_CHECK_INTERVAL_MINUTES = 60;
