import { describe, expect, it } from 'vitest';
import { HearthTransportError } from '../api/transportError';
import { retryStartupRead, startupRetryDelay } from './startupRecovery';

describe('bounded read-only startup recovery', () => {
  it('retries connection failures and timeouts twice, with increasing delay', () => {
    for (const kind of ['network', 'timeout'] as const) {
      const error = new HearthTransportError('fixture', kind);
      expect(retryStartupRead(0, error)).toBe(true);
      expect(retryStartupRead(1, error)).toBe(true);
      expect(retryStartupRead(2, error)).toBe(false);
    }
    expect([startupRetryDelay(0), startupRetryDelay(1)]).toEqual([2000, 4000]);
  });
  it('retries temporary HTTP failures but not denied access or malformed data', () => {
    for (const code of [408, 429, 500, 502, 503, 504])
      expect(retryStartupRead(0, new HearthTransportError('fixture', 'http', code))).toBe(true);
    for (const code of [400, 401, 403, 404, 422])
      expect(retryStartupRead(0, new HearthTransportError('fixture', 'http', code))).toBe(false);
    expect(retryStartupRead(0, new SyntaxError('Invalid JSON'))).toBe(false);
    expect(retryStartupRead(0, new Error('invalid schema'))).toBe(false);
  });
});
