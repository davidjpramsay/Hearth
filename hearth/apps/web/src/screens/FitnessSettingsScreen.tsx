import { Link } from 'react-router-dom';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FitnessConfigurationSchema,
  type FitnessConfiguration,
  type FitnessSettings,
  type UpdateFitnessSettings,
  type FitnessPersonPlan,
} from '@hearth/shared';
import { fitnessApi } from '../api/fitness';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { AdminError, AdminPage, AdminQueryState } from '../components/AdminPage';
import { useUnsavedChanges, confirmDiscardChanges } from '../hooks/useUnsavedChanges';
import { Icon } from '../components/Icon';
import { FitnessWorkoutEditor } from './FitnessWorkoutEditor';
import { FitnessGoalEditor } from './FitnessGoalEditor';
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
  const [newWorkout, setNewWorkout] = useState('');
  const [choosingPeople, setChoosingPeople] = useState(
    latest.configuration.selectedMemberIds.length === 0,
  );
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
    for (const personPlan of configuration.plans) {
      const invalid = personPlan.workouts.find(
        (workout) => !workout.title.trim() || !workout.days.length,
      );
      const invalidGoal = personPlan.goals.find((goal) => !goal.title.trim());
      if (invalid || invalidGoal) {
        setEditing(personPlan.memberId);
        setError(
          invalid
            ? !invalid.title.trim()
              ? 'Give the workout a name.'
              : `Choose at least one day for “${invalid.title}”.`
            : 'Give the goal a name, or remove it.',
        );
        requestAnimationFrame(() => {
          const summary = document.getElementById(
            invalid ? `fitness-workout-${invalid.id}` : `fitness-goal-${invalidGoal!.id}`,
          );
          let element = summary?.parentElement;
          while (element) {
            if (element instanceof HTMLDetailsElement) element.open = true;
            element = element.parentElement;
          }
          summary?.focus();
        });
        return;
      }
    }
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
      <p className="field-help fitness-settings__intro">
        Weekly workouts for your family. Goals are optional; plans are visible to your household.
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
      <form className="fitness-settings" noValidate onSubmit={(e) => void save(e)}>
        <details
          className="fitness-settings__participants"
          open={choosingPeople}
          onToggle={(e) => setChoosingPeople(e.currentTarget.open)}
        >
          <summary>
            People{' '}
            <span>{selected.map((p) => p.displayName).join(', ') || 'Choose who takes part'}</span>
          </summary>
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
                  <img src={p.avatarUrl} alt="" width={32} height={32} />
                  <span>{p.displayName}</span>
                </label>
              ))}
            </div>
            <p className="field-help">
              Removing someone from this page keeps their plan and history.
            </p>
          </fieldset>
        </details>
        {person && plan ? (
          <fieldset disabled={busy || frozen} className="fitness-settings__plan">
            <legend className="sr-only">Weekly workouts</legend>
            <div className="fitness-settings__toolbar">
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
              <button
                id="fitness-add-workout"
                type="button"
                className="admin-secondary"
                disabled={plan.workouts.length >= 14}
                onClick={() => {
                  const id = createRequestId('workout');
                  setNewWorkout(id);
                  editPlan((p) => ({
                    ...p,
                    workouts: [
                      ...p.workouts,
                      {
                        id,
                        goalId: null,
                        title: 'Running',
                        activity: 'running',
                        days: [],
                        durationMinutes: null,
                        distanceKm: null,
                        notes: '',
                        exercises: [],
                      },
                    ],
                  }));
                  requestAnimationFrame(() =>
                    document.getElementById(`fitness-workout-${id}`)?.focus(),
                  );
                }}
              >
                <Icon name="plus" /> Add workout
              </button>
            </div>
            <section
              className="fitness-settings__workouts"
              aria-label={`${person.displayName}’s weekly workouts`}
            >
              {plan.workouts.length ? (
                plan.workouts.map((workout, i) => (
                  <FitnessWorkoutEditor
                    key={`${person.id}:${workout.id}`}
                    workout={workout}
                    index={i}
                    goals={plan.goals}
                    initiallyOpen={newWorkout === workout.id}
                    change={(update) =>
                      editPlan((p) => ({
                        ...p,
                        workouts: p.workouts.map((w) => (w.id === workout.id ? update(w) : w)),
                      }))
                    }
                    remove={() => {
                      editPlan((p) => ({
                        ...p,
                        workouts: p.workouts.filter((w) => w.id !== workout.id),
                      }));
                      requestAnimationFrame(() =>
                        document.getElementById('fitness-add-workout')?.focus(),
                      );
                    }}
                  />
                ))
              ) : (
                <p className="fitness-settings__empty">
                  No workouts yet. Add an activity and choose its days.
                </p>
              )}
              {plan.workouts.length >= 14 ? (
                <p className="field-help">
                  Up to 14 workouts per person. Each can repeat on several days.
                </p>
              ) : null}
            </section>
            <details key={person.id} className="fitness-settings__goals">
              <summary>
                Goals (optional)<span>{plan.goals.length || 'General fitness'}</span>
              </summary>
              <div>
                {plan.goals.map((goal, i) => (
                  <FitnessGoalEditor
                    key={goal.id}
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
                {plan.weeklyFocus ? (
                  <label>
                    Weekly focus
                    <textarea
                      maxLength={240}
                      rows={2}
                      value={plan.weeklyFocus}
                      onChange={(e) => editPlan((p) => ({ ...p, weeklyFocus: e.target.value }))}
                    />
                  </label>
                ) : null}
              </div>
            </details>
            <Link className="fitness-settings__library" to="/admin/fitness/exercises">
              Exercise library &amp; demonstrations <Icon name="chevron-right" />
            </Link>
          </fieldset>
        ) : (
          <p>Open People to choose who’s taking part.</p>
        )}
        <div className="fitness-settings__save">
          <div>
            <p className="field-help">
              {latest.revision === 0
                ? 'Your first plan starts today.'
                : 'Changes start tomorrow. Today’s workouts and history stay as they are.'}
            </p>
            <p role="status">{busy ? 'Saving…' : notice}</p>
          </div>
          <button className="admin-primary" type="submit" disabled={busy || conflict || readError}>
            {frozen ? 'Retry save' : 'Save Fitness'}
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
