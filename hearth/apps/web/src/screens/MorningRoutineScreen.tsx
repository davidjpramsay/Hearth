import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { morningClock } from '@hearth/core';
import {
  MORNING_PROFILE_LABELS,
  type MorningOverview,
  type SetMorningCompletion,
} from '@hearth/shared';
import { routineApi } from '../api/morningRoutine';
import { choresApi } from '../api/chores';
import { createRequestId, getHearthRuntime, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { Icon } from '../components/Icon';
import { MorningRoutineVerse } from '../components/MorningRoutineVerse';
import { useModules } from '../modules/context';
import { FailureState, LoadingState } from '../components/Status';
import { useTodayViewportClass } from '../layout/todayRailCapacity';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './MorningRoutineScreen.css';

export function MorningRoutineScreen({ period = 'morning' }: { period?: 'morning' | 'afternoon' }) {
  const title = period === 'morning' ? 'Morning Routine' : 'Afternoon Routine';
  const online = useOnlineStatus();
  const query = useQuery({
    queryKey: period === 'morning' ? queryKeys.morningRoutine : queryKeys.afternoonRoutine,
    queryFn: ({ signal }) => routineApi(period).get(signal),
    retry: false,
    refetchInterval: 30_000,
  });
  if (!query.data && !online)
    return (
      <section className="state-panel" role="status">
        <h1>{title} is offline</h1>
        <p>Connect to Hearth to load the routine’s steps.</p>
        <button
          className="primary-action focusable"
          data-focus-id="morning-offline-retry"
          data-focus-entry="true"
          type="button"
          onClick={() => void query.refetch()}
        >
          Try again
        </button>
      </section>
    );
  if (!query.data)
    return query.isError ? <FailureState onRetry={() => void query.refetch()} /> : <LoadingState />;
  return (
    <MorningBoard
      period={period}
      data={query.data}
      receivedAt={query.dataUpdatedAt}
      stale={query.isError}
      refresh={query.refetch}
    />
  );
}

function MorningBoard({
  period,
  data,
  receivedAt,
  stale,
  refresh,
}: {
  period: 'morning' | 'afternoon';
  data: MorningOverview;
  receivedAt: number;
  stale: boolean;
  refresh: () => void;
}) {
  const title = period === 'morning' ? 'Morning Routine' : 'Afternoon Routine';
  const client = useQueryClient();
  const modules = useModules();
  const online = useOnlineStatus();
  const viewport = useTodayViewportClass();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const pending = useRef<
    | { kind: 'step'; input: SetMorningCompletion }
    | { kind: 'chore'; occurrenceId: string; completionId: string | null; requestId: string }
    | null
  >(null);
  const running = useRef(false);
  const [clockTick, setClockTick] = useState(() => Date.now());
  useEffect(() => {
    if (getHearthRuntime().mode !== 'private') return;
    const timer = window.setInterval(() => setClockTick(Date.now()), 1_000);
    const resume = () => setClockTick(Date.now());
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);
  const elapsed = getHearthRuntime().mode === 'private' ? Math.max(0, clockTick - receivedAt) : 0;
  const clock = morningClock(
    new Date(Date.parse(data.generatedAt) + elapsed).toISOString(),
    data.timezone,
    data.startTime,
    data.endTime,
    { scheduled: data.profileId !== null, countdownEnabled: data.countdownEnabled },
  );
  const oldDay = clock.localDate !== data.localDate;
  useEffect(() => {
    if (oldDay && online) void refresh();
  }, [oldDay, online, refresh]);
  const scheduledPeople =
    data.profileId === null
      ? []
      : data.people.map((person) => ({
          ...person,
          steps: person.steps.filter((step) => !step.choreTemplateId || modules.chores),
        }));
  const pages = Math.max(1, Math.ceil(scheduledPeople.length / 3));
  const activePage = Math.min(page, pages - 1);
  const people =
    viewport === 'companion'
      ? scheduledPeople
      : scheduledPeople.slice(activePage * 3, activePage * 3 + 3);
  const sevenStepLayout =
    viewport !== 'companion' &&
    people.some(
      ({ steps }) =>
        steps.length > 5 && steps.length <= 7 && steps.every((step) => step.title.length <= 40),
    );
  const embeddedHeader = sevenStepLayout && viewport !== 'full-tv';
  const total = scheduledPeople.reduce((sum, person) => sum + person.steps.length, 0);
  const done = scheduledPeople.reduce(
    (sum, person) => sum + person.steps.filter((step) => step.isCompleted).length,
    0,
  );
  const ready =
    total > 0 && done === total && !scheduledPeople.some((person) => person.steps.length === 0);
  const canCheck = data.profileId !== null && !oldDay && !stale && online && !busy && !hasPending;
  const needsRefresh = stale || oldDay || !online;
  const footerMessage =
    clock.phase === 'unscheduled'
      ? 'Your routines are saved for their scheduled days.'
      : ready
        ? 'All ready for a good day ✨'
        : total === 0
          ? 'A new routine begins with one small step.'
          : null;
  async function toggle(
    memberId?: string,
    step?: MorningOverview['people'][number]['steps'][number],
  ) {
    if (running.current) return;
    if (!pending.current && memberId && step)
      pending.current = step.chore
        ? { kind: 'chore', ...step.chore, requestId: createRequestId('routine_chore') }
        : {
            kind: 'step',
            input: {
              requestId: createRequestId('morning'),
              localDate: data.localDate,
              profileId: data.profileId!,
              memberId,
              stepId: step.id,
              settingsRevision: data.settingsRevision,
              expectedVersion: step.version,
              isCompleted: !step.isCompleted,
            },
          };
    if (!pending.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const intent = pending.current;
      if (intent.kind === 'step') await routineApi(period).complete(intent.input);
      else if (intent.completionId)
        await choresApi.undoChore(intent.occurrenceId, intent.requestId, intent.completionId);
      else await choresApi.completeChore(intent.occurrenceId, intent.requestId);
      pending.current = null;
      setNotice('Progress saved.');
      await client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === queryKeys.morningRoutine[0] &&
          [
            'morning-routine',
            'afternoon-routine',
            'chores',
            'today',
            'pocket-money',
            'activity',
          ].includes(String(query.queryKey[1])),
      });
    } catch (failure) {
      if (
        failure instanceof HearthApiError &&
        [
          'VALIDATION_ERROR',
          'CONFLICT',
          'NOT_FOUND',
          'FORBIDDEN',
          'UNAUTHENTICATED',
          'MODULE_DISABLED',
        ].includes(failure.payload.error.code)
      )
        pending.current = null;
      setError(failure instanceof Error ? failure.message : 'Could not save that check.');
    } finally {
      setHasPending(pending.current !== null);
      running.current = false;
      setBusy(false);
    }
  }
  const heading = (
    <header className="morning-header">
      <h1>{title}</h1>
      <span className="morning-day-label">
        {busy
          ? 'Saving…'
          : data.profileId
            ? MORNING_PROFILE_LABELS[data.profileId]
            : 'No routine today'}
      </span>
    </header>
  );
  return (
    <section className={`screen morning-screen${sevenStepLayout ? ' morning-screen--seven' : ''}`}>
      {embeddedHeader ? null : heading}
      <div className={needsRefresh || error ? 'morning-feedback' : 'sr-only'} aria-live="polite">
        {needsRefresh ? (
          <span>Showing saved progress. Refresh before ticking steps.</span>
        ) : error ? (
          <span role="alert">{error}</span>
        ) : (
          <span>
            {busy
              ? 'Saving your check…'
              : notice ||
                (ready
                  ? 'Everyone is ready. Great teamwork!'
                  : 'Your own pace. Any step can go first.')}
          </span>
        )}
        {needsRefresh || error ? (
          <button
            className="button focusable"
            onClick={() => (pending.current ? void toggle() : refresh())}
            disabled={busy}
            type="button"
          >
            {hasPending ? 'Retry check' : 'Refresh routine'}
          </button>
        ) : null}
      </div>
      <div className="morning-layout">
        <aside
          className={`morning-timer${!data.countdownEnabled || data.profileId === null ? ' morning-timer--untimed' : ''}`}
          aria-label={
            data.countdownEnabled && data.profileId !== null
              ? `${period === 'morning' ? 'Morning' : 'Afternoon'} countdown`
              : title
          }
        >
          {embeddedHeader ? (
            heading
          ) : (
            <div className="morning-timer__sun" aria-hidden="true">
              <Icon name="sun" />
            </div>
          )}
          <p className="morning-timer__caption">
            {clock.phase === 'unscheduled'
              ? 'A little breathing room'
              : clock.phase === 'untimed'
                ? 'At your own pace'
                : clock.phase === 'before'
                  ? `Starts ${friendlyTime(data.startTime)}`
                  : clock.phase === 'finished'
                    ? 'Time to go'
                    : 'Time to get ready'}
          </p>
          <strong className="morning-timer__time">
            {clock.phase === 'unscheduled'
              ? 'Rest day'
              : clock.phase === 'untimed'
                ? period === 'morning'
                  ? 'Good morning!'
                  : 'Welcome home!'
                : `${Math.floor(clock.remainingSeconds / 60)}:${String(clock.remainingSeconds % 60).padStart(2, '0')}`}
          </strong>
          {data.profileId !== null && data.countdownEnabled ? (
            <>
              <div
                className="morning-timer__track"
                role="progressbar"
                aria-label={`${period === 'morning' ? 'Morning' : 'Afternoon'} time remaining`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  clock.phase === 'unscheduled' ? 0 : Math.round((1 - clock.elapsedFraction) * 100)
                }
                aria-valuetext={
                  clock.phase === 'unscheduled'
                    ? 'Weekday routine resumes on Monday'
                    : `${Math.ceil(clock.remainingSeconds / 60)} minutes remaining`
                }
              >
                <div
                  className="morning-timer__fill"
                  style={{
                    transform: `scaleY(${clock.phase === 'unscheduled' ? 0 : 1 - clock.elapsedFraction})`,
                  }}
                />
                <span className="morning-timer__ticks" aria-hidden="true" />
              </div>
              <p className="morning-timer__end">
                Ready by <strong>{friendlyTime(data.endTime)}</strong>
              </p>
            </>
          ) : null}
        </aside>
        <div
          className="morning-people"
          style={{ '--morning-columns': Math.max(1, people.length) } as CSSProperties}
        >
          {people.length === 0 ? (
            <div className="morning-empty">
              <Icon name="sun" />
              <h2>{data.profileId === null ? 'No routine scheduled today' : 'A fresh start'}</h2>
              <p>
                {data.profileId === null
                  ? `Choose a routine for this day in ${title} settings on an adult phone.`
                  : `Choose your people and add their steps in ${title} settings on an adult phone.`}
              </p>
            </div>
          ) : (
            people.map(({ person, steps }, index) => (
              <MorningPerson
                key={`${data.profileId}:${person.id}:${data.localDate}`}
                period={period}
                person={person}
                steps={steps}
                entry={index === 0}
                railExit={viewport !== 'companion' && index === 0}
                canCheck={canCheck}
                busy={busy}
                capacity={
                  viewport === 'companion'
                    ? 12
                    : steps.some((step) => step.title.length > 40)
                      ? viewport === 'short-tv'
                        ? 1
                        : 2
                      : steps.length > 7
                        ? viewport === 'short-tv'
                          ? 4
                          : 5
                        : 7
                }
                onToggle={(step) => void toggle(person.id, step)}
              />
            ))
          )}
        </div>
      </div>
      <footer className="morning-footer">
        {footerMessage ? <span>{footerMessage}</span> : null}
        {modules.dailyVerse ? <MorningRoutineVerse period={period} /> : null}
        <Link
          className="button focusable"
          data-focus-id="morning-today"
          data-focus-entry={!canCheck || total === 0 ? 'true' : undefined}
          to="/today"
        >
          Today
        </Link>
        {viewport !== 'companion' && pages > 1 ? (
          <div className="morning-pager">
            <button
              className="button focusable"
              type="button"
              disabled={activePage === 0}
              onClick={() => setPage(activePage - 1)}
            >
              Previous people
            </button>
            <span>
              {activePage + 1} / {pages}
            </span>
            <button
              className="button focusable"
              type="button"
              disabled={activePage === pages - 1}
              onClick={() => setPage(activePage + 1)}
            >
              More people
            </button>
          </div>
        ) : null}
      </footer>
    </section>
  );
}

