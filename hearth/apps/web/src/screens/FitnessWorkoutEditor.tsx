import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FITNESS_ACTIVITIES,
  FITNESS_ACTIVITY_LABELS,
  FITNESS_DAYS,
  FITNESS_DAY_LABELS,
  type FitnessWorkout,
  type FitnessExercise,
  type FitnessPersonPlan,
} from '@hearth/shared';
import { fitnessLibraryApi } from '../api/fitnessLibrary';
import { queryKeys } from '../api/queryKeys';
import { createRequestId } from '../api/core';
import { Icon } from '../components/Icon';
import { fitnessIcon } from './fitnessPresentation';

export function FitnessWorkoutEditor({
  workout,
  index,
  change,
  remove,
  goals,
  initiallyOpen,
}: {
  workout: FitnessWorkout;
  index: number;
  change: (update: (w: FitnessWorkout) => FitnessWorkout) => void;
  remove: () => void;
  goals: FitnessPersonPlan['goals'];
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  function exercises(update: (e: FitnessExercise[]) => FitnessExercise[]) {
    change((w) => ({ ...w, exercises: update(w.exercises) }));
  }
  const library = useQuery({
    queryKey: queryKeys.fitnessLibrary,
    queryFn: ({ signal }) => fitnessLibraryApi.get(signal),
    retry: false,
  });
  return (
    <details
      className="fitness-workout-editor"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary id={`fitness-workout-${workout.id}`}>
        <Icon name={fitnessIcon(workout.activity)} />
        <span className="fitness-workout-editor__summary">
          <strong>{workout.title || `New workout ${index + 1}`}</strong>
          <small>
            {workout.days.length
              ? FITNESS_DAYS.filter((day) => workout.days.includes(day))
                  .map((day) => FITNESS_DAY_LABELS[FITNESS_DAYS.indexOf(day)]!.slice(0, 3))
                  .join(' · ')
              : 'Choose days'}
            {goals.find((goal) => goal.id === workout.goalId)?.achieved
              ? ' · Goal achieved — paused'
              : ''}
          </small>
        </span>
      </summary>
      <div className="fitness-workout-editor__body">
        <label>
          Activity
          <select
            value={workout.activity}
            onChange={(e) =>
              change((w) => {
                const activity = e.target.value as FitnessWorkout['activity'];
                return {
                  ...w,
                  activity,
                  title:
                    !w.title || w.title === FITNESS_ACTIVITY_LABELS[w.activity]
                      ? FITNESS_ACTIVITY_LABELS[activity]
                      : w.title,
                };
              })
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
                aria-label={FITNESS_DAY_LABELS[i]}
                checked={workout.days.includes(day)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  change((w) => ({
                    ...w,
                    days: FITNESS_DAYS.filter((d) => (d === day ? checked : w.days.includes(d))),
                  }));
                }}
              />
              <span aria-hidden="true">{FITNESS_DAY_LABELS[i]!.slice(0, 3)}</span>
            </label>
          ))}
        </div>
        <details className="fitness-workout-details">
          <summary>
            Exercises &amp; details{' '}
            <span className="field-help">
              {workout.exercises.length ? `${workout.exercises.length} exercises` : 'Optional'}
            </span>
          </summary>
          <div className="fitness-workout-details__body">
            <label>
              Workout title
              <input
                maxLength={80}
                value={workout.title}
                onChange={(e) => change((w) => ({ ...w, title: e.target.value }))}
              />
            </label>
            {goals.length ? (
              <label>
                Goal (optional)
                <select
                  value={workout.goalId ?? ''}
                  onChange={(e) => change((w) => ({ ...w, goalId: e.target.value || null }))}
                >
                  <option value="">General fitness</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title || 'New goal'}
                      {goal.achieved ? ' · achieved' : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
            <h2>Exercises</h2>
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
                          items.map((x) =>
                            x.id === exercise.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Demonstration / library exercise
                    <select
                      value={exercise.libraryExerciseId ?? ''}
                      onChange={(e) => {
                        const entry = library.data?.exercises.find((x) => x.id === e.target.value);
                        exercises((items) =>
                          items.map((x) =>
                            x.id === exercise.id
                              ? {
                                  ...x,
                                  libraryExerciseId: entry?.id ?? null,
                                  ...(entry ? { name: entry.name } : {}),
                                }
                              : x,
                          ),
                        );
                      }}
                    >
                      <option value="">None — use workout instructions</option>
                      {exercise.libraryExerciseId &&
                      !library.data?.exercises.some((e) => e.id === exercise.libraryExerciseId) ? (
                        <option value={exercise.libraryExerciseId}>
                          Saved link (currently unavailable)
                        </option>
                      ) : null}
                      {library.data?.exercises.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                          {entry.demonstration ? ' · video' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  {library.isError ? (
                    <p>Demonstrations could not refresh. Existing links are kept.</p>
                  ) : null}
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
                      onClick={() =>
                        exercises((items) => items.filter((x) => x.id !== exercise.id))
                      }
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
                  {
                    id: createRequestId('exercise'),
                    name: '',
                    weightKg: null,
                    sets: null,
                    reps: null,
                  },
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
