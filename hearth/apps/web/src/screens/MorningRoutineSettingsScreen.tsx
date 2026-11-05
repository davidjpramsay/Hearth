import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MorningProfilesSchema,
  MORNING_DAY_IDS,
  MORNING_PROFILE_LABELS,
  type MorningProfiles,
  type MorningProfileId,
  type MorningConfiguration,
  type MorningSettings,
  type UpdateMorningProfiles,
} from '@hearth/shared';
import { routineApi } from '../api/morningRoutine';
import { choresApi } from '../api/chores';
import { useModules } from '../modules/context';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { AdminError, AdminPage, AdminQueryState } from '../components/AdminPage';
import { useUnsavedChanges, confirmDiscardChanges } from '../hooks/useUnsavedChanges';
import './MorningRoutineSettingsScreen.css';

export function MorningRoutineSettingsScreen({
  period = 'morning',
}: {
  period?: 'morning' | 'afternoon';
}) {
  const title = period === 'morning' ? 'Morning Routine' : 'Afternoon Routine';
  const query = useQuery({
    queryKey: period === 'morning' ? queryKeys.morningSettings : queryKeys.afternoonSettings,
    queryFn: ({ signal }) => routineApi(period).settings(signal),
    retry: false,
  });
  if (!query.data)
    return (
      <AdminQueryState
        title={title}
        backTo="/more"
        backLabel="Back to More"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <MorningForm
      period={period}
      latest={query.data}
      readError={query.isError}
      refresh={() => void query.refetch()}
    />
  );
}

