import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { localDateInTimezone, morningIsWeekday, morningProfileForDate } from '@hearth/core';
import {
  AuditSummarySchema,
  MorningConfigurationSchema,
  MorningProfilesSchema,
  defaultMorningProfiles,
  type MorningProfiles,
  type MorningProfileId,
  type MorningSettingsCommand,
  MorningSettingsSchema,
  MorningSettingsResultSchema,
  MorningOverviewSchema,
  MorningCompletionResultSchema,
  type HouseholdSummary,
  type MorningSettings,
  type MorningSettingsResult,
  type SetMorningCompletion,
  type MorningCompletionResult,
  type AuditSummary,
} from '@hearth/shared';
import { RepositoryError, type CommandActor } from './repository.js';

type Saved = { revision: number; profiles: MorningProfiles };
type Progress = { isCompleted: boolean; version: number };
type Result = MorningSettingsResult | MorningCompletionResult;

export class MorningRoutineService {
  private readonly settings = new Map<string, Saved>();
  private readonly progress = new Map<string, Progress>();
  private readonly receipts = new Map<string, { hash: string; result: Result }>();
  constructor(
    private readonly database?: Database.Database,
    private readonly now = () => new Date(),
    private readonly period: 'morning' | 'afternoon' = 'morning',
  ) {}

  private get label() {
    return this.period === 'morning' ? 'Morning Routine' : 'Afternoon Routine';
  }

  private table(kind: 'settings' | 'progress' | 'receipts') {
    return `${this.period}_routine_${kind}`;
  }

  getSettings(home: HouseholdSummary): MorningSettings {
    const row = this.database
      ?.prepare(
        `SELECT revision,configuration_json FROM ${this.table('settings')} WHERE household_id=?`,
      )
      .get(home.id) as { revision: number; configuration_json: string } | undefined;
    const decoded = row ? JSON.parse(row.configuration_json) : null;
    const profilesResult = MorningProfilesSchema.safeParse(decoded);
    const stored: Saved | undefined = row
      ? {
          revision: row.revision,
          profiles: profilesResult.success
            ? profilesResult.data
            : defaultMorningProfiles(MorningConfigurationSchema.parse(decoded)),
        }
      : this.settings.get(home.id);
    const children = home.members.filter((member) => member.role === 'child').slice(0, 20);
    const validPeople = new Set(home.members.map((person) => person.id));
    const profiles =
      stored?.profiles ??
      defaultMorningProfiles({
        startTime: '07:00',
        endTime: '08:00',
        selectedMemberIds: children.map((person) => person.id),
        routines: children.map((person) => ({ memberId: person.id, steps: [] })),
      });
    if (!stored && this.period === 'afternoon') {
      profiles.schoolDays.countdownEnabled = false;
      for (const profile of Object.values(profiles)) {
        profile.configuration.startTime = '15:00';
        profile.configuration.endTime = '17:00';
      }
      profiles.weekends.days = [];
    }
    const clean = (profile: MorningProfiles['schoolDays']) => ({
      ...profile,
      configuration: {
        ...profile.configuration,
        selectedMemberIds: profile.configuration.selectedMemberIds.filter((id) =>
          validPeople.has(id),
        ),
        routines: profile.configuration.routines.filter((routine) =>
          validPeople.has(routine.memberId),
        ),
      },
    });
    const current = { schoolDays: clean(profiles.schoolDays), weekends: clean(profiles.weekends) };
    return MorningSettingsSchema.parse({
      revision: stored?.revision ?? 0,
      configuration: current.schoolDays.configuration,
      profiles: current,
      people: home.members,
    });
  }

