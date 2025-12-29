/**
 * SourceStatus State Machine
 *
 * Core rule: A source must always be in a terminal or recoverable state.
 * No state may rely on background work without a timeout and forced transition.
 *
 * State transitions:
 *
 *   draft
 *     ↓ submit
 *   checking (≤5s, time-boxed)
 *     ↓
 *   ┌───────────┬──────────┬──────────┐
 *   │ active    │ warning  │ error    │
 *   └───────────┴──────────┴──────────┘
 *
 * Hard guarantees:
 * 1. `checking` is time-boxed to 5 seconds max
 * 2. UI renders only terminal states (never polls checking indefinitely)
 * 3. Every error includes a machine-readable reason
 */

/**
 * Source status - the only allowed states
 */
export type SourceStatus =
  | 'draft'      // user has typed, not yet validated
  | 'checking'   // validation in progress (time-boxed to 5s)
  | 'active'     // valid + usable
  | 'warning'    // valid but degraded (empty feed, rate limited, etc.)
  | 'error'      // invalid, needs user action
  | 'paused';    // user-disabled

/**
 * Error codes - no generic errors, ever.
 * Each code maps to specific user copy and recovery action.
 */
export type SourceErrorCode =
  | 'INVALID_URL'     // Link doesn't look right
  | 'NOT_RSS'         // Page doesn't expose a readable feed
  | 'FETCH_FAILED'    // Site didn't respond
  | 'TIMEOUT'         // Validation took too long
  | 'NO_ITEMS'        // Feed exists but empty (this becomes 'warning' status)
  | 'RATE_LIMITED'    // Goodreads rate limit hit
  | 'UNAUTHORIZED'    // Feed isn't public
  | 'PARSE_ERROR';    // Feed exists but malformed

/**
 * Warning codes - degraded but usable states
 */
export type SourceWarningCode =
  | 'NO_RECENT_ITEMS'  // Connected, no recent 5-star books
  | 'RATE_LIMITED'     // Temporarily rate limited, auto-retry scheduled
  | 'STALE';           // Haven't been able to check recently

/**
 * State machine constants
 */
export const SOURCE_VALIDATION_TIMEOUT_MS = 5000; // 5 seconds max
export const SOURCE_RETRY_BACKOFF_MS = 60000; // 1 minute between retries
export const SOURCE_MAX_RETRIES = 3;

/**
 * State transition validator
 * Returns true if transition is allowed
 */
export function isValidTransition(from: SourceStatus, to: SourceStatus): boolean {
  const allowed: Record<SourceStatus, SourceStatus[]> = {
    draft: ['checking'],
    checking: ['active', 'warning', 'error'],  // Must resolve to terminal state
    active: ['warning', 'error', 'paused', 'checking'],  // Can re-check
    warning: ['active', 'error', 'paused', 'checking'],  // Can recover or degrade
    error: ['checking', 'paused'],  // Can retry or pause
    paused: ['checking'],  // Can resume
  };

  return allowed[from].includes(to);
}

/**
 * Type guard for checking if a status is terminal (safe to display)
 */
export function isTerminalStatus(status: SourceStatus): boolean {
  return status !== 'draft' && status !== 'checking';
}

/**
 * Get display status - forces terminal state if checking has timed out
 */
export function getDisplayStatus(
  status: SourceStatus,
  checkingStartedAt: Date | null
): SourceStatus {
  if (status !== 'checking') return status;

  if (!checkingStartedAt) return 'error';  // No start time = error

  const elapsed = Date.now() - checkingStartedAt.getTime();
  if (elapsed > SOURCE_VALIDATION_TIMEOUT_MS) {
    return 'error';  // Timed out = error
  }

  return 'checking';  // Still within timeout window
}

/**
 * Source type classification
 */
export type SourceType = 'goodreads' | 'rss' | 'newsletter';

/**
 * Infer source type from URL
 */
export function inferSourceType(url: string): SourceType {
  if (url.includes('goodreads.com')) return 'goodreads';
  if (url.includes('substack.com') || url.includes('buttondown.email')) return 'newsletter';
  return 'rss';
}

/**
 * Full source state for UI consumption
 */
export interface SourceState {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  status: SourceStatus;
  errorCode: SourceErrorCode | null;
  warningCode: SourceWarningCode | null;
  lastCheckedAt: Date | null;
  nextRetryAt: Date | null;
  itemCount: number;
  createdAt: Date;
}

/**
 * Map database status to state machine status
 * (Bridge between Prisma enum and our stricter state machine)
 */
export function mapDatabaseStatus(
  dbStatus: string,
  failureReasonCode: string | null
): { status: SourceStatus; errorCode: SourceErrorCode | null; warningCode: SourceWarningCode | null } {
  // Normalize failureReasonCode - 'NONE' means no error
  const normalizedErrorCode = failureReasonCode === 'NONE' ? null : failureReasonCode;

  switch (dbStatus) {
    case 'DRAFT':
      return { status: 'draft', errorCode: null, warningCode: null };
    case 'VALIDATING':
      return { status: 'checking', errorCode: null, warningCode: null };
    case 'ACTIVE':
      return { status: 'active', errorCode: null, warningCode: null };
    case 'PAUSED':
      return { status: 'paused', errorCode: null, warningCode: null };
    case 'BACKOFF':
      return {
        status: 'warning',
        errorCode: null,
        warningCode: 'RATE_LIMITED'
      };
    case 'FAILED':
      return {
        status: 'error',
        errorCode: (normalizedErrorCode as SourceErrorCode) || 'FETCH_FAILED',
        warningCode: null
      };
    default:
      return { status: 'error', errorCode: 'FETCH_FAILED', warningCode: null };
  }
}
