import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  addLocalDays,
  localDateInTimezone,
  startOfLocalWeek,
  fitnessPlanForDate,
  fitnessWorkouts,
  fitnessStreak,
} from '@hearth/core';
import {
  AuditSummarySchema,
  FitnessPlanVersionSchema,
  FitnessSettingsSchema,
  FitnessSettingsResultSchema,
  FitnessOverviewSchema,
  FitnessCompletionResultSchema,
  type FitnessPlanVersion,
  type FitnessProgress,
  type FitnessSettings,
  type UpdateFitnessSettings,
  type FitnessSettingsResult,
  type SetFitnessCompletion,
  type FitnessCompletionResult,
  type HouseholdSummary,
  type AuditSummary,
} from '@hearth/shared';
import { RepositoryError, type CommandActor } from './repository.js';
type Result = FitnessSettingsResult | FitnessCompletionResult;

export class FitnessService {
  private readonly plans = new Map<string, FitnessPlanVersion[]>();
  private readonly progress = new Map<string, FitnessProgress[]>();
  private readonly receipts = new Map<string, { hash: string; result: Result }>();
  constructor(
    private readonly database?: Database.Database,
    private readonly now = () => new Date(),
  ) {}
  private date(home: HouseholdSummary) {
    return localDateInTimezone(this.now().toISOString(), home.timezone);
  }
  private versions(home: string): FitnessPlanVersion[] {
    if (!this.database) return structuredClone(this.plans.get(home) ?? []);
    return (
      this.database
        .prepare(
          'SELECT effective_from,revision,configuration_json FROM fitness_plans WHERE household_id=? ORDER BY effective_from',
        )
        .all(home) as { effective_from: string; revision: number; configuration_json: string }[]
    ).map((r) =>
      FitnessPlanVersionSchema.parse({
        effectiveFrom: r.effective_from,
        revision: r.revision,
        configuration: JSON.parse(r.configuration_json),
      }),
    );
  }
  private checks(home: string): FitnessProgress[] {
    if (!this.database) return structuredClone(this.progress.get(home) ?? []);
    return (
      this.database
        .prepare(
          'SELECT local_date,member_id,workout_id,completed,version FROM fitness_progress WHERE household_id=?',
        )
        .all(home) as {
        local_date: string;
        member_id: string;
        workout_id: string;
        completed: number;
        version: number;
      }[]
    ).map((r) => ({
      localDate: r.local_date,
      memberId: r.member_id,
      workoutId: r.workout_id,
      isCompleted: r.completed === 1,
      version: r.version,
    }));
  }
  getSettings(home: HouseholdSummary): FitnessSettings {
    const latest = this.versions(home.id).sort((a, b) => b.revision - a.revision)[0] ?? {
      revision: 0,
      effectiveFrom: this.date(home),
      configuration: { selectedMemberIds: [], plans: [] },
    };
    const people = new Set(home.members.map((p) => p.id));
    return FitnessSettingsSchema.parse({
      ...latest,
      localDate: this.date(home),
      people: home.members,
      configuration: {
        selectedMemberIds: latest.configuration.selectedMemberIds.filter((id) => people.has(id)),
        plans: latest.configuration.plans.filter((p) => people.has(p.memberId)),
      },
    });
  }
  overview(home: HouseholdSummary) {
    const localDate = this.date(home),
      weekStart = startOfLocalWeek(localDate);
    const plans = this.versions(home.id),
      checks = this.checks(home.id);
    const byCheck = new Map(
      checks.map((c) => [JSON.stringify([c.memberId, c.localDate, c.workoutId]), c]),
    );
    const dates = Array.from({ length: 7 }, (_, i) => addLocalDays(weekStart, i));
    const today = fitnessPlanForDate(plans, localDate);
    const selected = new Set(today?.configuration.selectedMemberIds ?? []);
    return FitnessOverviewSchema.parse({
      householdId: home.id,
      localDate,
      weekStart,
      timezone: home.timezone,
      generatedAt: this.now().toISOString(),
      people: home.members
        .filter((p) => selected.has(p.id))
        .map((person) => {
          const personal =
            today?.configuration.plans.find((p) => p.memberId === person.id) ??
            plans.at(-1)?.configuration.plans.find((p) => p.memberId === person.id);
          return {
            person,
            goals:
              personal?.goals.map((goal) => ({
                ...goal,
                routine: personal.workouts.filter((workout) => workout.goalId === goal.id),
              })) ?? [],
            weeklyFocus: personal?.weeklyFocus ?? '',
            streak: fitnessStreak(plans, checks, person.id, localDate),
            days: dates.map((date) => ({
              localDate: date,
              planRevision: fitnessPlanForDate(plans, date)?.revision ?? 0,
              sessions: fitnessWorkouts(plans, person.id, date).map((workout) => {
                const check = byCheck.get(JSON.stringify([person.id, date, workout.id]));
                const goal = fitnessPlanForDate(plans, date)
                  ?.configuration.plans.find((p) => p.memberId === person.id)
                  ?.goals.find((g) => g.id === workout.goalId);
                return {
                  workout,
                  goal: goal ? { id: goal.id, title: goal.title } : null,
                  isCompleted: check?.isCompleted ?? false,
                  version: check?.version ?? 0,
                };
              }),
            })),
          };
        }),
    });
  }
  update(
    home: HouseholdSummary,
    input: UpdateFitnessSettings,
    actor: CommandActor,
    libraryHas: (id: string) => boolean = () => false,
  ): FitnessSettingsResult {
    const member = home.members.find((p) => p.id === actor.id);
    if (
      actor.type !== 'member' ||
      member?.role !== 'adult' ||
      !member.capabilities.includes('household.admin')
    )
      throw new RepositoryError('FORBIDDEN', 'An adult controller must edit Fitness.');
    return this.command(home.id, input, actor, 'fitness.settings.update', () => {
      const current = this.getSettings(home);
      if (input.expectedRevision !== current.revision)
        throw new RepositoryError(
          'CONFLICT',
          'Fitness changed on another device. Load the latest settings before saving.',
        );
      if (input.configuration.plans.some((p) => !home.members.some((m) => m.id === p.memberId)))
        throw new RepositoryError('VALIDATION_ERROR', 'Choose people from this home.');
      const previousLinks = new Set(
        current.configuration.plans.flatMap((p) =>
          p.workouts.flatMap((w) =>
            w.exercises.map((e) => JSON.stringify([p.memberId, w.id, e.id, e.libraryExerciseId])),
          ),
        ),
      );
      for (const p of input.configuration.plans)
        for (const w of p.workouts)
          for (const e of w.exercises) {
            if (
              e.libraryExerciseId &&
              !libraryHas(e.libraryExerciseId) &&
              !previousLinks.has(JSON.stringify([p.memberId, w.id, e.id, e.libraryExerciseId]))
            )
              throw new RepositoryError(
                'VALIDATION_ERROR',
                'Choose an exercise from this home’s library.',
              );
          }
      const effectiveFrom =
        current.revision === 0 ? this.date(home) : addLocalDays(this.date(home), 1);
      const saved = FitnessPlanVersionSchema.parse({
        revision: current.revision + 1,
        effectiveFrom,
        configuration: input.configuration,
      });
      if (this.database)
        this.database
          .prepare(
            'INSERT INTO fitness_plans VALUES (?,?,?,?) ON CONFLICT(household_id,effective_from) DO UPDATE SET revision=excluded.revision,configuration_json=excluded.configuration_json',
          )
          .run(home.id, effectiveFrom, saved.revision, JSON.stringify(saved.configuration));
      else
        this.plans.set(
          home.id,
          [...this.versions(home.id).filter((p) => p.effectiveFrom !== effectiveFrom), saved].sort(
            (a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom),
          ),
        );
      return FitnessSettingsResultSchema.parse({
        settings: this.getSettings(home),
        audit: this.audit(actor, 'fitness.settings.update', home.id),
        replayed: false,
      });
    }) as FitnessSettingsResult;
  }
  complete(
    home: HouseholdSummary,
    input: SetFitnessCompletion,
    actor: CommandActor,
  ): FitnessCompletionResult {
    if (
      actor.type !== 'device' &&
      (actor.type !== 'member' ||
        !home.members.some((p) => p.id === actor.id && p.capabilities.includes('household.view')))
    )
      throw new RepositoryError('FORBIDDEN', 'Use a connected Hearth screen or phone.');
    return this.command(home.id, input, actor, 'fitness.completion', () => {
      const today = this.date(home),
        plans = this.versions(home.id);
      if (input.localDate !== today)
        throw new RepositoryError('CONFLICT', 'Refresh Fitness before checking today’s workout.');
      if (fitnessPlanForDate(plans, today)?.revision !== input.planRevision)
        throw new RepositoryError(
          'CONFLICT',
          'The plan changed. Refresh before checking a workout.',
        );
      if (
        !home.members.some((p) => p.id === input.memberId) ||
        !fitnessWorkouts(plans, input.memberId, today).some((w) => w.id === input.workoutId)
      )
        throw new RepositoryError('NOT_FOUND', 'That workout is not scheduled for today.');
      const checks = this.checks(home.id);
      const matches = (c: FitnessProgress) =>
        c.memberId === input.memberId && c.localDate === today && c.workoutId === input.workoutId;
      const current = checks.find(matches);
      if ((current?.version ?? 0) !== input.expectedVersion)
        throw new RepositoryError(
          'CONFLICT',
          'That workout changed on another device. Refresh to see its latest check.',
        );
      const next = {
        localDate: today,
        memberId: input.memberId,
        workoutId: input.workoutId,
        isCompleted: input.isCompleted,
        version: input.expectedVersion + 1,
      };
      if (this.database)
        this.database
          .prepare(
            'INSERT INTO fitness_progress VALUES (?,?,?,?,?,?,?) ON CONFLICT(household_id,local_date,member_id,workout_id) DO UPDATE SET completed=excluded.completed,version=excluded.version,updated_at=excluded.updated_at',
          )
          .run(
            home.id,
            today,
            input.memberId,
            input.workoutId,
            Number(next.isCompleted),
            next.version,
            this.now().toISOString(),
          );
      else this.progress.set(home.id, [...checks.filter((c) => !matches(c)), next]);
      return FitnessCompletionResultSchema.parse({
        ...next,
        audit: this.audit(
          actor,
          input.isCompleted ? 'fitness.complete' : 'fitness.reopen',
          input.workoutId,
        ),
        replayed: false,
      });
    }) as FitnessCompletionResult;
  }
  private audit(
    actor: CommandActor,
    action: AuditSummary['action'],
    targetId: string,
  ): AuditSummary {
    return AuditSummarySchema.parse({
      id: `audit_${randomUUID()}`,
      actorType: actor.type,
      actorId: actor.id,
      source: actor.source,
      action,
      targetId,
      occurredAt: this.now().toISOString(),
      result: 'succeeded',
    });
  }

