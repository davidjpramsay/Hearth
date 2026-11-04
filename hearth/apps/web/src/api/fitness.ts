import {
  FitnessOverviewSchema,
  FitnessSettingsSchema,
  FitnessSettingsResultSchema,
  FitnessCompletionResultSchema,
  type UpdateFitnessSettings,
  type SetFitnessCompletion,
} from '@hearth/shared';
import { demoAdminHeaders, getHearthRuntime, householdApiBase, request } from './core';
const headers = () => (getHearthRuntime().mode === 'private' ? {} : demoAdminHeaders);
export const fitnessApi = {
  get: (signal?: AbortSignal) =>
    request(`${householdApiBase()}/fitness`, FitnessOverviewSchema, {
      ...(signal ? { signal } : {}),
    }),
  settings: (signal?: AbortSignal) =>
    request(`${householdApiBase()}/fitness/settings`, FitnessSettingsSchema, {
      headers: headers(),
      ...(signal ? { signal } : {}),
    }),
  save: (input: UpdateFitnessSettings) =>
    request(`${householdApiBase()}/fitness/settings`, FitnessSettingsResultSchema, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(input),
    }),
  complete: (input: SetFitnessCompletion) =>
    request(`${householdApiBase()}/fitness/completion`, FitnessCompletionResultSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
};
