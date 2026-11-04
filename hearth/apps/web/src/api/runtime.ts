import {
  PasskeyAuthStatusSchema,
  PasskeyCeremonyOptionsSchema,
  PasskeySessionSchema,
  PasskeySignOutResultSchema,
  type RecoveryPasskeyOptionsRequest,
  RuntimeContextSchema,
  type FirstUsePasskeyOptionsRequest,
} from '@hearth/shared';

import { API_BASE, request } from './core';

export const runtimeApi = {
  getRuntime: (signal?: AbortSignal) =>
    request(`${API_BASE}/runtime`, RuntimeContextSchema, { signal: signal ?? null }, 5_000),
  getAuthStatus: () => request(`${API_BASE}/auth/status`, PasskeyAuthStatusSchema),
  getFirstUseRegistrationOptions: (input: FirstUsePasskeyOptionsRequest) =>
    request(`${API_BASE}/auth/first-use/registration-options`, PasskeyCeremonyOptionsSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  verifyFirstUseRegistration: (ceremonyId: string, response: Record<string, unknown>) =>
    request(`${API_BASE}/auth/first-use/registration-verifications`, PasskeySessionSchema, {
      method: 'POST',
      body: JSON.stringify({ ceremonyId, response }),
    }),
  getAuthenticationOptions: () =>
    request(`${API_BASE}/auth/authentication-options`, PasskeyCeremonyOptionsSchema, {
      method: 'POST',
    }),
  verifyAuthentication: (ceremonyId: string, response: Record<string, unknown>) =>
    request(`${API_BASE}/auth/authentication-verifications`, PasskeySessionSchema, {
      method: 'POST',
      body: JSON.stringify({ ceremonyId, response }),
    }),
  signOut: () =>
    request(`${API_BASE}/auth/sign-outs`, PasskeySignOutResultSchema, { method: 'POST' }),
  getRecoveryRegistrationOptions: (input: RecoveryPasskeyOptionsRequest) =>
    request(`${API_BASE}/auth/recovery/registration-options`, PasskeyCeremonyOptionsSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  verifyRecoveryRegistration: (ceremonyId: string, response: Record<string, unknown>) =>
    request(`${API_BASE}/auth/recovery/registration-verifications`, PasskeySessionSchema, {
      method: 'POST',
      body: JSON.stringify({ ceremonyId, response }),
    }),
};
