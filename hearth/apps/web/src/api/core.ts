import {
  ApiErrorSchema,
  RuntimeContextSchema,
  type ApiError,
  type RuntimeContext,
} from '@hearth/shared';
import type { z } from 'zod';
import { withRequestDeadline } from './deadline';
import { HearthTransportError } from './transportError';

export const API_BASE = import.meta.env.VITE_HEARTH_API_BASE ?? '/api/v1';

let runtimeContext: RuntimeContext | null = null;

export class HearthApiError extends Error {
  constructor(
    readonly payload: ApiError,
    readonly status?: number,
  ) {
    super(payload.error.message);
    this.name = 'HearthApiError';
  }
}

export const demoAdminHeaders = { 'X-Hearth-Demo-Actor': 'member_maya' } as const;

export function configureHearthClient(runtime: RuntimeContext): void {
  runtimeContext = RuntimeContextSchema.parse(runtime);
}

export function clearHearthClient(): void {
  runtimeContext = null;
}

export function getHearthRuntime(): RuntimeContext {
  if (runtimeContext === null) {
    throw new Error('Hearth runtime has not been loaded.');
  }
  return runtimeContext;
}

export function householdId(runtime: RuntimeContext): string {
  if (runtime.household === null) {
    throw new Error('Hearth household setup is required.');
  }
  return runtime.household.id;
}

export function householdApiBase(): string {
  return `${API_BASE}/households/${householdId(getHearthRuntime())}`;
}

export function createRequestId(prefix: string): string {
  const randomUuid = globalThis.crypto.randomUUID;
  if (typeof randomUuid === 'function') {
    return `request_${prefix}_${randomUuid.call(globalThis.crypto).replaceAll('-', '_')}`;
  }
  const randomWords = globalThis.crypto.getRandomValues(new Uint32Array(4));
  const suffix = Array.from(randomWords, (word) => word.toString(16).padStart(8, '0')).join('_');
  return `request_${prefix}_${suffix}`;
}

export async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<T> {
  return withRequestDeadline(
    init,
    async (boundedInit) => {
      const response = await fetchResponse(url, boundedInit);
      return schema.parse(await response.json());
    },
    timeoutMs,
  );
}

export async function requestRaw(url: string, init?: RequestInit): Promise<Response> {
  return withRequestDeadline(init, (boundedInit) => fetchResponse(url, boundedInit));
}

async function fetchResponse(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = ApiErrorSchema.safeParse(body);
    if (parsed.success) throw new HearthApiError(parsed.data, response.status);
    throw new HearthTransportError(
      'Hearth could not complete that request.',
      'http',
      response.status,
    );
  }
  return response;
}
