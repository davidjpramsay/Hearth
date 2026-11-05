import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  DEFAULT_MODULE_FLAGS,
  MODULE_LABELS,
  ModuleCommandResultSchema,
  ModuleIdSchema,
  type ModuleCommandResult,
  type ModuleFlags,
  type ModuleId,
  type ModulesConfiguration,
  type UpdateModuleRequest,
} from '@hearth/shared';
import { RepositoryError, type CommandActor } from './repository.js';
import { GameModulesService } from './game-modules-repository.js';

type Receipt = { inputHash: string; result: ModuleCommandResult };

/** Availability only: callers must authenticate/authorize before reading or changing a home. */
export class ModulesService {
  readonly games: GameModulesService;
  private readonly homes = new Map<string, ModuleFlags>();
  private readonly receipts = new Map<string, Receipt>();
  constructor(
    private readonly database?: Database.Database,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.games = new GameModulesService(database, now);
  }

  get(householdId: string): ModulesConfiguration {
    const enabled = { ...DEFAULT_MODULE_FLAGS, ...this.homes.get(householdId) };
    if (this.database) {
      for (const row of this.database
        .prepare('SELECT module_id,enabled FROM household_modules WHERE household_id = ?')
        .all(householdId) as { module_id: string; enabled: number }[]) {
        const id = ModuleIdSchema.parse(row.module_id);
        enabled[id] = row.enabled === 1;
      }
    }
    return { householdId, enabled, games: this.games.get(householdId).enabled };
  }

  assertEnabled(householdId: string, module: ModuleId): void {
    if (!this.get(householdId).enabled[module])
      throw new RepositoryError(
        'MODULE_DISABLED',
        `${MODULE_LABELS[module]} is turned off for this home.`,
      );
  }

  update(
    householdId: string,
    module: ModuleId,
    input: UpdateModuleRequest,
    actor: CommandActor,
    actorScope = `${actor.type}:${actor.id}`,
  ): ModuleCommandResult {
    const key = JSON.stringify([householdId, actorScope, input.requestId]);
    const inputHash = createHash('sha256')
      .update(JSON.stringify({ module, enabled: input.enabled }))
      .digest('hex');
    const stored = this.database
      ?.prepare(
        'SELECT input_hash,result_json FROM household_module_receipts WHERE household_id=? AND actor_scope=? AND request_id=?',
      )
      .get(householdId, actorScope, input.requestId) as
      { input_hash: string; result_json: string } | undefined;
    const previous = stored
      ? {
          inputHash: stored.input_hash,
          result: ModuleCommandResultSchema.parse(JSON.parse(stored.result_json)),
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
                'SELECT COUNT(*) AS count FROM household_module_receipts WHERE household_id=? AND actor_scope=? AND created_at>?',
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
    const execute = (): ModuleCommandResult => {
      const timestamp = this.now().toISOString();
      if (this.database) {
        this.database
          .prepare(
            `INSERT INTO household_modules(household_id,module_id,enabled,updated_at)
          VALUES (?,?,?,?) ON CONFLICT(household_id,module_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at`,
          )
          .run(householdId, module, Number(input.enabled), timestamp);
      } else
        this.homes.set(householdId, { ...this.get(householdId).enabled, [module]: input.enabled });
      const result = ModuleCommandResultSchema.parse({
        configuration: this.get(householdId),
        replayed: false,
        audit: {
          id: `audit_${randomUUID()}`,
          actorType: actor.type,
          actorId: actor.id,
          source: actor.source,
          action: 'module.update',
          targetId: `module_${module.toLowerCase()}`,
          occurredAt: timestamp,
          result: 'succeeded',
        },
      });
      if (this.database) {
        this.database
          .prepare(
            `INSERT INTO household_module_receipts(household_id,actor_scope,request_id,input_hash,result_json,created_at)
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
          VALUES (?,?,?,?,?,?,'module.update','module',?,?,'succeeded',?)`,
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
    this.games.reset();
    this.homes.clear();
    this.receipts.clear();
    this.database?.exec('DELETE FROM household_module_receipts; DELETE FROM household_modules;');
  }
}

/** Writer-preferred leases make a completed off command a boundary for in-flight feature I/O. */
export class ModuleRequestLeases {
  private readonly homes = new Map<
    string,
    {
      readers: number;
      writer: boolean;
      queue: Array<{ write: boolean; ready: (release: () => void) => void }>;
    }
  >();
  acquire(householdId: string, write: boolean): Promise<() => void> {
    const home = this.homes.get(householdId) ?? { readers: 0, writer: false, queue: [] };
    this.homes.set(householdId, home);
    return new Promise((ready) => {
      home.queue.push({ write, ready });
      this.drain(householdId);
    });
  }
  private drain(householdId: string): void {
    const home = this.homes.get(householdId);
    if (!home || home.writer) return;
    while (home.queue.length) {
      const next = home.queue[0]!;
      if (next.write && home.readers > 0) return;
      home.queue.shift();
      if (next.write) home.writer = true;
      else home.readers += 1;
      let released = false;
      next.ready(() => {
        if (released) return;
        released = true;
        if (next.write) home.writer = false;
        else home.readers -= 1;
        if (!home.writer && home.readers === 0 && home.queue.length === 0)
          this.homes.delete(householdId);
        else this.drain(householdId);
      });
      if (next.write) return;
    }
  }
}

export function moduleForApiRoute(route: string): ModuleId | null {
  const suffix = route.replace('/api/v1/households/:householdId/', '');
  if (/^(calendar-connection|week|month|events)(?:[/-]|$)/.test(suffix)) return 'calendar';
  if (/^weather(?:[/-]|$)/.test(suffix)) return 'weather';
  if (/^indoor-climate(?:[/-]|$)/.test(suffix)) return 'weather';
  if (/^reminders(?:[/-]|$)/.test(suffix)) return 'reminders';
  if (/^(chore-|pocket-money|members\/:memberId\/pocket-money|assist\/chore)/.test(suffix))
    return 'chores';
  if (/^(lists?|list-items|assist\/list-items)(?:[/-]|$)/.test(suffix)) return 'lists';
  if (/^(meal-|saved-meal)/.test(suffix)) return 'meals';
  if (/^(home(?:\/|$)|home-assistant-connection)/.test(suffix)) return 'home';
  if (/^photo/.test(suffix)) return 'photos';
  if (/^games(?:\/|$)/.test(suffix)) return 'games';
  if (/^nba(?:\/|$)/.test(suffix)) return 'nba';
  if (/^fitness(?:\/|$)/.test(suffix)) return 'fitness';
  if (/^morning-routine(?:\/|$)/.test(suffix)) return 'morningRoutine';
  if (/^daily-verse(?:\/|$)/.test(suffix)) return 'dailyVerse';
  if (/^notices(?:\/|$)/.test(suffix)) return 'notices';
  return null;
}
