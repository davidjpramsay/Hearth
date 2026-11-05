import {
  addLocalDays,
  calendarEventOverlapsRange,
  completeChore,
  ChoreDomainError,
  createMonthGrid,
  excuseChore,
  reassignChore,
  skipChore,
  sortByStart,
  undoChore,
} from '@hearth/core';
import type {
  ChoreCommandResult,
  ChoreOccurrenceChangeResult,
  ChoreOccurrenceDetail,
  ChoreOccurrenceHistoryEntry,
  ChoreList,
  ChoreOccurrence,
  ChoreSkipResult,
  DemoScenario,
  MonthSchedule,
  TodaySummary,
  WeatherForecast,
  WeekSchedule,
  ModuleFlags,
} from '@hearth/shared';

import {
  createDemoSeed,
  createDemoWeatherForecast,
  DEMO_HOUSEHOLD_ID,
  DEMO_LOCAL_DATE,
  DEMO_NOW,
  DEMO_TODAY_PHOTO,
  type DemoSeed,
} from './demo/seed.js';

export class RepositoryError extends Error {
  constructor(
    readonly code:
      | 'MODULE_DISABLED'
      | 'VALIDATION_ERROR'
      | 'UNAUTHENTICATED'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'FORBIDDEN'
      | 'COMMAND_FAILED'
      | 'INTEGRATION_UNAVAILABLE'
      | 'CONFIRMATION_REQUIRED'
      | 'AMBIGUOUS_TARGET'
      | 'DUPLICATE_ITEM'
      | 'STALE_SNAPSHOT',
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface HearthRepository {
  setModuleAvailability?(read: (householdId: string) => ModuleFlags): void;
  getToday(householdId: string, localDate: string): Promise<TodaySummary>;
  getWeather(householdId: string): Promise<WeatherForecast>;
  getWeek(householdId: string, startDate: string): Promise<WeekSchedule>;
  getMonth(householdId: string, month: string): Promise<MonthSchedule>;
  getChores(householdId: string, localDate: string): Promise<ChoreList>;
  getChoreOccurrenceDetail(
    householdId: string,
    occurrenceId: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceDetail>;
  complete(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    actor: CommandActor,
  ): Promise<ChoreCommandResult>;
  undo(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    completionId: string,
    actor: CommandActor,
  ): Promise<ChoreCommandResult>;
  skip(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreSkipResult>;
  excuse(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceChangeResult>;
  reassign(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    assigneeId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceChangeResult>;
  reset(): void;
  setScenario(scenario: DemoScenario): void;
}

export interface CommandActor {
  id: string;
  type: 'member' | 'device' | 'service';
  source: 'tv' | 'companion' | 'voice' | 'automation';
}

export const DEMO_TV_ACTOR: CommandActor = {
  id: 'device_living_room_tv',
  type: 'device',
  source: 'tv',
};

export class InMemoryHearthRepository implements HearthRepository {
  private seed: DemoSeed;
  private scenario: DemoScenario = 'healthy';
  private sequence = 10;
  private readonly receipts = new Map<string, ChoreCommandResult | ChoreOccurrenceChangeResult>();
  private readonly history = new Map<string, ChoreOccurrenceHistoryEntry[]>();

  constructor() {
    this.seed = createDemoSeed();
  }

  async getToday(householdId: string, localDate: string): Promise<TodaySummary> {
    this.assertHousehold(householdId);
    await this.applyLatency();
    const events = this.seed.events.filter((event) =>
      calendarEventOverlapsRange(event, localDate, localDate),
    );
    const isEmpty = this.scenario === 'empty';
    const isStale = this.scenario === 'stale';
    const isUnavailable = this.scenario === 'unavailable';
    const chores = this.seed.chores
      .filter((chore) => chore.localDate === localDate)
      .map((chore, index) => ({
        ...chore,
        locked: this.scenario === 'permission' && index === 0,
      }));

    return {
      household: this.seed.household,
      localDate,
      generatedAt: DEMO_NOW,
      displayTime: '7:42',
      displayDate: 'Monday, 3 August',
      weather: { temperatureCelsius: 16, condition: 'Clear', source: 'demo' },
      freshness: isStale || isUnavailable ? 'stale' : 'current',
      calendarRefreshing: isStale,
      statusMessage: isUnavailable ? 'Calendar is unavailable · Showing saved plans.' : null,
      calendars: this.seed.calendars,
      events: isEmpty
        ? []
        : sortByStart(events).filter((event) => event.id !== 'event_family_dinner_mon'),
      chores: isEmpty ? [] : chores,
      dinner: isEmpty ? null : 'Lemon chicken & roast vegetables',
      listSummary: isEmpty ? null : { name: 'Groceries', remainingCount: 6 },
      notice: isEmpty ? null : 'Bins go out tonight',
      photo: isEmpty ? null : DEMO_TODAY_PHOTO,
      dailyVerse: null,
      reminderSummary: null,
      sections: {
        dinner: true,
        listSummary: true,
        notice: true,
        photo: true,
        dailyVerse: false,
        reminders: true,
      },
      integrations: this.seed.integrations.map((integration) =>
        integration.kind === 'calendar' && (isStale || isUnavailable)
          ? {
              ...integration,
              status: isUnavailable ? 'unavailable' : 'stale',
              message: isUnavailable
                ? 'Calendar is unavailable. Saved events remain visible.'
                : 'Calendar last updated at 6:45.',
            }
          : integration,
      ),
    };
  }

  async getWeather(householdId: string): Promise<WeatherForecast> {
    this.assertHousehold(householdId);
    await this.applyLatency();
    const forecast = createDemoWeatherForecast();
    if (this.scenario === 'unavailable') {
      return {
        ...forecast,
        freshness: 'stale',
        statusMessage: 'Updated earlier · Trying again quietly.',
      };
    }
    if (this.scenario === 'empty') {
      return {
        ...forecast,
        current: null,
        hourly: [],
        daily: [],
        source: null,
        freshness: 'offline',
        statusMessage: 'Weather is not set up.',
      };
    }
    return forecast;
  }

  async getWeek(householdId: string, startDate: string): Promise<WeekSchedule> {
    this.assertHousehold(householdId);
    await this.applyLatency();
    const endDate = addLocalDays(startDate, 6);
    const events = this.seed.events.filter((event) =>
      calendarEventOverlapsRange(event, startDate, endDate),
    );
    return {
      householdId,
      startDate,
      endDate,
      displayRange: '3–9 August',
      freshness: this.scenario === 'stale' || this.scenario === 'unavailable' ? 'stale' : 'current',
      calendarRefreshing: this.scenario === 'stale',
      statusMessage:
        this.scenario === 'unavailable' ? 'Calendar is unavailable · Showing saved plans.' : null,
      days: this.seed.weekDays,
      calendars: this.seed.calendars,
      events: this.scenario === 'empty' ? [] : sortByStart(events),
    };
  }

  async getMonth(householdId: string, month: string): Promise<MonthSchedule> {
    this.assertHousehold(householdId);
    await this.applyLatency();
    const grid = createMonthGrid(month, DEMO_LOCAL_DATE);
    const events = this.seed.events.filter((event) =>
      calendarEventOverlapsRange(event, grid.startDate, grid.endDate),
    );
    return {
      householdId,
      month,
      gridStartDate: grid.startDate,
      gridEndDate: grid.endDate,
      displayMonth: monthName(month),
      displayYear: month.slice(0, 4),
      freshness: this.scenario === 'stale' || this.scenario === 'unavailable' ? 'stale' : 'current',
      calendarRefreshing: this.scenario === 'stale',
      statusMessage:
        this.scenario === 'unavailable' ? 'Calendar is unavailable · Showing saved plans.' : null,
      days: grid.days,
      calendars: this.seed.calendars,
      events: this.scenario === 'empty' ? [] : sortByStart(events),
    };
  }

  async getChores(householdId: string, localDate: string): Promise<ChoreList> {
    this.assertHousehold(householdId);
    await this.applyLatency();
    const occurrences =
      this.scenario === 'empty'
        ? []
        : this.seed.chores.filter((item) => item.localDate === localDate);
    const grouped = this.seed.household.members.map((member) => ({
      member,
      occurrences: occurrences
        .filter((occurrence) => occurrence.assignee.id === member.id)
        .map((occurrence, index) => ({
          ...occurrence,
          templateId: `template_${occurrence.id.replace('occurrence_', '')}`,
          locked: this.scenario === 'permission' && member.id === 'member_ezra' && index === 0,
        })),
    }));
    return {
      householdId,
      localDate,
      displayDate: 'Monday, 3 August',
      completedCount: occurrences.filter((item) => item.state === 'completed').length,
      totalCount: occurrences.length,
      groups: grouped,
    };
  }

  async getChoreOccurrenceDetail(
    householdId: string,
    occurrenceId: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceDetail> {
    this.assertHousehold(householdId);
    this.authorizeAdult(actor);
    const occurrence = this.seed.chores.find((item) => item.id === occurrenceId);
    if (occurrence === undefined)
      throw new RepositoryError('NOT_FOUND', 'That chore could not be found.');
    return {
      occurrence,
      description: null,
      history: this.history.get(occurrenceId) ?? [],
    };
  }

  async complete(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    actor: CommandActor,
  ): Promise<ChoreCommandResult> {
    this.assertHousehold(householdId);
    const receiptKey = `complete:${requestId}`;
    const receipt = this.receipts.get(receiptKey);
    if (receipt !== undefined) return { ...(receipt as ChoreCommandResult), replayed: true };
    this.failNextIfRequested();

    const occurrenceIndex = this.findOccurrenceIndex(occurrenceId);
    const occurrence = this.seed.chores[occurrenceIndex];
    if (occurrence === undefined)
      throw new RepositoryError('NOT_FOUND', 'That chore could not be found.');
    this.authorize(actor, occurrence, 'complete');
    try {
      const result = completeChore(
        this.withScenarioPermission(occurrence),
        this.createContext(requestId, actor),
      );
      this.seed.chores[occurrenceIndex] = result.occurrence;
      const response = {
        occurrence: result.occurrence,
        completionId: result.occurrence.completionId ?? 'completion_missing',
        audit: result.audit,
        replayed: false,
      } satisfies ChoreCommandResult;
      this.recordHistory(response.audit, actor);
      this.receipts.set(receiptKey, response);
      return response;
    } catch (error) {
      this.translateDomainError(error);
    }
  }

  async undo(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    completionId: string,
    actor: CommandActor,
  ): Promise<ChoreCommandResult> {
    this.assertHousehold(householdId);
    const receiptKey = `undo:${requestId}`;
    const receipt = this.receipts.get(receiptKey);
    if (receipt !== undefined) return { ...(receipt as ChoreCommandResult), replayed: true };
    this.failNextIfRequested();

    const occurrenceIndex = this.findOccurrenceIndex(occurrenceId);
    const occurrence = this.seed.chores[occurrenceIndex];
    if (occurrence === undefined)
      throw new RepositoryError('NOT_FOUND', 'That chore could not be found.');
    this.authorize(actor, occurrence, 'undo');
    try {
      const result = undoChore(
        this.withScenarioPermission(occurrence),
        completionId,
        this.createContext(requestId, actor),
      );
      this.seed.chores[occurrenceIndex] = result.occurrence;
      const response = {
        occurrence: result.occurrence,
        completionId,
        audit: result.audit,
        replayed: false,
      } satisfies ChoreCommandResult;
      this.recordHistory(response.audit, actor);
      this.receipts.set(receiptKey, response);
      return response;
    } catch (error) {
      this.translateDomainError(error);
    }
  }

  async skip(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreSkipResult> {
    this.assertHousehold(householdId);
    const receiptKey = `skip:${requestId}`;
    const receipt = this.receipts.get(receiptKey);
    if (receipt !== undefined) return { ...(receipt as ChoreSkipResult), replayed: true };
    this.failNextIfRequested();

    const occurrenceIndex = this.findOccurrenceIndex(occurrenceId);
    const occurrence = this.seed.chores[occurrenceIndex];
    if (occurrence === undefined)
      throw new RepositoryError('NOT_FOUND', 'That chore could not be found.');
    this.authorize(actor, occurrence, 'skip');
    try {
      const result = skipChore(
        this.withScenarioPermission(occurrence),
        reason,
        this.createContext(requestId, actor),
      );
      this.seed.chores[occurrenceIndex] = result.occurrence;
      const response = { ...result, replayed: false } satisfies ChoreSkipResult;
      this.recordHistory(response.audit, actor, reason);
      this.receipts.set(receiptKey, response);
      return response;
    } catch (error) {
      this.translateDomainError(error);
    }
  }

  async excuse(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceChangeResult> {
    return this.changeOccurrence(
      householdId,
      occurrenceId,
      requestId,
      actor,
      'excuse',
      reason,
      (item) => excuseChore(item, reason, this.createContext(requestId, actor)),
    );
  }

  async reassign(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    assigneeId: string,
    reason: string,
    actor: CommandActor,
  ): Promise<ChoreOccurrenceChangeResult> {
    const assignee = this.seed.household.members.find((member) => member.id === assigneeId);
    if (assignee === undefined)
      throw new RepositoryError('NOT_FOUND', 'That person was not found.');
    return this.changeOccurrence(
      householdId,
      occurrenceId,
      requestId,
      actor,
      'reassign',
      reason,
      (item) => reassignChore(item, assignee, reason, this.createContext(requestId, actor)),
    );
  }

  reset(): void {
    this.seed = createDemoSeed();
    this.scenario = 'healthy';
    this.sequence = 10;
    this.receipts.clear();
    this.history.clear();
  }

  setScenario(scenario: DemoScenario): void {
    this.scenario = scenario;
  }

  private assertHousehold(householdId: string): void {
    if (householdId !== DEMO_HOUSEHOLD_ID) {
      throw new RepositoryError('NOT_FOUND', 'That household could not be found.');
    }
  }

  private async applyLatency(): Promise<void> {
    if (this.scenario === 'loading') {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
  }

  private failNextIfRequested(): void {
    if (this.scenario === 'fail-next') {
      this.scenario = 'healthy';
      throw new RepositoryError('COMMAND_FAILED', 'Couldn’t mark this done.', true);
    }
  }

  private findOccurrenceIndex(occurrenceId: string): number {
    return this.seed.chores.findIndex((occurrence) => occurrence.id === occurrenceId);
  }

  private withScenarioPermission(occurrence: DemoSeed['chores'][number]) {
    return {
      ...occurrence,
      locked:
        occurrence.locked ||
        (this.scenario === 'permission' && occurrence.id === 'occurrence_school_bag'),
    };
  }

  private createContext(requestId: string, actor: CommandActor) {
    this.sequence += 1;
    return {
      actorId: actor.id,
      actorType: actor.type,
      source: actor.source,
      requestId,
      occurredAt: DEMO_NOW,
      completionId: `completion_demo_${this.sequence}`,
      auditId: `audit_demo_${this.sequence}`,
    };
  }

  private authorize(
    actor: CommandActor,
    occurrence: ChoreOccurrence,
    action: 'complete' | 'undo' | 'skip' | 'excuse' | 'reassign',
  ): void {
    if (actor.type === 'member') {
      if (actor.id === 'member_maya') return;
      if (
        actor.id === 'member_ezra' &&
        (action === 'complete' || action === 'undo') &&
        occurrence.assignee.id === actor.id
      ) {
        return;
      }
      throw new RepositoryError('FORBIDDEN', 'Ask an adult to change this.');
    }
    if (action !== 'complete' && action !== 'undo') {
      throw new RepositoryError('FORBIDDEN', 'Ask an adult to change this.');
    }
    if (
      (actor.type === 'device' && actor.id === DEMO_TV_ACTOR.id) ||
      (actor.type === 'service' && actor.id === 'service_home_assistant')
    ) {
      return;
    }
    throw new RepositoryError('UNAUTHENTICATED', 'This device is not paired with Hearth.');
  }

  private translateDomainError(error: unknown): never {
    if (error instanceof ChoreDomainError) {
      throw new RepositoryError(error.code, error.message);
    }
    throw error;
  }

  private authorizeAdult(actor: CommandActor): void {
    if (actor.type !== 'member' || actor.source !== 'companion' || actor.id !== 'member_maya') {
      throw new RepositoryError('FORBIDDEN', 'Only an adult can manage this chore.');
    }
  }

  private changeOccurrence(
    householdId: string,
    occurrenceId: string,
    requestId: string,
    actor: CommandActor,
    action: 'excuse' | 'reassign',
    reason: string,
    change: (occurrence: ChoreOccurrence) => {
      occurrence: ChoreOccurrence;
      audit: ChoreOccurrenceChangeResult['audit'];
    },
  ): ChoreOccurrenceChangeResult {
    this.assertHousehold(householdId);
    const receiptKey = `${action}:${requestId}`;
    const receipt = this.receipts.get(receiptKey);
    if (receipt !== undefined)
      return { ...(receipt as ChoreOccurrenceChangeResult), replayed: true };
    this.failNextIfRequested();
    const occurrenceIndex = this.findOccurrenceIndex(occurrenceId);
    const occurrence = this.seed.chores[occurrenceIndex];
    if (occurrence === undefined)
      throw new RepositoryError('NOT_FOUND', 'That chore could not be found.');
    this.authorize(actor, occurrence, action);
    try {
      const result = change(this.withScenarioPermission(occurrence));
      this.seed.chores[occurrenceIndex] = result.occurrence;
      const response = { ...result, replayed: false } satisfies ChoreOccurrenceChangeResult;
      this.recordHistory(response.audit, actor, reason);
      this.receipts.set(receiptKey, response);
      return response;
    } catch (error) {
      this.translateDomainError(error);
    }
  }

  private recordHistory(
    audit: ChoreOccurrenceChangeResult['audit'],
    actor: CommandActor,
    reason: string | null = null,
  ): void {
    const actionLabels: Record<ChoreOccurrenceHistoryEntry['action'], string> = {
      'chore.complete': 'Marked done',
      'chore.undo': 'Completion undone',
      'chore.skip': 'Skipped',
      'chore.excuse': 'Excused',
      'chore.reassign': 'Reassigned',
    };
    if (!(audit.action in actionLabels)) return;
    const entries = this.history.get(audit.targetId) ?? [];
    entries.unshift({
      id: audit.id,
      action: audit.action as ChoreOccurrenceHistoryEntry['action'],
      label: actionLabels[audit.action as ChoreOccurrenceHistoryEntry['action']],
      actorLabel:
        this.seed.household.members.find((member) => member.id === actor.id)?.displayName ??
        'Hearth',
      occurredAt: audit.occurredAt,
      reason,
    });
    this.history.set(audit.targetId, entries);
  }
}

function monthName(month: string): string {
  return new Intl.DateTimeFormat('en-AU', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00.000Z`),
  );
}

export { DEMO_HOUSEHOLD_ID, DEMO_LOCAL_DATE };
