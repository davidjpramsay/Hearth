import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  DEFAULT_GAME_MODULE_FLAGS,
  GAME_MODULE_LABELS,
  GameModuleCommandResultSchema,
  GameModuleIdSchema,
  type GameModuleCommandResult,
  type GameModuleFlags,
  type GameModuleId,
  type GameModulesConfiguration,
  type UpdateModuleRequest,
} from '@hearth/shared';
import { RepositoryError, type CommandActor } from './repository.js';

type Receipt = { inputHash: string; result: GameModuleCommandResult };

/** Availability only: callers must authenticate/authorize before reading or changing a home. */
export class GameModulesService {
  private readonly homes = new Map<string, GameModuleFlags>();
  private readonly receipts = new Map<string, Receipt>();
  constructor(
    private readonly database?: Database.Database,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get(householdId: string): GameModulesConfiguration {
    const enabled = { ...DEFAULT_GAME_MODULE_FLAGS, ...this.homes.get(householdId) };
    if (this.database) {
      for (const row of this.database
        .prepare('SELECT module_id,enabled FROM household_game_modules WHERE household_id = ?')
        .all(householdId) as { module_id: string; enabled: number }[]) {
        const id = GameModuleIdSchema.parse(row.module_id);
        enabled[id] = row.enabled === 1;
      }
    }
    return { householdId, enabled };
  }

  assertEnabled(householdId: string, module: GameModuleId): void {
    if (!this.get(householdId).enabled[module])
      throw new RepositoryError(
        'MODULE_DISABLED',
        `${GAME_MODULE_LABELS[module]} is turned off for this home.`,
      );
  }

  update(
    householdId: string,
    module: GameModuleId,
    input: UpdateModuleRequest,
    actor: CommandActor,
    actorScope = `${actor.type}:${actor.id}`,
  ): GameModuleCommandResult {
    const key = JSON.stringify([householdId, actorScope, input.requestId]);
    const inputHash = createHash('sha256')
      .update(JSON.stringify({ module, enabled: input.enabled }))
      .digest('hex');
    const stored = this.database
      ?.prepare(
        'SELECT input_hash,result_json FROM household_game_module_receipts WHERE household_id=? AND actor_scope=? AND request_id=?',
      )
      .get(householdId, actorScope, input.requestId) as
      { input_hash: string; result_json: string } | undefined;
    const previous = stored
      ? {
          inputHash: stored.input_hash,
          result: GameModuleCommandResultSchema.parse(JSON.parse(stored.result_json)),
        }
      : this.receipts.get(key);
    if (previous) {
      if (previous.inputHash !== inputHash)
        throw new RepositoryError(
          'CONFLICT',
          'That request identifier was already used with different content.',
        );
      return { ...structuredClone(previous.result), replayed: true };
    }
    if (actor.source === 'automation') {
      const cutoff = new Date(this.now().getTime() - 60_000).toISOString();
      const recent = this.database
        ? (
            this.database
              .prepare(
                'SELECT COUNT(*) AS count FROM household_game_module_receipts WHERE household_id=? AND actor_scope=? AND created_at>?',
              )
              .get(householdId, actorScope, cutoff) as { count: number }
          ).count
        : [...this.receipts.entries()].filter(
            ([receiptKey, receipt]) =>
              receiptKey.startsWith(JSON.stringify([householdId, actorScope]).slice(0, -1) + ',') &&
              receipt.result.audit.occurredAt > cutoff,
          ).length;
      if (recent >= 30)
        throw new RepositoryError(
          'CONFLICT',
          'Too many module changes. Wait a minute and try again.',
        );
    }
    const execute = (): GameModuleCommandResult => {
      const timestamp = this.now().toISOString();
      if (this.database) {
        this.database
          .prepare(
            `INSERT INTO household_game_modules(household_id,module_id,enabled,updated_at)
          VALUES (?,?,?,?) ON CONFLICT(household_id,module_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at`,
          )
          .run(householdId, module, Number(input.enabled), timestamp);
      } else
        this.homes.set(householdId, { ...this.get(householdId).enabled, [module]: input.enabled });
      const result = GameModuleCommandResultSchema.parse({
        configuration: this.get(householdId),
        replayed: false,
        audit: {
          id: `audit_${randomUUID()}`,
          actorType: actor.type,
          actorId: actor.id,
          source: actor.source,
          action: 'game-module.update',
          targetId: `game_${module.toLowerCase()}`,
          occurredAt: timestamp,
          result: 'succeeded',
        },
      });
      if (this.database) {
        this.database
          .prepare(
            `INSERT INTO household_game_module_receipts(household_id,actor_scope,request_id,input_hash,result_json,created_at)
          VALUES (?,?,?,?,?,?)`,
          )
          .run(
            householdId,
            actorScope,
            input.requestId,
            inputHash,
            JSON.stringify(result),
            timestamp,
          );
        this.database
          .prepare(
            `INSERT INTO audit_events(id,occurred_at,household_id,actor_type,actor_id,source_channel,action_type,target_type,target_id,request_id,result,safe_summary_json)
          VALUES (?,?,?,?,?,?,'game-module.update','module',?,?,'succeeded',?)`,
          )
          .run(
            result.audit.id,
            timestamp,
            householdId,
            actor.type,
            actor.id,
            actor.source,
            result.audit.targetId,
            input.requestId,
            JSON.stringify({ module, enabled: input.enabled }),
          );
      } else this.receipts.set(key, { inputHash, result });
      return result;
    };
    return structuredClone(this.database ? this.database.transaction(execute)() : execute());
  }

  reset(): void {
    this.homes.clear();
    this.receipts.clear();
    this.database?.exec(
      'DELETE FROM household_game_module_receipts; DELETE FROM household_game_modules;',
    );
  }
}
