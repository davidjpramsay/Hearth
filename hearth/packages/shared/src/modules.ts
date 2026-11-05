import { z } from 'zod';
import { GameModuleFlagsSchema, DEFAULT_GAME_MODULE_FLAGS } from './game-modules.js';
import { AuditSummarySchema, OpaqueIdSchema } from './schemas.js';

export const MODULE_IDS = [
  'calendar',
  'weather',
  'reminders',
  'chores',
  'lists',
  'meals',
  'home',
  'photos',
  'games',
  'notices',
  'dailyVerse',
  'nba',
  'morningRoutine',
  'afternoonRoutine',
  'fitness',
] as const;
export const ModuleIdSchema = z.enum(MODULE_IDS);
export type ModuleId = z.infer<typeof ModuleIdSchema>;
export const MODULE_LABELS: Record<ModuleId, string> = {
  calendar: 'Calendar',
  weather: 'Weather',
  reminders: 'Reminders',
  chores: 'Chores & pocket money',
  lists: 'Lists',
  meals: 'Meals',
  home: 'Home controls',
  photos: 'Photos',
  games: 'Games',
  notices: 'Notices',
  dailyVerse: 'Daily Bible verse',
  nba: 'NBA',
  morningRoutine: 'Morning Routine',
  afternoonRoutine: 'Afternoon Routine',
  fitness: 'Fitness',
};
export const DEFAULT_MODULE_FLAGS: Record<ModuleId, boolean> = {
  calendar: true,
  weather: true,
  reminders: true,
  chores: true,
  lists: true,
  meals: true,
  home: true,
  photos: true,
  games: true,
  notices: true,
  dailyVerse: true,
  nba: false,
  morningRoutine: false,
  afternoonRoutine: false,
  fitness: false,
};
export const ModuleFlagsSchema = z.object({
  calendar: z.boolean(),
  weather: z.boolean(),
  reminders: z.boolean(),
  chores: z.boolean(),
  lists: z.boolean(),
  meals: z.boolean(),
  home: z.boolean(),
  photos: z.boolean(),
  games: z.boolean(),
  notices: z.boolean(),
  dailyVerse: z.boolean(),
  nba: z.boolean().default(false),
  morningRoutine: z.boolean().default(false),
  afternoonRoutine: z.boolean().default(false),
  fitness: z.boolean().default(false),
});
export type ModuleFlags = z.infer<typeof ModuleFlagsSchema>;
export const ModulesConfigurationSchema = z.object({
  householdId: OpaqueIdSchema,
  enabled: ModuleFlagsSchema,
  games: GameModuleFlagsSchema.default(DEFAULT_GAME_MODULE_FLAGS),
});
export type ModulesConfiguration = z.infer<typeof ModulesConfigurationSchema>;
export const UpdateModuleRequestSchema = z
  .object({ requestId: OpaqueIdSchema, enabled: z.boolean() })
  .strict();
export type UpdateModuleRequest = z.infer<typeof UpdateModuleRequestSchema>;
export const ModuleCommandResultSchema = z.object({
  configuration: ModulesConfigurationSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export type ModuleCommandResult = z.infer<typeof ModuleCommandResultSchema>;

/** Feature ownership, not authorization. Admin authentication is enforced separately. */
export function normalizeModulePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    /* A malformed router path cannot name a feature. */
  }
  return decoded.toLowerCase().replace(/\/+$/, '') || '/';
}

export function moduleForPath(path: string): ModuleId | null {
  const clean = normalizeModulePath(path);
  if (/^\/(calendar(?:\/|$)|week(?:\/|$)|month(?:\/|$))/.test(clean)) return 'calendar';
  const roots: Array<[RegExp, ModuleId]> = [
    [/^\/(weather|admin\/connections\/(weather|indoor-sensors))(?:\/|$)/, 'weather'],
    [/^\/reminders(?:\/|$)/, 'reminders'],
    [/^\/(chores|admin\/(routines|chore-day|pocket-money|rewards))(?:\/|$)/, 'chores'],
    [/^\/(lists|admin\/lists)(?:\/|$)/, 'lists'],
    [/^\/(meals|admin\/meals)(?:\/|$)/, 'meals'],
    [/^\/home(?:\/|$)/, 'home'],
    [/^\/(photos|admin\/photos)(?:\/|$)/, 'photos'],
    [/^\/games(?:\/|$)/, 'games'],
    [/^\/(fitness|admin\/fitness)(?:\/|$)/, 'fitness'],
    [/^\/(nba|admin\/nba)(?:\/|$)/, 'nba'],
    [/^\/(morning-routine|admin\/morning-routine)(?:\/|$)/, 'morningRoutine'],
    [/^\/(afternoon-routine|admin\/afternoon-routine)(?:\/|$)/, 'afternoonRoutine'],
    [/^\/admin\/connections\/calendar(?:\/|$)/, 'calendar'],
  ];
  return roots.find(([pattern]) => pattern.test(clean))?.[1] ?? null;
}