  private command(
    home: string,
    input: { requestId: string },
    actor: CommandActor,
    action: string,
    execute: () => Result,
  ): Result {
    const scope = `${actor.type}:${actor.id}`;
    const key = JSON.stringify([home, scope, input.requestId]);
    const hash = createHash('sha256').update(JSON.stringify({ action, input })).digest('hex');
    const run = () => {
      const row = this.database
        ?.prepare(
          'SELECT input_hash,result_json FROM fitness_receipts WHERE household_id=? AND actor_scope=? AND request_id=?',
        )
        .get(home, scope, input.requestId) as
        { input_hash: string; result_json: string } | undefined;
      const previous = row
        ? { hash: row.input_hash, result: JSON.parse(row.result_json) as Result }
        : this.receipts.get(key);
      if (previous) {
        if (previous.hash !== hash)
          throw new RepositoryError(
            'CONFLICT',
            'That request identifier was already used with different content.',
          );
        return { ...previous.result, replayed: true };
      }
      const result = execute();
      if (this.database) {
        this.database
          .prepare('INSERT INTO fitness_receipts VALUES (?,?,?,?,?)')
          .run(home, scope, input.requestId, hash, JSON.stringify(result));
        const audit = result.audit;
        this.database
          .prepare(
            "INSERT INTO audit_events(id,occurred_at,household_id,actor_type,actor_id,source_channel,action_type,target_type,target_id,request_id,result,safe_summary_json) VALUES (?,?,?,?,?,?,?,'fitness',?,?,'succeeded','{}')",
          )
          .run(
            audit.id,
            audit.occurredAt,
            home,
            actor.type,
            actor.id,
            actor.source,
            audit.action,
            audit.targetId,
            input.requestId,
          );
      } else this.receipts.set(key, { hash, result: structuredClone(result) });
      return result;
    };
    return structuredClone(this.database ? this.database.transaction(run)() : run());
  }

  reset(): void {
    this.plans.clear();
    this.progress.clear();
    this.receipts.clear();
    this.database?.exec(
      'DELETE FROM fitness_progress; DELETE FROM fitness_receipts; DELETE FROM fitness_plans;',
    );
  }
}
