import {
  ModuleCommandResultSchema,
  GameModuleCommandResultSchema,
  type GameModuleId,
  ModulesConfigurationSchema,
  type ModuleId,
  type UpdateModuleRequest,
} from '@hearth/shared';
import { demoAdminHeaders, householdApiBase, request } from './core';

export const modulesApi = {
  updateGame: (id: GameModuleId, input: UpdateModuleRequest) =>
    request(`${householdApiBase()}/game-modules/${id}`, GameModuleCommandResultSchema, {
      method: 'PUT',
      cache: 'no-store',
      headers: demoAdminHeaders,
      body: JSON.stringify(input),
    }),
  get: (signal?: AbortSignal) =>
    request(`${householdApiBase()}/modules`, ModulesConfigurationSchema, {
      cache: 'no-store',
      ...(signal ? { signal } : {}),
    }),
  update: (id: ModuleId, input: UpdateModuleRequest) =>
    request(`${householdApiBase()}/modules/${id}`, ModuleCommandResultSchema, {
      method: 'PUT',
      cache: 'no-store',
      headers: demoAdminHeaders,
      body: JSON.stringify(input),
    }),
};
