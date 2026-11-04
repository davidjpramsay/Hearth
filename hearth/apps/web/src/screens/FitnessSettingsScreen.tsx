import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FitnessConfigurationSchema,
  FITNESS_DAYS,
  FITNESS_DAY_LABELS,
  FITNESS_ACTIVITIES,
  FITNESS_ACTIVITY_LABELS,
  type FitnessConfiguration,
  type FitnessSettings,
  type UpdateFitnessSettings,
  type FitnessPersonPlan,
  type FitnessWorkout,
  type FitnessExercise,
} from '@hearth/shared';
import { fitnessApi } from '../api/fitness';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { AdminError, AdminPage, AdminQueryState } from '../components/AdminPage';
import { useUnsavedChanges, confirmDiscardChanges } from '../hooks/useUnsavedChanges';
import { Icon } from '../components/Icon';
import { fitnessIcon } from './fitnessPresentation';
import './FitnessSettingsScreen.css';

export function FitnessSettingsScreen() {
  const query = useQuery({
    queryKey: queryKeys.fitnessSettings,
    queryFn: ({ signal }) => fitnessApi.settings(signal),
    retry: false,
  });
  if (!query.data)
    return (
      <AdminQueryState
        title="Fitness"
        backTo="/more"
        backLabel="Back to More"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <FitnessForm
      latest={query.data}
      readError={query.isError}
      refresh={() => void query.refetch()}
    />
  );
}
function FitnessForm({
  latest,
  readError,
  refresh,
}: {
  latest: FitnessSettings;
  readError: boolean;
  refresh: () => void;
}) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<{
    configuration: FitnessConfiguration;
    revision: number;
  } | null>(null);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false),
    [frozen, setFrozen] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState('');
  const pending = useRef<UpdateFitnessSettings | null>(null),
    running = useRef(false);
  useUnsavedChanges(draft !== null || frozen);
  const configuration = draft?.configuration ?? latest.configuration;
  const conflict = !frozen && draft !== null && draft.revision !== latest.revision;
  const selected = latest.people.filter((p) => configuration.selectedMemberIds.includes(p.id));
  const person = selected.find((p) => p.id === editing) ?? selected[0];
  const plan = configuration.plans.find((p) => p.memberId === person?.id);
  function change(update: (c: FitnessConfiguration) => FitnessConfiguration) {
    setDraft((c) => ({
      revision: c?.revision ?? latest.revision,
      configuration: update(c?.configuration ?? latest.configuration),
    }));
    setError(null);
    setNotice('');
  }
  function editPlan(update: (p: FitnessPersonPlan) => FitnessPersonPlan) {
    change((c) => ({
      ...c,
      plans: c.plans.map((p) => (p.memberId === person?.id ? update(p) : p)),
    }));
  }
  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (running.current || conflict || readError) return;
    const parsed = FitnessConfigurationSchema.safeParse(configuration);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your plan.');
      return;
    }
    pending.current ??= {
      requestId: createRequestId('fitness_settings'),
      expectedRevision: draft?.revision ?? latest.revision,
      configuration: parsed.data,
    };
    running.current = true;
    setBusy(true);
    setFrozen(true);
    setError(null);
    try {
      const result = await fitnessApi.save(pending.current);
      pending.current = null;
      setDraft(null);
      setFrozen(false);
      client.setQueryData(queryKeys.fitnessSettings, result.settings);
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.fitnessSettings }),
        client.invalidateQueries({ queryKey: queryKeys.fitness }),
      ]);
      setNotice(
        `Fitness saved. ${result.settings.effectiveFrom === result.settings.localDate ? 'Ready to use today.' : 'Your updated plan starts tomorrow.'}`,
      );
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
        setFrozen(false);
        if (failure.payload.error.code === 'CONFLICT') refresh();
      }
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not confirm this save. Retry the same save.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <AdminPage title="Fitness" backTo="/more" backLabel="Back to More">
      <p>
        Personal goals, each with its own weekly routine. Workouts and goals are visible to everyone
        in your home.
      </p>
      <p className="field-help">
        {latest.revision === 0
          ? 'Your first plan starts today.'
          : 'Changes start tomorrow; today’s workouts and past streaks stay as they are.'}
      </p>
      {readError ? (
        <AdminError
          message="Could not refresh settings. Your draft is still here."
          onRetry={refresh}
        />
      ) : null}
      {error ? (
        <AdminError message={error} onRetry={frozen && !busy ? () => void save() : undefined} />
      ) : null}
      {conflict ? (
        <div role="alert" className="admin-feedback">
          Another phone updated Fitness.{' '}
          <button
            type="button"
            className="admin-secondary"
            onClick={() => {
              if (confirmDiscardChanges(true)) {
                setDraft(null);
                setError(null);
              }
            }}
          >
            Load latest settings
          </button>
        </div>
      ) : null}
      <form className="fitness-settings" onSubmit={(e) => void save(e)}>
        <fieldset disabled={busy || frozen}>
          <legend>Who’s taking part?</legend>
          <div className="fitness-settings__people">
            {latest.people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={configuration.selectedMemberIds.includes(p.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    change((c) => ({
                      ...c,
                      selectedMemberIds: checked
                        ? [...c.selectedMemberIds, p.id]
                        : c.selectedMemberIds.filter((id) => id !== p.id),
                      plans: c.plans.some((plan) => plan.memberId === p.id)
                        ? c.plans
                        : [
                            ...c.plans,
                            { memberId: p.id, goals: [], weeklyFocus: '', workouts: [] },
                          ],
                    }));
                  }}
                />
                <img src={p.avatarUrl} alt="" width={36} height={36} />
                <span>{p.displayName}</span>
              </label>
            ))}
          </div>
          <p className="field-help">Unselecting someone keeps their saved plan and history.</p>
        </fieldset>
        {person && plan ? (
          <fieldset disabled={busy || frozen} className="fitness-settings__plan">
            <legend>Personal plan</legend>
            <label>
              Plan for
              <select value={person.id} onChange={(e) => setEditing(e.target.value)}>
                {selected.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </label>
            <section>
              <h2>Long-term goals</h2>
              <p className="field-help">
                Give each goal its own weekly routine. Today shows what is due across all active
                goals.
              </p>
              {plan.goals.map((goal, i) => (
                <GoalEditor
                  key={`${person.id}:${goal.id}`}
                  goal={goal}
                  index={i}
                  plan={plan}
                  editPlan={editPlan}
                />
              ))}
              <button
                id="fitness-add-goal"
                type="button"
                className="admin-secondary"
                disabled={plan.goals.length >= 5}
                onClick={() =>
                  editPlan((p) => ({
                    ...p,
                    goals: [
                      ...p.goals,
                      {
                        id: createRequestId('goal'),
                        title: '',
                        targetDate: null,
                        achieved: false,
                        weeklyFocus: '',
                      },
                    ],
                  }))
                }
              >
                Add long-term goal
              </button>
            </section>
            {plan.workouts.some((w) => w.goalId == null) || plan.weeklyFocus ? (
              <section className="fitness-unassigned">
                <h2>Earlier unassigned routine</h2>
                <p className="field-help">
                  Your earlier workouts are kept here. Choose a goal for each one when you’re ready.
                </p>
                {plan.weeklyFocus ? <p>{plan.weeklyFocus}</p> : null}
                {plan.workouts
                  .filter((w) => w.goalId == null)
                  .map((workout, i) => (
                    <div key={workout.id}>
                      <label>
                        Goal for {workout.title}
                        <select
                          value=""
                          onChange={(event) => {
                            const goalId = event.target.value;
                            editPlan((p) => ({
                              ...p,
                              workouts: p.workouts.map((w) =>
                                w.id === workout.id ? { ...w, goalId } : w,
                              ),
                            }));
                            requestAnimationFrame(() =>
                              document.getElementById(`fitness-goal-${goalId}`)?.focus(),
                            );
                          }}
                        >
                          <option value="" disabled>
                            Choose a goal
                          </option>
                          {plan.goals.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title || 'New goal'}
                            </option>
                          ))}
                        </select>
                      </label>
                      <WorkoutEditor
                        workout={workout}
                        index={i}
                        change={(update) =>
                          editPlan((p) => ({
                            ...p,
                            workouts: p.workouts.map((w) => (w.id === workout.id ? update(w) : w)),
                          }))
                        }
                        remove={() =>
                          editPlan((p) => ({
                            ...p,
                            workouts: p.workouts.filter((w) => w.id !== workout.id),
                          }))
                        }
                      />
                    </div>
                  ))}
              </section>
            ) : null}
          </fieldset>
        ) : (
          <p>Choose a person to begin their plan.</p>
        )}
        <p className="field-help">
          Streaks count scheduled workout days. Complete every session for that day; rest days don’t
          break the streak.
        </p>
        <p role="status">{busy ? 'Saving…' : notice}</p>
        <button className="admin-primary" type="submit" disabled={busy || conflict || readError}>
          {frozen ? 'Retry save' : 'Save Fitness'}
        </button>
      </form>
    </AdminPage>
  );
}
function GoalEditor({
  goal,
  index,
  plan,
  editPlan,
}: {
  goal: FitnessPersonPlan['goals'][number];
  index: number;
  plan: FitnessPersonPlan;
  editPlan: (update: (p: FitnessPersonPlan) => FitnessPersonPlan) => void;
}) {
  const [open, setOpen] = useState(index === 0 || !goal.title);
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (title.current?.value === '') title.current.focus();
  }, []);
  const workouts = plan.workouts.filter((w) => w.goalId === goal.id);
  function change(update: Partial<FitnessPersonPlan['goals'][number]>) {
    editPlan((p) => ({
      ...p,
      goals: p.goals.map((g) => (g.id === goal.id ? { ...g, ...update } : g)),
    }));
  }
  return (
    <details
      className="fitness-goal-editor"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary id={`fitness-goal-${goal.id}`}>
        <strong>{goal.title || `New goal ${index + 1}`}</strong>
        <span>
          {goal.achieved
            ? 'Achieved'
            : `${workouts.length} weekly ${workouts.length === 1 ? 'workout' : 'workouts'}`}
        </span>
      </summary>
      <div className="fitness-goal-editor__body">
        <label>
          Goal {index + 1}
          <input
            ref={title}
            required
            maxLength={160}
            value={goal.title}
            onChange={(e) => change({ title: e.target.value })}
          />
        </label>
        <div className="fitness-settings__row">
          <label>
            Target date (optional)
            <input
              type="date"
              value={goal.targetDate ?? ''}
              onChange={(e) => change({ targetDate: e.target.value || null })}
            />
          </label>
          <label className="fitness-settings__check">
            <input
              type="checkbox"
              checked={goal.achieved}
              onChange={(e) => change({ achieved: e.target.checked })}
            />
            Achieved
          </label>
        </div>
        <h3>Weekly routine</h3>
        <label>
          This goal’s weekly focus (optional)
          <textarea
            maxLength={240}
            rows={2}
            value={goal.weeklyFocus ?? ''}
            onChange={(e) => change({ weeklyFocus: e.target.value })}
          />
        </label>
        <p className="field-help">
          Choose the days for each workout. Achieved goals stop scheduling from tomorrow.
        </p>
        {workouts.map((workout, i) => (
          <WorkoutEditor
            key={workout.id}
            workout={workout}
            index={i}
            change={(update) =>
              editPlan((p) => ({
                ...p,
                workouts: p.workouts.map((w) => (w.id === workout.id ? update(w) : w)),
              }))
            }
            remove={() =>
              editPlan((p) => ({ ...p, workouts: p.workouts.filter((w) => w.id !== workout.id) }))
            }
          />
        ))}
        <button
          type="button"
          className="admin-secondary"
          disabled={plan.workouts.length >= 14}
          onClick={() =>
            editPlan((p) => ({
              ...p,
              workouts: [
                ...p.workouts,
                {
                  id: createRequestId('workout'),
                  goalId: goal.id,
                  title: '',
                  activity: 'running',
                  days: [],
                  notes: '',
                  durationMinutes: null,
                  distanceKm: null,
                  exercises: [],
                },
              ],
            }))
          }
        >
          Add workout
        </button>
        {plan.workouts.length >= 14 ? (
          <p className="field-help">
            This person has 14 workouts across their goals. Each workout can repeat on several days.
          </p>
        ) : null}
        <button
          type="button"
          className="admin-danger"
          aria-label={`Remove goal ${index + 1}`}
          onClick={() => {
            if (
              workouts.length &&
              !window.confirm('Remove this goal and its weekly routine? Past progress is kept.')
            )
              return;
            editPlan((p) => ({
              ...p,
              goals: p.goals.filter((g) => g.id !== goal.id),
              workouts: p.workouts.filter((w) => w.goalId !== goal.id),
            }));
            requestAnimationFrame(() => document.getElementById('fitness-add-goal')?.focus());
          }}
        >
          Remove goal
        </button>
      </div>
    </details>
  );
}
function WorkoutEditor({
  workout,
  index,
  change,
  remove,
}: {
  workout: FitnessWorkout;
  index: number;
  change: (update: (w: FitnessWorkout) => FitnessWorkout) => void;
  remove: () => void;
}) {
  const [open, setOpen] = useState(!workout.title);
  function exercises(update: (e: FitnessExercise[]) => FitnessExercise[]) {
    change((w) => ({ ...w, exercises: update(w.exercises) }));
  }
  return (
    <details
      className="fitness-workout-editor"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <Icon name={fitnessIcon(workout.activity)} />
        <span>{workout.title || `New workout ${index + 1}`}</span>
      </summary>
      <div>
        <label>
          Workout title
          <input
            required
            maxLength={80}
            value={workout.title}
            onChange={(e) => change((w) => ({ ...w, title: e.target.value }))}
          />
        </label>
        <label>
          Activity
          <select
            value={workout.activity}
            onChange={(e) =>
              change((w) => ({ ...w, activity: e.target.value as FitnessWorkout['activity'] }))
            }
          >
            {FITNESS_ACTIVITIES.map((a) => (
              <option value={a} key={a}>
                {FITNESS_ACTIVITY_LABELS[a]}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Workout days" className="fitness-settings__days">
          {FITNESS_DAYS.map((day, i) => (
            <label key={day}>
              <input
                type="checkbox"
                checked={workout.days.includes(day)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  change((w) => ({
                    ...w,
                    days: FITNESS_DAYS.filter((d) => (d === day ? checked : w.days.includes(d))),
                  }));
                }}
              />
              <span>{FITNESS_DAY_LABELS[i]}</span>
            </label>
          ))}
        </div>
        <div className="fitness-settings__row">
          <NumberField
            label="Minutes (optional)"
            value={workout.durationMinutes}
            min={1}
            max={1440}
            change={(value) => change((w) => ({ ...w, durationMinutes: value }))}
          />
          <NumberField
            label="Distance km (optional)"
            value={workout.distanceKm}
            min={0.01}
            max={1000}
            step="any"
            change={(value) => change((w) => ({ ...w, distanceKm: value }))}
          />
        </div>
        <label>
          Workout notes
          <textarea
            maxLength={1000}
            rows={3}
            value={workout.notes}
            onChange={(e) => change((w) => ({ ...w, notes: e.target.value }))}
          />
        </label>
        <h3>Exercises</h3>
        <ol className="fitness-exercise-editors">
          {workout.exercises.map((exercise, i) => (
            <li key={exercise.id}>
              <label>
                Exercise {i + 1}
                <input
                  required
                  maxLength={80}
                  value={exercise.name}
                  onChange={(e) =>
                    exercises((items) =>
                      items.map((x) => (x.id === exercise.id ? { ...x, name: e.target.value } : x)),
                    )
                  }
                />
              </label>
              <div className="fitness-settings__numbers">
                {(['weightKg', 'sets', 'reps'] as const).map((field) => (
                  <NumberField
                    key={field}
                    label={
                      field === 'weightKg' ? 'Weight (kg)' : field === 'sets' ? 'Sets' : 'Reps'
                    }
                    value={exercise[field]}
                    min={field === 'weightKg' ? 0 : 1}
                    max={field === 'sets' ? 100 : 1000}
                    step={field === 'weightKg' ? 'any' : '1'}
                    change={(value) =>
                      exercises((items) =>
                        items.map((x) => (x.id === exercise.id ? { ...x, [field]: value } : x)),
                      )
                    }
                  />
                ))}
              </div>
              <div className="fitness-settings__row">
                {([-1, 1] as const).map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className="admin-secondary"
                    disabled={i + delta < 0 || i + delta >= workout.exercises.length}
                    aria-label={`Move exercise ${i + 1} ${delta < 0 ? 'up' : 'down'}`}
                    onClick={() =>
                      exercises((items) => {
                        const next = [...items];
                        [next[i], next[i + delta]] = [next[i + delta]!, next[i]!];
                        return next;
                      })
                    }
                  >
                    {delta < 0 ? '↑ Up' : '↓ Down'}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-secondary"
                  aria-label={`Remove exercise ${i + 1}`}
                  onClick={() => exercises((items) => items.filter((x) => x.id !== exercise.id))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="admin-secondary"
          disabled={workout.exercises.length >= 20}
          onClick={() =>
            exercises((items) => [
              ...items,
              { id: createRequestId('exercise'), name: '', weightKg: null, sets: null, reps: null },
            ])
          }
        >
          Add exercise
        </button>
        <button type="button" className="admin-danger" onClick={remove}>
          Remove workout
        </button>
      </div>
    </details>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  step = '1',
  change,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  step?: string;
  change: (v: number | null) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        inputMode={step === 'any' ? 'decimal' : 'numeric'}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(e) => change(e.target.value === '' ? null : e.target.valueAsNumber)}
      />
    </label>
  );
}