  overview(home: HouseholdSummary) {
    const settings = this.getSettings(home);
    const generatedAt = this.now().toISOString();
    const localDate = localDateInTimezone(generatedAt, home.timezone);
    const profileId = morningProfileForDate(localDate, settings.profiles);
    const profile = profileId === null ? null : settings.profiles[profileId];
    const configuration = profile?.configuration ?? settings.configuration;
    return MorningOverviewSchema.parse({
      householdId: home.id,
      generatedAt,
      timezone: home.timezone,
      localDate,
      isWeekday: morningIsWeekday(localDate),
      profileId,
      countdownEnabled: profile?.countdownEnabled ?? false,
      settingsRevision: settings.revision,
      startTime: configuration.startTime,
      endTime: configuration.endTime,
      people: (profile ? configuration.selectedMemberIds : []).map((id) => ({
        person: settings.people.find((person) => person.id === id)!,
        steps: configuration.routines
          .find((routine) => routine.memberId === id)!
          .steps.map((step) => ({
            ...step,
            ...this.readProgress(home.id, localDate, profileId!, id, step.id),
          })),
      })),
    });
  }

  update(
    home: HouseholdSummary,
    input: MorningSettingsCommand,
    actor: CommandActor,
    validateLinks: () => void = () => {},
  ): MorningSettingsResult {
    const member = home.members.find((person) => person.id === actor.id);
    if (
      actor.type !== 'member' ||
      member?.role !== 'adult' ||
      !member.capabilities.includes('household.admin')
    )
      throw new RepositoryError('FORBIDDEN', `An adult controller must edit ${this.label}.`);
    return this.command(home.id, input, actor, `${this.period}-routine.settings.update`, () => {
      const current = this.getSettings(home);
      if (input.expectedRevision !== current.revision)
        throw new RepositoryError(
          'CONFLICT',
          `${this.label} changed on another device. Load the latest settings before saving.`,
        );
      const profiles =
        'profiles' in input
          ? input.profiles
          : {
              ...current.profiles,
              schoolDays: { ...current.profiles.schoolDays, configuration: input.configuration },
            };
      if (
        Object.values(profiles).some((profile) =>
          profile.configuration.routines.some(
            (routine) => !home.members.some((person) => person.id === routine.memberId),
          ),
        )
      )
        throw new RepositoryError('VALIDATION_ERROR', 'Choose people from this home.');
      validateLinks();
      const saved = {
        revision: current.revision + 1,
        profiles: MorningProfilesSchema.parse(profiles),
      };
      if (this.database)
        this.database
          .prepare(
            `INSERT INTO ${this.table('settings')} VALUES (?,?,?) ON CONFLICT(household_id) DO UPDATE SET revision=excluded.revision,configuration_json=excluded.configuration_json`,
          )
          .run(home.id, saved.revision, JSON.stringify(saved.profiles));
      else this.settings.set(home.id, structuredClone(saved));
      return MorningSettingsResultSchema.parse({
        settings: this.getSettings(home),
        audit: this.audit(actor, `${this.period}-routine.settings.update`, home.id),
        replayed: false,
      });
    }) as MorningSettingsResult;
  }

