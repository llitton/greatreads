/**
 * Source Management Utilities
 *
 * Exports:
 * - State machine types and transitions
 * - Error/warning copy for UI
 * - Backoff and retry logic
 */

// Types and state machine
export {
  type SourceStatus,
  type SourceErrorCode,
  type SourceWarningCode,
  type SourceType,
  type SourceState,
  SOURCE_VALIDATION_TIMEOUT_MS,
  SOURCE_RETRY_BACKOFF_MS,
  SOURCE_MAX_RETRIES,
  isValidTransition,
  isTerminalStatus,
  getDisplayStatus,
  inferSourceType,
  mapDatabaseStatus,
} from './types';

// Error and warning copy
export {
  type ErrorCopy,
  type WarningCopy,
  ERROR_COPY,
  WARNING_COPY,
  getErrorCopy,
  getWarningCopy,
  getStatusBadgeText,
  getStatusBadgeVariant,
} from './errors';

// Backoff and retry logic
export {
  type AttemptOutcome,
  type SourceUpdate,
  computeRetryMinutes,
  withJitter,
  addMinutes,
  applyOutcomeToSource,
  isDueForCheck,
  formatNextRetry,
  MAX_BACKOFF_LEVEL,
  DEFAULT_CHECK_INTERVAL_MINUTES,
} from './backoff';
