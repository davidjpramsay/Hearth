import { HearthTransportError } from './transportError';

export const REQUEST_TIMEOUT_MS = 10_000;

/** Bound headers and body reads without requiring newer television AbortSignal APIs. */
export async function withRequestDeadline<T>(
  init: RequestInit | undefined,
  run: (init: RequestInit) => Promise<T>,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(init?.signal?.reason);
  if (init?.signal?.aborted) cancel();
  else init?.signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new HearthTransportError('Hearth is taking too long. Try again.', 'timeout'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([run({ ...init, signal: controller.signal }), deadline]);
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    if (timedOut)
      throw new HearthTransportError('Hearth is taking too long. Try again.', 'timeout');
    if (error instanceof TypeError)
      throw new HearthTransportError('Couldn’t reach Hearth. Try again.', 'network');
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener('abort', cancel);
  }
}
