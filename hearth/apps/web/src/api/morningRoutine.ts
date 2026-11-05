import {
  MorningOverviewSchema,
  MorningSettingsSchema,
  MorningSettingsResultSchema,
  MorningCompletionResultSchema,
  type UpdateMorningSettings,
  type UpdateMorningProfiles,
  type SetMorningCompletion,
} from '@hearth/shared';
import { demoAdminHeaders, getHearthRuntime, householdApiBase, request } from './core';
const headers = () => (getHearthRuntime().mode === 'private' ? {} : demoAdminHeaders);
export const routineApi = (period: 'morning' | 'afternoon') => ({
  get: (signal?: AbortSignal) =>
    request(`${householdApiBase()}/${period}-routine`, MorningOverviewSchema, {
      ...(signal ? { signal } : {}),
    }),
  settings: (signal?: AbortSignal) =>
    request(`${householdApiBase()}/${period}-routine/settings`, MorningSettingsSchema, {
      headers: headers(),
      ...(signal ? { signal } : {}),
    }),
  save: (input: UpdateMorningSettings | UpdateMorningProfiles) =>
    request(`${householdApiBase()}/${period}-routine/settings`, MorningSettingsResultSchema, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(input),
    }),
  complete: (input: SetMorningCompletion) =>
    request(`${householdApiBase()}/${period}-routine/completion`, MorningCompletionResultSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
});
export const morningRoutineApi = routineApi('morning');
