import { FitnessVideo } from '../components/FitnessVideo';
import { fitnessLibraryApi } from '../api/fitnessLibrary';
import type { FitnessLibraryExercise } from '@hearth/shared';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { localDateInTimezone } from '@hearth/core';
import {
  FITNESS_ACTIVITIES,
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
import {
  fitnessActivityLabel,
  fitnessDate,
  fitnessIcon,
  fitnessTarget,
} from './fitnessPresentation';
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
type FitnessPerson = FitnessOverview['people'][number];
type FitnessDay = FitnessPerson['days'][number];
type FitnessActivity = FitnessSession['workout']['activity'];

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
  const [dayDate, setDayDate] = useState('');
  const [opened, setOpened] = useState<{ memberId: string; activity: FitnessActivity } | null>(
    null,
  );
  const [goalsMember, setGoalsMember] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [hasPending, setHasPending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState('');
  const pending = useRef<SetFitnessCompletion | null>(null),
    running = useRef(false);
  useUnsavedChanges(hasPending);
  const days = data.people[0]?.days ?? [];
  const selectedDate = days.some((d) => d.localDate === dayDate) ? dayDate : data.localDate;
  const person = data.people.find((p) => p.person.id === opened?.memberId);
  const day = person?.days.find((d) => d.localDate === selectedDate);
  const activitySessions =
    day?.sessions.filter((s) => s.workout.activity === opened?.activity) ?? [];
  const goalPerson = data.people.find((p) => p.person.id === goalsMember);
  const goalSessions = goalPerson?.days.flatMap((d) => d.sessions) ?? [];
  const unavailable =
    !online || stale || localDateInTimezone(clock.instant, data.timezone) !== data.localDate;
  const canCheck = !unavailable && !busy && !hasPending && selectedDate === data.localDate;
  async function toggle(check?: FitnessSession, owner?: FitnessPerson, scheduled?: FitnessDay) {
    if (running.current) return;
    if (
      !pending.current &&
      check &&
      owner &&
      scheduled &&
      scheduled.localDate === data.localDate &&
      canCheck
    )
      pending.current = {
        requestId: createRequestId('fitness'),
        localDate: scheduled.localDate,
        memberId: owner.person.id,
        workoutId: check.workout.id,
        planRevision: scheduled.planRevision,
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
        <span className="fitness-date">
          {selectedDate === data.localDate ? 'Today · ' : ''}
          {fitnessDate(selectedDate)}
        </span>
      </header>
      {!opened && !goalPerson ? feedback : null}
      {!data.people.length ? (
        <div className="fitness-empty">
          <Icon name="weights" />
          <h2>Your next chapter starts here</h2>
          <p>Choose people and build their weekly plans in Fitness settings on an adult phone.</p>
        </div>
      ) : (
        <>
          <div className="fitness-days" role="group" aria-label="Workout day">
            {days.map((d, i) => (
              <button
                key={d.localDate}
                type="button"
                className={`focusable${d.localDate === data.localDate ? ' fitness-day--today' : ''}`}
                aria-pressed={d.localDate === selectedDate}
                aria-label={`${FITNESS_DAY_LABELS[i]}, ${fitnessDate(d.localDate)}`}
                onClick={() => setDayDate(d.localDate)}
                data-focus-id={`fitness-day-${i}`}
                data-focus-entry={d.localDate === selectedDate ? 'true' : undefined}
              >
                <span>{FITNESS_DAY_LABELS[i]!.slice(0, 3)}</span>
                <strong>{Number(d.localDate.slice(-2))}</strong>
              </button>
            ))}
          </div>
          <div
            className={`fitness-family${data.people.length > 3 ? ' fitness-family--dense' : ''}`}
            style={{ '--fitness-columns': Math.min(5, data.people.length) } as CSSProperties}
          >
            {data.people.map((p) => {
              const scheduled = p.days.find((d) => d.localDate === selectedDate);
              const sessions = scheduled?.sessions ?? [];
              const done = sessions.filter((s) => s.isCompleted).length;
              return (
                <section
                  key={p.person.id}
                  className="fitness-person"
                  aria-label={`${p.person.displayName}’s fitness`}
                  style={{ '--person-color': p.person.color } as CSSProperties}
                >
                  <header className="fitness-person-header">
                    <img src={p.person.avatarUrl} alt="" width={56} height={56} />
                    <div>
                      <h2>{p.person.displayName}</h2>
                      <p>{sessions.length ? `${done}/${sessions.length} done` : 'Rest day'}</p>
                    </div>
                    <span className="fitness-streak" aria-label={`${p.streak.current} day streak`}>
                      <Icon name="star" />
                      {p.streak.current}
                    </span>
                  </header>
                  <div className="fitness-person-progress" aria-hidden="true">
                    <span
                      style={{ width: `${sessions.length ? (done / sessions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="fitness-activities">
                    {!sessions.length ? (
                      <p className="fitness-rest">
                        <Icon name="leaf" />
                        Room to recharge.
                        <br />
                        Rest days keep your streak.
                      </p>
                    ) : (
                      FITNESS_ACTIVITIES.map((activity) => {
                        const group = sessions.filter((s) => s.workout.activity === activity);
                        if (!group.length) return null;
                        const completed = group.filter((s) => s.isCompleted).length;
                        const allDone = completed === group.length;
                        return (
                          <button
                            key={activity}
                            type="button"
                            className={`fitness-workout focusable fitness-workout--${activity}${allDone ? ' fitness-workout--done' : ''}`}
                            data-focus-id={`fitness-${p.person.id}-${activity}`}
                            aria-label={`${p.person.displayName}: ${fitnessActivityLabel(activity)}${allDone ? ', done' : ''}`}
                            aria-describedby={
                              group.length > 1
                                ? `fitness-count-${p.person.id}-${activity}`
                                : undefined
                            }
                            onClick={() => setOpened({ memberId: p.person.id, activity })}
                          >
                            <span className="fitness-activity-icon">
                              <Icon name={fitnessIcon(activity)} />
                            </span>
                            <strong>{fitnessActivityLabel(activity)}</strong>
                            {group.length > 1 ? (
                              <span
                                className="fitness-activity-count"
                                id={`fitness-count-${p.person.id}-${activity}`}
                                aria-label={`${completed} of ${group.length} workouts done`}
                              >
                                {completed}/{group.length}
                              </span>
                            ) : (
                              <Icon name={allDone ? 'check' : 'chevron-right'} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <button
                    type="button"
                    className="fitness-goals-link focusable"
                    aria-label={`${p.person.displayName}’s weekly progress`}
                    onClick={() => setGoalsMember(p.person.id)}
                  >
                    Progress
                    <Icon name="chevron-right" />
                  </button>
                </section>
              );
            })}
          </div>
          {opened && person && day && activitySessions.length ? (
            <FitnessWorkoutDialog
              sessions={activitySessions}
              personName={person.person.displayName}
              localDate={day.localDate}
              isToday={selectedDate === data.localDate}
              canCheck={canCheck}
              busy={busy}
              onToggle={(session) => void toggle(session, person, day)}
              onClose={() => setOpened(null)}
            >
              {feedback}
            </FitnessWorkoutDialog>
          ) : null}
          {goalPerson ? (
            <FitnessDialog
              title={`${goalPerson.person.displayName}’s progress`}
              onClose={() => setGoalsMember(null)}
            >
              <FitnessScrollRegion label="Weekly progress">
                <p className="fitness-goal-summary">
                  <strong>{goalPerson.streak.current} day streak</strong> · Best:{' '}
                  {goalPerson.streak.best} scheduled days
                  <br />
                  This week: {goalSessions.filter((s) => s.isCompleted).length} /{' '}
                  {goalSessions.length} sessions done
                </p>
                {goalPerson.goals.length ? (
                  <ul className="fitness-goal-list">
                    {goalPerson.goals.map((g) => (
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
                            {
                              goalSessions.filter((s) => s.goal?.id === g.id && s.isCompleted)
                                .length
                            }{' '}
                            / {goalSessions.filter((s) => s.goal?.id === g.id).length} sessions done
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
                  <p>General fitness · goals are optional.</p>
                )}
                {goalPerson.weeklyFocus ? (
                  <>
                    <h3>Weekly focus</h3>
                    <p>{goalPerson.weeklyFocus}</p>
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
function FitnessWorkoutDialog({
  sessions,
  personName,
  localDate,
  isToday,
  canCheck,
  busy,
  onToggle,
  onClose,
  children,
}: {
  sessions: FitnessSession[];
  personName: string;
  localDate: string;
  isToday: boolean;
  canCheck: boolean;
  busy: boolean;
  onToggle: (session: FitnessSession) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const library = useQuery({
    queryKey: queryKeys.fitnessLibrary,
    queryFn: ({ signal }) => fitnessLibraryApi.get(signal),
    retry: false,
  });
  const [watch, setWatch] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const exercise = library.data?.exercises.find((e) => e.id === watch);
  const firstSession = sessions[0];
  const title = firstSession
    ? sessions.length === 1
      ? firstSession.workout.title
      : fitnessActivityLabel(firstSession.workout.activity)
    : 'Workout';
  const back = () => {
    setWatch(null);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else document.querySelector<HTMLElement>('.fitness-dialog .fitness-detail-scroll')?.focus();
    });
  };
  return (
    <FitnessDialog
      title={watch && exercise ? exercise.name : title}
      closeLabel={watch ? 'Back to exercises' : 'Close'}
      onClose={watch ? back : onClose}
      video={watch !== null}
    >
      <div hidden={watch !== null} className="fitness-workout-detail-body">
        <p className="fitness-detail-type">
          {personName} · {fitnessDate(localDate)}
        </p>
        <FitnessScrollRegion label="Workout instructions">
          {sessions.map((session) => (
            <section
              key={session.workout.id}
              className="fitness-session-detail"
              aria-label={session.workout.title}
            >
              {sessions.length > 1 ? <h3>{session.workout.title}</h3> : null}
              {fitnessTarget(session.workout) ? (
                <p className="fitness-detail-type">{fitnessTarget(session.workout)}</p>
              ) : null}
              <WorkoutDetails
                session={session}
                library={library.data?.exercises ?? []}
                onWatch={(id, button) => {
                  opener.current = button;
                  setWatch(id);
                }}
              />
              <button
                className="button button--primary focusable fitness-complete"
                type="button"
                aria-pressed={session.isCompleted}
                aria-disabled={!canCheck}
                aria-busy={busy}
                aria-label={
                  sessions.length > 1
                    ? `${session.isCompleted ? 'Undo' : 'Complete'} ${session.workout.title}`
                    : undefined
                }
                onClick={() => {
                  if (canCheck) onToggle(session);
                }}
              >
                <Icon name="check" />
                {session.isCompleted ? 'Undo completed workout' : 'Mark workout done'}
              </button>
            </section>
          ))}
        </FitnessScrollRegion>
        {!isToday ? (
          <p className="fitness-detail-help">Checks are available on the scheduled day.</p>
        ) : null}
        {library.isError ? (
          <p className="fitness-detail-help">
            Demonstrations could not refresh. Your workout details are still here.{' '}
            <button
              type="button"
              className="button focusable"
              onClick={() => void library.refetch()}
            >
              Retry library
            </button>
          </p>
        ) : null}
        {children}
      </div>
      {watch && !exercise?.demonstration ? (
        <p role="status">
          This demonstration was removed. Go back to your exercises; your workout is unchanged.
        </p>
      ) : null}
      {watch && exercise?.demonstration ? (
        <FitnessVideo
          key={exercise.demonstration.id}
          assetId={exercise.demonstration.id}
          name={exercise.name}
          instructions={exercise.instructions}
        />
      ) : null}
    </FitnessDialog>
  );
}
function WorkoutDetails({
  session,
  library,
  onWatch,
}: {
  session: FitnessSession;
  library: FitnessLibraryExercise[];
  onWatch: (id: string, button: HTMLButtonElement) => void;
}) {
  return (
    <>
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
            {session.workout.exercises.map((e) => {
              const entry = library.find((x) => x.id === e.libraryExerciseId);
              return (
                <tr key={e.id}>
                  <th scope="row">
                    {entry?.demonstration ? (
                      <button
                        className="button focusable fitness-exercise-watch"
                        type="button"
                        data-focus-id={`exercise-watch-${session.workout.id}-${e.id}`}
                        aria-label={`Watch ${e.name} demonstration`}
                        onClick={(event) => onWatch(entry.id, event.currentTarget)}
                      >
                        {e.name}
                        <small>▶ Demonstration</small>
                      </button>
                    ) : (
                      e.name
                    )}
                    {entry?.instructions ? (
                      <small className="fitness-exercise-instructions">{entry.instructions}</small>
                    ) : null}
                  </th>
                  <td>{e.weightKg ?? '—'}</td>
                  <td>{e.sets ?? '—'}</td>
                  <td>{e.reps ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : !session.workout.notes ? (
        <p>Your time to move. An adult can add workout instructions in settings.</p>
      ) : null}
    </>
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
        if (event.target !== event.currentTarget) return;
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
  closeLabel = 'Close',
  video = false,
}: {
  closeLabel?: string;
  video?: boolean;
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
      className={`fitness-dialog${video ? ' fitness-dialog--video' : ''}`}
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
          {closeLabel}
        </button>
      </header>
      {children}
    </dialog>
  );
}
