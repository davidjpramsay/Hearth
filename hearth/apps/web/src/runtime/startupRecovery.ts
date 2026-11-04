import { HearthApiError } from '../api/core';
import { HearthTransportError } from '../api/transportError';

// Only the read-only startup query opts in. Three bounded requests, then manual Retry.
export function retryStartupRead(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof HearthTransportError && error.kind !== 'http') return true;
  const status =
    error instanceof HearthApiError || error instanceof HearthTransportError
      ? error.status
      : undefined;
  return status !== undefined && [408, 429, 500, 502, 503, 504].includes(status);
}

export const startupRetryDelay = (attempt: number) => (attempt === 0 ? 2_000 : 4_000);
