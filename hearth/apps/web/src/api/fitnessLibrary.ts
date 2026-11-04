import {
  FitnessLibrarySchema,
  FitnessLibraryResultSchema,
  type SaveFitnessLibraryExercise,
  type FitnessLibraryCommand,
} from '@hearth/shared';
import { demoAdminHeaders, getHearthRuntime, householdApiBase, request } from './core';
const headers = () => (getHearthRuntime().mode === 'private' ? {} : demoAdminHeaders);
const base = () => `${householdApiBase()}/fitness/exercises`;
export const fitnessLibraryApi = {
  get: (signal?: AbortSignal) =>
    request(base(), FitnessLibrarySchema, { ...(signal ? { signal } : {}) }),
  save: (id: string, input: SaveFitnessLibraryExercise) =>
    request(`${base()}/${id}`, FitnessLibraryResultSchema, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(input),
    }),
  remove: (id: string, input: FitnessLibraryCommand, action: 'archive' | 'remove-video') =>
    request(`${base()}/${id}/${action}`, FitnessLibraryResultSchema, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(input),
    }),
  upload: (id: string, input: FitnessLibraryCommand, file: File) =>
    request(
      `${base()}/${id}/demonstration`,
      FitnessLibraryResultSchema,
      {
        method: 'PUT',
        headers: {
          ...headers(),
          'Content-Type': 'video/mp4',
          'X-Hearth-Request-Id': input.requestId,
          'X-Hearth-Exercise-Version': String(input.expectedVersion),
        },
        body: file,
      },
      120_000,
    ),
  video: (id: string) => `${householdApiBase()}/fitness/demonstrations/${id}`,
};
