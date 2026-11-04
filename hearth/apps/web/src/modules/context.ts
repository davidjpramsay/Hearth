import { createContext, useContext } from 'react';
import {
  DEFAULT_MODULE_FLAGS,
  DEFAULT_GAME_MODULE_FLAGS,
  gameModuleForPath,
  type GameModuleFlags,
  moduleForPath,
  normalizeModulePath,
  type ModuleFlags,
} from '@hearth/shared';

// Isolated component fixtures use the unchanged all-enabled product; the real app always loads
// ModulesProvider after household authentication, before mounting any feature.
export const ModulesContext = createContext<ModuleFlags>(DEFAULT_MODULE_FLAGS);
export const GameModulesContext = createContext<GameModuleFlags>(DEFAULT_GAME_MODULE_FLAGS);
export const useGameModules = () => useContext(GameModulesContext);
export const useModules = () => useContext(ModulesContext);
export function useModulePathAvailable(): (path: string) => boolean {
  const enabled = useModules();
  const games = useGameModules();
  return (path) => {
    const clean = normalizeModulePath(path);
    if (clean === '/admin/planning')
      return enabled.chores || enabled.meals || enabled.lists || enabled.morningRoutine;
    const game = gameModuleForPath(clean);
    if (game && !games[game]) return false;
    const module = moduleForPath(clean);
    return module === null || enabled[module];
  };
}
