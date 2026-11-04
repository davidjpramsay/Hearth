import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { localDateInTimezone } from '@hearth/core';
import {
  FITNESS_ACTIVITY_LABELS,
  FITNESS_DAY_LABELS,
  FITNESS_DAYS,
  type FitnessOverview,
  type FitnessSession,
  type SetFitnessCompletion,
} from '@hearth/shared';
import { fitnessApi } from '../api/fitness';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { Icon } from '../components/Icon';
import { FailureState, LoadingState } from '../components/Status';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useHouseholdDateTime } from '../hooks/useHouseholdClock';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { fitnessDate, fitnessIcon, fitnessTarget } from './fitnessPresentation';
import './FitnessScreen.css';

export function FitnessScreen() {
  const query = useQuery({
    queryKey: queryKeys.fitness,
    queryFn: ({ signal }) => fitnessApi.get(signal),
    retry: false,
    refetchInterval: 30_000,
  });
  if (!query.data)
    return query.isError ? <FailureState onRetry={() => void query.refetch()} /> : <LoadingState />;
  return (
    <FitnessBoard data={query.data} stale={query.isError} refresh={() => void query.refetch()} />
  );
}
function FitnessBoard({
  data,
  stale,
  refresh,
}: {
  data: FitnessOverview;
  stale: boolean;
  refresh: () => void;
}) {
  const online = useOnlineStatus(),
    client = useQueryClient(),
    clock = useHouseholdDateTime();
  const [memberId, setMemberId] = useState(''),
    [dayDate, setDayDate] = useState(''),
    [page, setPage] = useState(0);
  const [opened, setOpened] = useState<string | null>(null),
    [goalsOpen, setGoalsOpen] = useState(false),
    [peopleOpen, setPeopleOpen] = useState(false);
  const [busy, setBusy] = useState(false),
    [hasPending, setHasPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState('');
  const pending = useRef<SetFitnessCompletion | null>(null),
    running = useRef(false);
  useUnsavedChanges(hasPending);
  const person = data.people.find((p) => p.person.id === memberId) ?? data.people[0];
  const day =
    person?.days.find((d) => d.localDate === dayDate) ??
    person?.days.find((d) => d.localDate === data.localDate) ??
    person?.days[0];
  const session = day?.sessions.find((s) => s.workout.id === opened);
  const oldDay = localDateInTimezone(clock.instant, data.timezone) !== data.localDate;
  const unavailable = !online || stale || oldDay;
  const canCheck = !unavailable && !busy && !hasPending && day?.localDate === data.localDate;
  const sessions = person?.days.flatMap((d) => d.sessions) ?? [],
    done = sessions.filter((s) => s.isCompleted).length;
  const pages = Math.max(1, Math.ceil((day?.sessions.length ?? 0) / 4)),
    activePage = Math.min(page, pages - 1);
  async function toggle(check?: FitnessSession) {
    if (running.current) return;
    if (!pending.current && check && day && person && canCheck)
      pending.current = {
        requestId: createRequestId('fitness'),
        localDate: day.localDate,
        memberId: person.person.id,
        workoutId: check.workout.id,
        planRevision: day.planRevision,
        expectedVersion: check.version,
        isCompleted: !check.isCompleted,
      };
    if (!pending.current) return;
    running.current = true;
    setBusy(true);
    setHasPending(true);
    setError(null);
    try {
      await fitnessApi.complete(pending.current);
      pending.current = null;
      setNotice('Workout saved.');
      await client.invalidateQueries({ queryKey: queryKeys.fitness });
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
      ) {
        pending.current = null;
        refresh();
      }
      setError(failure instanceof Error ? failure.message : 'Could not confirm that check.');
    } finally {
      setHasPending(pending.current !== null);
      running.current = false;
      setBusy(false);
    }
  }
  const feedback = (
    <FitnessFeedback
      error={error}
      unavailable={unavailable}
      busy={busy}
      notice={notice}
      pending={hasPending}
      retry={() => (pending.current ? void toggle() : refresh())}
    />
  );
  return (
    <section className="screen fitness-screen">
      <header className="fitness-header">
        <div>
          <p className="eyebrow">Make time for you</p>
          <h1>Fitness</h1>
        </div>
        {person ? (
          <button
            type="button"
            className="fitness-person-picker focusable"
            data-focus-id="fitness-person"
            data-focus-entry="true"
            aria-haspopup="dialog"
            aria-label={`Fitness for ${person.person.displayName}`}
            onClick={() => setPeopleOpen(true)}
          >
            {person.person.displayName}
            <Icon name="chevron-right" />
          </button>
        ) : null}
      </header>
      {!session && !goalsOpen && !peopleOpen ? feedback : null}
      {!person ? (
        <div className="fitness-empty">
          <Icon name="weights" />
          <h2>Your next chapter starts here</h2>
          <p>Choose people and build their weekly plans in Fitness settings on an adult phone.</p>
        </div>
      ) : (
        <>
          <div className="fitness-overview">
            <button
              type="button"
              className="fitness-goals focusable"
              data-focus-id="fitness-goals"
              onClick={() => setGoalsOpen(true)}
            >
              <span className="fitness-kicker">Long-term goals · {person.goals.length}</span>
              <strong>
                {person.goals
                  .filter((g) => !g.achieved)
                  .map((g) => g.title)
                  .join(' · ') ||
                  (person.goals.length ? 'Goals achieved!' : 'A goal to work towards')}
              </strong>
              <span>
                {person.goals.length
                  ? `View ${person.goals.length === 1 ? 'goal & routine' : `all ${person.goals.length} goals & routines`}`
                  : 'Set your goals on an adult phone'}{' '}
                <Icon name="chevron-right" />
              </span>
            </button>
            <div className="fitness-stat">
              <Icon name="star" />
              <strong>{person.streak.current}</strong>
              <span>day streak</span>
              <small>Best: {person.streak.best} scheduled days</small>
            </div>
            <div className="fitness-stat fitness-stat--week">
              <span className="fitness-kicker">This week</span>
              <strong>
                {done}
                <span> / {sessions.length}</span>
              </strong>
              <span>sessions done</span>
              <progress
                aria-label="Weekly workouts completed"
                max={sessions.length || 1}
                value={done}
              />
            </div>
          </div>
          {person.weeklyFocus ? (
            <p className="fitness-focus" title={person.weeklyFocus}>
              {person.weeklyFocus}
            </p>
          ) : null}
          <div className="fitness-days" role="group" aria-label="Workout day">
            {person.days.map((d, i) => (
              <button
                key={d.localDate}
                type="button"
                className={`focusable${d.localDate === data.localDate ? ' fitness-day--today' : ''}`}
                aria-pressed={d.localDate === day?.localDate}
                aria-label={`${FITNESS_DAY_LABELS[i]}, ${fitnessDate(d.localDate)}, ${d.sessions.length} workouts`}
                onClick={() => {
                  setDayDate(d.localDate);
                  setPage(0);
                }}
                data-focus-id={`fitness-day-${i}`}
              >
                <span>{FITNESS_DAY_LABELS[i]!.slice(0, 3)}</span>
                <strong>{Number(d.localDate.slice(-2))}</strong>
                <small>
                  {d.sessions.length
                    ? `${d.sessions.filter((s) => s.isCompleted).length}/${d.sessions.length}`
                    : 'Rest'}
                </small>
              </button>
            ))}
          </div>
          <div className="fitness-session-heading">
            <h2>
              {day?.localDate === data.localDate
                ? 'Today'
                : FITNESS_DAY_LABELS[person.days.indexOf(day!)]}
            </h2>
            <span>{day ? fitnessDate(day.localDate) : ''}</span>
          </div>
          <div className="fitness-workouts">
            {!day?.sessions.length ? (
              <div className="fitness-rest">
                <Icon name="leaf" />
                <h3>A little room to recharge</h3>
                <p>No workouts planned. Rest days don’t break your streak.</p>
              </div>
            ) : (
              day.sessions.slice(activePage * 4, activePage * 4 + 4).map((s) => (
                <button
                  type="button"
                  key={s.workout.id}
                  className={`fitness-workout focusable fitness-workout--${s.workout.activity}${s.isCompleted ? ' fitness-workout--done' : ''}`}
                  data-focus-id={`fitness-workout-${s.workout.id}`}
                  onClick={() => setOpened(s.workout.id)}
                  aria-label={`${s.workout.title}, ${FITNESS_ACTIVITY_LABELS[s.workout.activity]}${s.isCompleted ? ', done' : ''}${s.goal ? `, Goal: ${s.goal.title}` : ''}`}
                >
                  <span className="fitness-activity-icon">
                    <Icon name={fitnessIcon(s.workout.activity)} />
                  </span>
                  <span className="fitness-workout__text">
                    <small className="fitness-workout-goal" title={s.goal?.title}>
                      {s.goal?.title ?? 'General fitness'}
                    </small>
                    <strong>{s.workout.title}</strong>
                    <span>
                      {FITNESS_ACTIVITY_LABELS[s.workout.activity]} ·{' '}
                      {fitnessTarget(s.workout) ||
                        (s.workout.exercises.length
                          ? `${s.workout.exercises.length} exercises`
                          : 'View plan')}
                    </span>
                  </span>
                  <Icon name={s.isCompleted ? 'check' : 'chevron-right'} />
                </button>
              ))
            )}
          </div>
          <footer className="fitness-footer">
            <span>Rest days count as rest. Keep showing up.</span>
            {pages > 1 ? (
              <div className="fitness-pager">
                <button
                  className="button focusable"
                  type="button"
                  disabled={activePage === 0}
                  onClick={() => setPage(activePage - 1)}
                >
                  Previous
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
                  More workouts
                </button>
              </div>
            ) : null}
          </footer>
          {session ? (
            <FitnessDialog title={session.workout.title} onClose={() => setOpened(null)}>
              <p className="fitness-detail-type">
                <Icon name={fitnessIcon(session.workout.activity)} />
                {FITNESS_ACTIVITY_LABELS[session.workout.activity]} · {fitnessDate(day!.localDate)}
                {fitnessTarget(session.workout) ? ` · ${fitnessTarget(session.workout)}` : ''}
              </p>
              <WorkoutDetails session={session} />
              {feedback}
              {day?.localDate !== data.localDate ? (
                <p className="fitness-detail-help">Checks are available on the scheduled day.</p>
              ) : null}
              <button
                className="button button--primary focusable fitness-complete"
                type="button"
                aria-pressed={session.isCompleted}
                aria-disabled={!canCheck}
                aria-busy={busy}
                onClick={() => {
                  if (canCheck) void toggle(session);
                }}
              >
                <Icon name="check" />
                {session.isCompleted ? 'Undo completed workout' : 'Mark workout done'}
              </button>
            </FitnessDialog>
          ) : null}
          {peopleOpen ? (
            <FitnessDialog title="Choose a person" onClose={() => setPeopleOpen(false)}>
              <FitnessScrollRegion label="People with fitness plans">
                <div className="fitness-people">
                  {data.people.map((p) => (
                    <button
                      type="button"
                      className="button focusable"
                      key={p.person.id}
                      aria-pressed={p.person.id === person.person.id}
                      onClick={() => {
                        setMemberId(p.person.id);
                        setPage(0);
                        setOpened(null);
                        setPeopleOpen(false);
                      }}
                    >
                      {p.person.displayName}
                    </button>
                  ))}
                </div>
              </FitnessScrollRegion>
            </FitnessDialog>
          ) : null}
          {goalsOpen ? (
            <FitnessDialog
              title={`${person.person.displayName}’s goals`}
              onClose={() => setGoalsOpen(false)}
            >
              <FitnessScrollRegion label="Long-term goals">
                {person.goals.length ? (
                  <ul className="fitness-goal-list">
                    {person.goals.map((g) => (
                      <li key={g.id}>
                        <Icon name={g.achieved ? 'check' : 'star'} />
                        <div>
                          <h3>{g.title}</h3>
                          <p>
                            {g.achieved
                              ? 'Achieved'
                              : g.targetDate
                                ? `Target: ${fitnessDate(g.targetDate)}`
                                : 'One step at a time'}
                          </p>
                          {g.weeklyFocus ? <p>{g.weeklyFocus}</p> : null}
                          <p className="fitness-goal-progress">
                            This week:{' '}
                            {sessions.filter((s) => s.goal?.id === g.id && s.isCompleted).length} /{' '}
                            {sessions.filter((s) => s.goal?.id === g.id).length} sessions done
                          </p>
                          {g.routine.length ? (
                            <ul
                              className="fitness-goal-routine"
                              aria-label={`${g.title} weekly routine`}
                            >
                              {g.routine.map((w) => (
                                <li key={w.id}>
                                  <span>{w.title}</span>
                                  <small>
                                    {w.days
                                      .map((d) =>
                                        FITNESS_DAY_LABELS[FITNESS_DAYS.indexOf(d)]!.slice(0, 3),
                                      )
                                      .join(' · ')}
                                  </small>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No weekly workouts yet.</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Add long-term goals in Fitness settings on an adult phone.</p>
                )}
                {person.weeklyFocus ? (
                  <>
                    <h3>Weekly focus</h3>
                    <p>{person.weeklyFocus}</p>
                  </>
                ) : null}
                <p>
                  Complete all sessions for a scheduled day to build your streak. Today stays open
                  until midnight; rest days are skipped.
                </p>
              </FitnessScrollRegion>
            </FitnessDialog>
          ) : null}
        </>
      )}
    </section>
  );
}
function FitnessFeedback({
  error,
  unavailable,
  busy,
  notice,
  pending,
  retry,
}: {
  error: string | null;
  unavailable: boolean;
  busy: boolean;
  notice: string;
  pending: boolean;
  retry: () => void;
}) {
  return (
    <div className={error || unavailable ? 'fitness-feedback' : 'sr-only'} aria-live="polite">
      {error ? (
        <span role="alert">{error}</span>
      ) : unavailable ? (
        'Showing saved progress. Refresh before checking workouts.'
      ) : busy ? (
        'Saving workout…'
      ) : (
        notice
      )}
      {error || unavailable ? (
        <button
          type="button"
          className="button focusable"
          aria-disabled={busy}
          onClick={() => {
            if (!busy) retry();
          }}
        >
          {pending ? 'Retry check' : 'Refresh Fitness'}
        </button>
      ) : null}
    </div>
  );
}
function WorkoutDetails({ session }: { session: FitnessSession }) {
  return (
    <FitnessScrollRegion label="Workout instructions">
      {session.goal ? <p className="fitness-detail-goal">Goal: {session.goal.title}</p> : null}
      {session.workout.notes ? (
        <p className="fitness-detail-notes">{session.workout.notes}</p>
      ) : null}
      {session.workout.exercises.length ? (
        <table className="fitness-exercises">
          <thead>
            <tr>
              <th scope="col">Exercise</th>
              <th scope="col">kg</th>
              <th scope="col">Sets</th>
              <th scope="col">Reps</th>
            </tr>
          </thead>
          <tbody>
            {session.workout.exercises.map((e) => (
              <tr key={e.id}>
                <th scope="row">{e.name}</th>
                <td>{e.weightKg ?? '—'}</td>
                <td>{e.sets ?? '—'}</td>
                <td>{e.reps ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : !session.workout.notes ? (
        <p>Your time to move. An adult can add workout instructions in settings.</p>
      ) : null}
    </FitnessScrollRegion>
  );
}
// Labelled scroll regions must be keyboard focusable to read long plans on a TV.
/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
function FitnessScrollRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="fitness-detail-scroll"
      tabIndex={0}
      role="region"
      aria-label={label}
      onKeyDown={(event) => {
        const region = event.currentTarget;
        const down = event.key === 'ArrowDown';
        const up = event.key === 'ArrowUp';
        const canScroll = down
          ? region.scrollTop + region.clientHeight < region.scrollHeight - 1
          : up && region.scrollTop > 0;
        if (canScroll) {
          event.preventDefault();
          event.stopPropagation();
          region.scrollBy({ top: down ? 80 : -80, behavior: 'instant' });
        }
        // At either edge, let Hearth move to Close or the completion button.
      }}
    >
      {children}
    </div>
  );
}
/* eslint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
function FitnessDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement,
      dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="fitness-dialog"
      aria-labelledby="fitness-detail-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id="fitness-detail-title">{title}</h2>
        <button
          type="button"
          className="button focusable"
          data-back-dismiss="true"
          data-focus-id="fitness-close"
          onClick={onClose}
        >
          Close
        </button>
      </header>
      {children}
    </dialog>
  );
}