function MorningForm({
  period,
  latest,
  readError,
  refresh,
}: {
  period: 'morning' | 'afternoon';
  latest: MorningSettings;
  readError: boolean;
  refresh: () => void;
}) {
  const title = period === 'morning' ? 'Morning Routine' : 'Afternoon Routine';
  const modules = useModules();
  const chores = useQuery({
    queryKey: queryKeys.choreTemplates,
    queryFn: () => choresApi.getChoreTemplates(),
    enabled: modules.chores,
    retry: false,
  });
  const client = useQueryClient();
  const [draft, setDraft] = useState<{
    profiles: MorningProfiles;
    revision: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const pending = useRef<UpdateMorningProfiles | null>(null);
  const running = useRef(false);
  useUnsavedChanges(draft !== null || frozen);
  const [editingProfile, setEditingProfile] = useState<MorningProfileId>('schoolDays');
  const profiles = draft?.profiles ?? latest.profiles;
  const profile = profiles[editingProfile];
  const configuration = profile.configuration;
  const conflict = !frozen && draft !== null && draft.revision !== latest.revision;
  function changeProfiles(update: (current: MorningProfiles) => MorningProfiles) {
    setDraft((current) => ({
      revision: current?.revision ?? latest.revision,
      profiles: update(current?.profiles ?? latest.profiles),
    }));
    setNotice('');
    setError(null);
  }
  function change(update: (current: MorningConfiguration) => MorningConfiguration) {
    changeProfiles((current) => ({
      ...current,
      [editingProfile]: {
        ...current[editingProfile],
        configuration: update(current[editingProfile].configuration),
      },
    }));
  }
  function stepsFor(id: string) {
    return configuration.routines.find((routine) => routine.memberId === id)?.steps ?? [];
  }
  function editSteps(
    id: string,
    update: (
      steps: MorningConfiguration['routines'][number]['steps'],
    ) => MorningConfiguration['routines'][number]['steps'],
  ) {
    change((current) => ({
      ...current,
      routines: current.routines.some((routine) => routine.memberId === id)
        ? current.routines.map((routine) =>
            routine.memberId === id ? { ...routine, steps: update(routine.steps) } : routine,
          )
        : [...current.routines, { memberId: id, steps: update([]) }],
    }));
  }
  function selectPerson(id: string, checked: boolean) {
    change((current) => ({
      ...current,
      selectedMemberIds: checked
        ? [...current.selectedMemberIds, id]
        : current.selectedMemberIds.filter((person) => person !== id),
      routines: current.routines.some((routine) => routine.memberId === id)
        ? current.routines
        : [...current.routines, { memberId: id, steps: [] }],
    }));
  }
  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (running.current) return;
    const parsed = MorningProfilesSchema.safeParse(profiles);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const profileId = issue?.path[0];
      if (profileId === 'schoolDays' || profileId === 'weekends') {
        setEditingProfile(profileId);
        setError(
          `${MORNING_PROFILE_LABELS[profileId]}: ${issue?.message ?? 'Check these settings.'}`,
        );
      } else setError(issue?.message ?? 'Check the routine settings.');
      return;
    }
    pending.current ??= {
      requestId: createRequestId('morning_settings'),
      expectedRevision: draft?.revision ?? latest.revision,
      profiles: parsed.data,
    };
    running.current = true;
    setBusy(true);
    setFrozen(true);
    setError(null);
    setNotice('');
    try {
      await routineApi(period).save(pending.current);
      pending.current = null;
      setDraft(null);
      setFrozen(false);
      await Promise.all([
        client.invalidateQueries({
          queryKey: period === 'morning' ? queryKeys.morningSettings : queryKeys.afternoonSettings,
        }),
        client.invalidateQueries({
          queryKey: period === 'morning' ? queryKeys.morningRoutine : queryKeys.afternoonRoutine,
        }),
      ]);
      setNotice(`${title} saved.`);
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
      setError(failure instanceof Error ? failure.message : 'Could not confirm these settings.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <AdminPage title={title} backTo="/more" backLabel="Back to More">
      <p>
        Different steps for school days and weekends, with a fresh start each day. Linked chores
        appear only when due and share their tick with Chores.
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
        <div className="admin-feedback" role="alert">
          Another device changed these settings. Your draft is still here.{' '}
          <button
            className="admin-secondary"
            type="button"
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
      <form className="morning-settings" onSubmit={(event) => void save(event)}>
        <fieldset disabled={busy || frozen}>
          <legend>Which routine runs each day?</legend>
          <div className="morning-settings__days">
            {MORNING_DAY_IDS.map((day, index) => {
              const name = [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ][index]!;
              const assigned = profiles.schoolDays.days.includes(day)
                ? 'schoolDays'
                : profiles.weekends.days.includes(day)
                  ? 'weekends'
                  : 'none';
              return (
                <label key={day}>
                  {name}
                  <select
                    aria-label={`${name} routine`}
                    value={assigned}
                    onChange={(event) => {
                      const selected = event.target.value;
                      changeProfiles((current) => ({
                        schoolDays: {
                          ...current.schoolDays,
                          days: MORNING_DAY_IDS.filter((id) =>
                            id === day
                              ? selected === 'schoolDays'
                              : current.schoolDays.days.includes(id),
                          ),
                        },
                        weekends: {
                          ...current.weekends,
                          days: MORNING_DAY_IDS.filter((id) =>
                            id === day
                              ? selected === 'weekends'
                              : current.weekends.days.includes(id),
                          ),
                        },
                      }));
                    }}
                  >
                    <option value="schoolDays">School days</option>
                    <option value="weekends">Weekends</option>
                    <option value="none">No routine</option>
                  </select>
                </label>
              );
            })}
          </div>
          <p className="field-help">
            Uses your home’s day and timezone. School holidays are not detected automatically.
          </p>
        </fieldset>
        <div className="morning-settings__profiles" role="group" aria-label="Edit routine">
          {(['schoolDays', 'weekends'] as const).map((id) => (
            <button
              type="button"
              className="admin-secondary focusable"
              aria-pressed={editingProfile === id}
              disabled={busy || frozen}
              key={id}
              onClick={() => setEditingProfile(id)}
            >
              {MORNING_PROFILE_LABELS[id]}
            </button>
          ))}
        </div>
        <h2 className="morning-settings__profile-title">
          {MORNING_PROFILE_LABELS[editingProfile]}
        </h2>
        <fieldset disabled={busy || frozen}>
          <legend>{period === 'morning' ? 'Morning' : 'Afternoon'} countdown</legend>
          <label className="morning-settings__countdown-toggle">
            <input
              type="checkbox"
              checked={profile.countdownEnabled}
              onChange={(event) => {
                const enabled = event.target.checked;
                changeProfiles((current) => ({
                  ...current,
                  [editingProfile]: { ...current[editingProfile], countdownEnabled: enabled },
                }));
              }}
            />
            Use a countdown
          </label>
          {profile.countdownEnabled ? (
            <>
              <div className="morning-settings__times">
                <label>
                  Start time
                  <input
                    type="time"
                    required
                    value={configuration.startTime}
                    onChange={(event) =>
                      change((current) => ({ ...current, startTime: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Ready by
                  <input
                    type="time"
                    required
                    value={configuration.endTime}
                    onChange={(event) =>
                      change((current) => ({ ...current, endTime: event.target.value }))
                    }
                  />
                </label>
              </div>
              <p className="field-help">The bar drains down until Ready by.</p>
            </>
          ) : (
            <p className="field-help">No deadline or timer. Tick the steps at your own pace.</p>
          )}
        </fieldset>
        <fieldset disabled={busy || frozen}>
          <legend>Who’s getting ready?</legend>
          <div className="morning-settings__people">
            {latest.people.map((person) => (
              <label key={person.id}>
                <input
                  type="checkbox"
                  checked={configuration.selectedMemberIds.includes(person.id)}
                  onChange={(event) => selectPerson(person.id, event.target.checked)}
                />
                <img src={person.avatarUrl} alt="" width={40} height={40} />
                <span>{person.displayName}</span>
              </label>
            ))}
          </div>
          <p className="field-help">Unselecting someone keeps their list for later.</p>
        </fieldset>
        <fieldset disabled={busy || frozen}>
          <legend>Steps for each person</legend>
          {configuration.selectedMemberIds.length === 0 ? (
            <p>Select someone above to edit their list.</p>
          ) : (
            latest.people
              .filter((person) => configuration.selectedMemberIds.includes(person.id))
              .map((person, personIndex) => (
                <details
                  className="morning-editor"
                  key={`${editingProfile}:${person.id}`}
                  open={personIndex === 0 ? true : undefined}
                >
                  <summary>
                    {person.displayName}
                    <span>{stepsFor(person.id).length} steps</span>
                  </summary>
                  <div className="morning-editor__body">
                    <ol>
                      {stepsFor(person.id).map((step, index, steps) => (
                        <li key={step.id}>
                          <label>
                            <span>Step {index + 1}</span>
                            <input
                              aria-label={`${person.displayName} step ${index + 1}`}
                              maxLength={step.choreTemplateId ? 140 : 80}
                              readOnly={Boolean(step.choreTemplateId)}
                              required
                              value={
                                step.choreTemplateId
                                  ? modules.chores
                                    ? (chores.data?.templates.find(
                                        (chore) => chore.id === step.choreTemplateId,
                                      )?.title ?? 'Unavailable chore')
                                    : 'Linked chore'
                                  : step.title
                              }
                              onChange={(event) =>
                                editSteps(person.id, (items) =>
                                  items.map((item) =>
                                    item.id === step.id
                                      ? { ...item, title: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>
                          {step.choreTemplateId ? (
                            <p className="field-help">
                              Linked chore · only shown on its scheduled days.{' '}
                              {!modules.chores ||
                              !chores.data?.templates.some(
                                (chore) =>
                                  chore.id === step.choreTemplateId &&
                                  !chore.archived &&
                                  chore.assignees.some((assignee) => assignee.id === person.id),
                              )
                                ? 'Currently unavailable; the link is kept.'
                                : ''}
                            </p>
                          ) : null}
                          <div className="morning-editor__actions">
                            <button
                              type="button"
                              className="admin-secondary"
                              disabled={index === 0}
                              aria-label={`Move ${person.displayName} step ${index + 1} up`}
                              onClick={() =>
                                editSteps(person.id, (items) => {
                                  const next = [...items];
                                  [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                                  return next;
                                })
                              }
                            >
                              ↑ Up
                            </button>
                            <button
                              type="button"
                              className="admin-secondary"
                              disabled={index === steps.length - 1}
                              aria-label={`Move ${person.displayName} step ${index + 1} down`}
                              onClick={() =>
                                editSteps(person.id, (items) => {
                                  const next = [...items];
                                  [next[index + 1], next[index]] = [next[index]!, next[index + 1]!];
                                  return next;
                                })
                              }
                            >
                              ↓ Down
                            </button>
                            <button
                              type="button"
                              className="admin-secondary"
                              aria-label={`Remove ${person.displayName} step ${index + 1}`}
                              onClick={() =>
                                editSteps(person.id, (items) =>
                                  items.filter((item) => item.id !== step.id),
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {modules.chores ? (
                      <label>
                        Add one of {person.displayName}’s chores
                        <select
                          aria-label={`Add chore for ${person.displayName}`}
                          value=""
                          disabled={
                            stepsFor(person.id).length >= 12 || !chores.data || chores.isError
                          }
                          onChange={(event) => {
                            const chore = chores.data?.templates.find(
                              (item) => item.id === event.target.value,
                            );
                            if (chore)
                              editSteps(person.id, (steps) => [
                                ...steps,
                                {
                                  id: createRequestId('step'),
                                  title: 'Linked chore',
                                  choreTemplateId: chore.id,
                                },
                              ]);
                          }}
                        >
                          <option value="">Choose a chore…</option>
                          {chores.data?.templates
                            .filter(
                              (chore) =>
                                !chore.archived &&
                                chore.assignees.some((assignee) => assignee.id === person.id) &&
                                !stepsFor(person.id).some(
                                  (step) => step.choreTemplateId === chore.id,
                                ),
                            )
                            .map((chore) => (
                              <option key={chore.id} value={chore.id}>
                                {chore.title}
                              </option>
                            ))}
                        </select>
                        <span className="field-help">
                          Uses the chore’s existing days and pocket money rules.
                        </span>
                      </label>
                    ) : (
                      <p className="field-help">
                        Turn on Chores to add linked chores. Saved links are kept.
                      </p>
                    )}
                    {chores.isError && modules.chores ? (
                      <AdminError
                        message="Could not load chores."
                        onRetry={() => void chores.refetch()}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={stepsFor(person.id).length >= 12}
                      onClick={() =>
                        editSteps(person.id, (steps) => [
                          ...steps,
                          { id: createRequestId('step'), title: '' },
                        ])
                      }
                    >
                      Add step for {person.displayName}
                    </button>
                  </div>
                </details>
              ))
          )}
          <p className="field-help">
            Suggested order only—children can tick any step. Up to 12 steps each.
          </p>
        </fieldset>
        <p role="status">{busy ? 'Saving…' : notice}</p>
        <button className="admin-primary" type="submit" disabled={busy || conflict || readError}>
          {frozen ? 'Retry save' : `Save ${title}`}
        </button>
      </form>
    </AdminPage>
  );
}