function MorningPerson({
  period,
  person,
  steps,
  entry,
  railExit,
  canCheck,
  busy,
  capacity,
  onToggle,
}: MorningOverview['people'][number] & {
  period: 'morning' | 'afternoon';
  entry: boolean;
  railExit: boolean;
  canCheck: boolean;
  busy: boolean;
  capacity: number;
  onToggle: (step: MorningOverview['people'][number]['steps'][number]) => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(steps.length / capacity));
  const activePage = Math.min(page, pages - 1);
  const completed = steps.filter((step) => step.isCompleted).length;
  const allDone = steps.length > 0 && completed === steps.length;
  return (
    <section
      className={`morning-person${allDone ? ' morning-person--ready' : ''}`}
      aria-label={`${person.displayName}’s ${period}`}
      style={{ '--person-color': person.color } as CSSProperties}
    >
      <header className="morning-person__header">
        <img src={person.avatarUrl} alt="" width={64} height={64} />
        <div>
          <h2>{person.displayName}</h2>
          <p>{allDone ? 'Ready to shine!' : `${completed} of ${steps.length} done`}</p>
        </div>
        <span className="morning-person__badge" aria-hidden="true">
          {allDone ? '★' : '☀'}
        </span>
      </header>
      <div className="morning-person__progress" aria-hidden="true">
        <span style={{ width: `${steps.length ? (completed / steps.length) * 100 : 0}%` }} />
      </div>
      {steps.length === 0 ? (
        <p className="morning-person__empty">An adult can add your steps from their phone.</p>
      ) : null}
      <ol className="morning-steps" start={activePage * capacity + 1}>
        {steps.slice(activePage * capacity, (activePage + 1) * capacity).map((step, index) => (
          <li key={step.id}>
            <button
              className={`morning-step focusable${step.isCompleted ? ' morning-step--done' : ''}`}
              type="button"
              aria-pressed={step.isCompleted}
              aria-label={`${person.displayName}: ${step.title}`}
              aria-disabled={!canCheck || step.chore?.locked === true}
              aria-busy={busy || undefined}
              onClick={() => {
                if (canCheck && !step.chore?.locked) onToggle(step);
              }}
              data-focus-entry={entry && index === 0 && canCheck ? 'true' : undefined}
              data-focus-id={`morning-${person.id}-${step.id}`}
              data-focus-left={railExit ? `nav-${period}` : undefined}
            >
              <span className="morning-step__number" aria-hidden="true">
                {activePage * capacity + index + 1}
              </span>
              <span>
                {step.title}
                {step.chore ? <small className="morning-step__chore">Chore</small> : null}
              </span>
              <span className="morning-step__check" aria-hidden="true">
                {step.isCompleted ? '✓' : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {pages > 1 ? (
        <div className="morning-pager">
          <button
            className="button focusable"
            type="button"
            aria-label={`Previous steps for ${person.displayName}`}
            disabled={activePage === 0}
            onClick={() => setPage(activePage - 1)}
          >
            Earlier
          </button>
          <span>
            {activePage + 1} / {pages}
          </span>
          <button
            className="button focusable"
            type="button"
            aria-label={`More steps for ${person.displayName}`}
            disabled={activePage === pages - 1}
            onClick={() => setPage(activePage + 1)}
          >
            More
          </button>
        </div>
      ) : null}
    </section>
  );
}

function friendlyTime(time: string) {
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12}${time.endsWith(':00') ? '' : time.slice(2)} ${hour >= 12 ? 'pm' : 'am'}`;
}