  complete(
    home: HouseholdSummary,
    input: SetMorningCompletion,
    actor: CommandActor,
  ): MorningCompletionResult {
    if (
      actor.type !== 'device' &&
      (actor.type !== 'member' ||
        !home.members.some(
          (person) => person.id === actor.id && person.capabilities.includes('household.view'),
        ))
    )
      throw new RepositoryError('FORBIDDEN', 'Use a connected Hearth screen or phone.');
    return this.command(home.id, input, actor, `${this.period}-routine.completion`, () => {
      const today = localDateInTimezone(this.now().toISOString(), home.timezone);
      if (input.localDate !== today)
        throw new RepositoryError(
          'CONFLICT',
          `That ${this.period} has changed. Refresh to see today’s routine.`,
        );
      const settings = this.getSettings(home);
      const profileId = input.profileId ?? 'schoolDays';
      if (morningProfileForDate(today, settings.profiles) !== profileId)
        throw new RepositoryError(
          'CONFLICT',
          `That ${this.period} has changed. Refresh to see today’s routine.`,
        );
      const configuration = settings.profiles[profileId].configuration;
      if (settings.revision !== input.settingsRevision)
        throw new RepositoryError(
          'CONFLICT',
          'The routine was edited. Refresh before ticking a step.',
        );
      if (
        !configuration.selectedMemberIds.includes(input.memberId) ||
        !configuration.routines
          .find((routine) => routine.memberId === input.memberId)
          ?.steps.some((step) => step.id === input.stepId)
      )
        throw new RepositoryError(
          'NOT_FOUND',
          `That step is no longer in this ${this.period}’s routine.`,
        );
      const step = configuration.routines
        .find((routine) => routine.memberId === input.memberId)!
        .steps.find((item) => item.id === input.stepId)!;
      if (step.choreTemplateId)
        throw new RepositoryError('CONFLICT', 'Refresh this chore and use its shared check.');
      const current = this.readProgress(home.id, today, profileId, input.memberId, input.stepId);
      if (current.version !== input.expectedVersion)
        throw new RepositoryError(
          'CONFLICT',
          'That step changed on another device. Refresh to see its latest check.',
        );
      const next = { isCompleted: input.isCompleted, version: current.version + 1 };
      if (this.database)
        this.database
          .prepare(
            `INSERT INTO ${this.table('progress')} VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(household_id,local_date,profile_id,member_id,step_id) DO UPDATE SET completed=excluded.completed,version=excluded.version,updated_at=excluded.updated_at`,
          )
          .run(
            home.id,
            today,
            profileId,
            input.memberId,
            input.stepId,
            Number(next.isCompleted),
            next.version,
            this.now().toISOString(),
          );
      else
        this.progress.set(
          JSON.stringify([home.id, today, profileId, input.memberId, input.stepId]),
          next,
        );
      return MorningCompletionResultSchema.parse({
        ...next,
        profileId,
        localDate: today,
        memberId: input.memberId,
        stepId: input.stepId,
        audit: this.audit(
          actor,
          input.isCompleted ? `${this.period}-routine.complete` : `${this.period}-routine.reopen`,
          input.stepId,
        ),
        replayed: false,
      });
    }) as MorningCompletionResult;
  }

  private readProgress(
    home: string,
    date: string,
    profile: MorningProfileId,
    member: string,
    step: string,
  ): Progress {
    if (this.database) {
      const row = this.database
        .prepare(
          `SELECT completed,version FROM ${this.table('progress')} WHERE household_id=? AND local_date=? AND profile_id=? AND member_id=? AND step_id=?`,
        )
        .get(home, date, profile, member, step) as
        { completed: number; version: number } | undefined;
      return row
        ? { isCompleted: row.completed === 1, version: row.version }
        : { isCompleted: false, version: 0 };
    }
    return (
      this.progress.get(JSON.stringify([home, date, profile, member, step])) ?? {
        isCompleted: false,
        version: 0,
      }
    );
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
          `SELECT input_hash,result_json FROM ${this.table('receipts')} WHERE household_id=? AND actor_scope=? AND request_id=?`,
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
          .prepare(`INSERT INTO ${this.table('receipts')} VALUES (?,?,?,?,?)`)
          .run(home, scope, input.requestId, hash, JSON.stringify(result));
        const audit = result.audit;
        this.database
          .prepare(
            `INSERT INTO audit_events(id,occurred_at,household_id,actor_type,actor_id,source_channel,action_type,target_type,target_id,request_id,result,safe_summary_json) VALUES (?,?,?,?,?,?,?,'${this.period}-routine',?,?,'succeeded','{}')`,
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
    this.settings.clear();
    this.progress.clear();
    this.receipts.clear();
    this.database?.exec(
      `DELETE FROM ${this.table('progress')}; DELETE FROM ${this.table('receipts')}; DELETE FROM ${this.table('settings')};`,
    );
  }
}
