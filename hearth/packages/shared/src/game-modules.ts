import { z } from 'zod';
import { AuditSummarySchema, OpaqueIdSchema } from './schemas.js';

export const GAME_MODULE_IDS = ['connections', 'connectFour', 'wordGuess'] as const;
export const GameModuleIdSchema = z.enum(GAME_MODULE_IDS);
export type GameModuleId = z.infer<typeof GameModuleIdSchema>;
export const GAME_MODULE_LABELS: Record<GameModuleId, string> = {
  connections: 'Connections',
  connectFour: 'Connect Four',
  wordGuess: 'Word Guess',
};
export const DEFAULT_GAME_MODULE_FLAGS = { connections: true, connectFour: true, wordGuess: true };
export const GameModuleFlagsSchema = z.object({
  connections: z.boolean(),
  connectFour: z.boolean(),
  wordGuess: z.boolean().default(true),
});
export type GameModuleFlags = z.infer<typeof GameModuleFlagsSchema>;
export const GameModulesConfigurationSchema = z.object({
  householdId: OpaqueIdSchema,
  enabled: GameModuleFlagsSchema,
});
export type GameModulesConfiguration = z.infer<typeof GameModulesConfigurationSchema>;
export const GameModuleCommandResultSchema = z.object({
  configuration: GameModulesConfigurationSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export type GameModuleCommandResult = z.infer<typeof GameModuleCommandResultSchema>;

export function gameModuleForPath(path: string): GameModuleId | null {
  if (/^\/games\/connections(?:\/|$)/.test(path)) return 'connections';
  if (/^\/games\/connect-four(?:\/|$)/.test(path)) return 'connectFour';
  if (/^\/games\/word-guess(?:\/|$)/.test(path)) return 'wordGuess';
  return null;
}
