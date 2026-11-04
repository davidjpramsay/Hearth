import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  createReadStream,
  fsyncSync,
  mkdirSync,
  openSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import {
  FitnessLibraryExerciseSchema,
  type FitnessLibraryExercise,
  type FitnessLibraryCommand,
  type FitnessLibraryResult,
  type SaveFitnessLibraryExercise,
  type HouseholdSummary,
} from '@hearth/shared';
import { RepositoryError, type CommandActor } from './repository.js';
import { validateFitnessClip } from './fitness-media.js';
const storageLimit = 512 * 1024 * 1024;
export class FitnessLibraryService {
  private entries = new Map<string, FitnessLibraryExercise>();
  private receipts = new Map<string, { input_hash: string; result_json: string }>();
  private retired = new Set<string>();
  private media = new Map<string, Buffer>();
  constructor(
    private db?: Database.Database,
    private root?: string,
    private now = () => new Date(),
  ) {
    if (db && !root) throw new Error('Durable Fitness library needs its private media directory.');
    if (root) {
      mkdirSync(root, { recursive: true, mode: 0o700 });
      // Only generated files belonging to this store. Crashed writes/replacements are inaccessible.
      const referenced = new Set(
        this.all().flatMap((e) => (e.demonstration ? [e.demonstration.id] : [])),
      );
      for (const file of readdirSync(root)) {
        if (/^clip_[a-f0-9-]{36}\.mp4$/.test(file) && !referenced.has(file.slice(0, -4)))
          this.removeMedia(file.slice(0, -4));
      }
    }
  }
  private all(): FitnessLibraryExercise[] {
    return this.db
      ? (
          this.db.prepare('SELECT entry_json FROM fitness_exercise_library').all() as {
            entry_json: string;
          }[]
        ).map((r) => FitnessLibraryExerciseSchema.parse(JSON.parse(r.entry_json)))
      : [...this.entries.values()];
  }
  list(home: string): FitnessLibraryExercise[] {
    const rows = this.db
      ? (
          this.db
            .prepare('SELECT entry_json FROM fitness_exercise_library WHERE household_id=?')
            .all(home) as { entry_json: string }[]
        ).map((r) => FitnessLibraryExerciseSchema.parse(JSON.parse(r.entry_json)))
      : [...this.entries].filter(([k]) => JSON.parse(k)[0] === home).map(([, e]) => e);
    return structuredClone(
      rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    );
  }
  has(home: string, id: string): boolean {
    return this.list(home).some((e) => e.id === id);
  }
  change(
    home: HouseholdSummary,
    id: string,
    input: FitnessLibraryCommand | SaveFitnessLibraryExercise,
    actor: CommandActor,
    action: 'save' | 'upload' | 'remove-video' | 'archive',
    bytes?: Buffer,
  ): FitnessLibraryResult {
    const adult = home.members.find((m) => m.id === actor.id);
    if (
      actor.type !== 'member' ||
      actor.source !== 'companion' ||
      adult?.role !== 'adult' ||
      !adult.capabilities.includes('household.admin')
    )
      throw new RepositoryError('FORBIDDEN', 'An adult controller must edit the exercise library.');
    const hash = createHash('sha256')
      .update(JSON.stringify({ id, input, action }))
      .update(bytes ?? '')
      .digest('hex');
    const scope = `${actor.type}:${actor.id}`,
      key = JSON.stringify([home.id, scope, input.requestId]);
    let added: string | null = null,
      removed: string | null = null;
    const execute = (): FitnessLibraryResult => {
      const previous = this.db
        ? (this.db
            .prepare(
              'SELECT input_hash,result_json FROM fitness_library_receipts WHERE household_id=? AND actor_scope=? AND request_id=?',
            )
            .get(home.id, scope, input.requestId) as
            { input_hash: string; result_json: string } | undefined)
        : this.receipts.get(key);
      if (previous) {
        if (previous.input_hash !== hash)
          throw new RepositoryError(
            'CONFLICT',
            'That request identifier was used with different content.',
          );
        return { ...(JSON.parse(previous.result_json) as FitnessLibraryResult), replayed: true };
      }
      const entries = this.list(home.id),
        current = entries.find((e) => e.id === id);
      if ((current?.version ?? 0) !== input.expectedVersion)
        throw new RepositoryError(
          'CONFLICT',
          'This exercise changed. Reload the library before editing.',
        );
      const retiredKey = JSON.stringify([home.id, id]);
      if (
        !current &&
        (this.db
          ? this.db
              .prepare(
                'SELECT 1 FROM fitness_library_retired WHERE household_id=? AND exercise_id=?',
              )
              .get(home.id, id)
          : this.retired.has(retiredKey))
      )
        throw new RepositoryError(
          'CONFLICT',
          'This library entry was removed. Create a new exercise.',
        );
      if (!current && action !== 'save')
        throw new RepositoryError('NOT_FOUND', 'That library exercise is no longer available.');
      if (!current && entries.length >= 100)
        throw new RepositoryError(
          'VALIDATION_ERROR',
          'The library holds up to 100 exercises. Remove an unused exercise first.',
        );
      let entry: FitnessLibraryExercise | null = current ?? {
        id,
        name: '',
        instructions: '',
        version: 0,
        demonstration: null,
      };
      entry.version++;
      if (action === 'save') {
        const save = input as SaveFitnessLibraryExercise;
        entry.name = save.name;
        entry.instructions = save.instructions;
      } else if (action === 'upload') {
        if (!bytes) throw new RepositoryError('VALIDATION_ERROR', 'Choose an MP4 demonstration.');
        validateFitnessClip(bytes);
        const total =
          entries.reduce((sum, e) => sum + (e.demonstration?.byteLength ?? 0), 0) -
          (current?.demonstration?.byteLength ?? 0) +
          bytes.length;
        if (total > storageLimit)
          throw new RepositoryError(
            'VALIDATION_ERROR',
            'The exercise library is full. Remove an unused demonstration first.',
          );
        added = `clip_${randomUUID()}`;
        if (this.root) {
          writeFileSync(join(this.root, `${added}.mp4`), bytes, {
            mode: 0o600,
            flag: 'wx',
            flush: true,
          });
          const directory = openSync(this.root, 'r');
          try {
            fsyncSync(directory);
          } finally {
            closeSync(directory);
          }
        } else this.media.set(added, Buffer.from(bytes));
        removed = entry.demonstration?.id ?? null;
        entry.demonstration = { id: added, byteLength: bytes.length, mimeType: 'video/mp4' };
      } else {
        removed = entry.demonstration?.id ?? null;
        entry.demonstration = null;
        if (action === 'archive') entry = null;
      }
      if (entry) entry = FitnessLibraryExerciseSchema.parse(entry);
      const result: FitnessLibraryResult = { exercise: entry, replayed: false };
      if (this.db) {
        if (entry)
          this.db
            .prepare(
              'INSERT INTO fitness_exercise_library VALUES (?,?,?) ON CONFLICT(household_id,exercise_id) DO UPDATE SET entry_json=excluded.entry_json',
            )
            .run(home.id, id, JSON.stringify(entry));
        else {
          this.db
            .prepare('DELETE FROM fitness_exercise_library WHERE household_id=? AND exercise_id=?')
            .run(home.id, id);
          this.db.prepare('INSERT INTO fitness_library_retired VALUES (?,?)').run(home.id, id);
        }
        this.db
          .prepare('INSERT INTO fitness_library_receipts VALUES (?,?,?,?,?)')
          .run(home.id, scope, input.requestId, hash, JSON.stringify(result));
        this.db
          .prepare(
            "INSERT INTO audit_events(id,occurred_at,household_id,actor_type,actor_id,source_channel,action_type,target_type,target_id,request_id,result,safe_summary_json) VALUES (?,?,?,?,?,?,?,'fitness',?,?,'succeeded','{}')",
          )
          .run(
            `audit_${randomUUID()}`,
            this.now().toISOString(),
            home.id,
            actor.type,
            actor.id,
            actor.source,
            `fitness.library.${action}`,
            id,
            input.requestId,
          );
      } else {
        const entryKey = JSON.stringify([home.id, id]);
        if (entry) this.entries.set(entryKey, structuredClone(entry));
        else {
          this.entries.delete(entryKey);
          this.retired.add(entryKey);
        }
        this.receipts.set(key, { input_hash: hash, result_json: JSON.stringify(result) });
      }
      return result;
    };
    try {
      const result = this.db ? this.db.transaction(execute)() : execute();
      if (removed) this.removeMedia(removed);
      return structuredClone(result);
    } catch (error) {
      if (added) this.removeMedia(added);
      throw error;
    }
  }
  asset(home: string, id: string) {
    const asset = this.list(home).find((e) => e.demonstration?.id === id)?.demonstration;
    if (!asset)
      throw new RepositoryError('NOT_FOUND', 'This demonstration is no longer available.');
    return {
      ...asset,
      read: (start: number, end: number) =>
        this.root
          ? createReadStream(join(this.root, `${id}.mp4`), { start, end })
          : (this.media.get(id) ?? Buffer.alloc(0)).subarray(start, end + 1),
    };
  }
  private removeMedia(id: string) {
    if (this.root) {
      try {
        unlinkSync(join(this.root, `${id}.mp4`));
      } catch {
        /* Startup sweep retries inaccessible orphans. */
      }
    } else this.media.delete(id);
  }
  reset() {
    const assets = this.all().flatMap((e) => (e.demonstration ? [e.demonstration.id] : []));
    this.db?.exec(
      'DELETE FROM fitness_exercise_library; DELETE FROM fitness_library_receipts; DELETE FROM fitness_library_retired;',
    );
    this.entries.clear();
    this.receipts.clear();
    this.retired.clear();
    assets.forEach((id) => this.removeMedia(id));
  }
}
