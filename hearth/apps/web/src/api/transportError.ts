/** Carries retry classification without changing the family-facing message. */
export class HearthTransportError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'timeout' | 'http',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'HearthTransportError';
  }
}
