import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useRef, useState } from 'react';
import { MODULE_IDS, MODULE_LABELS, type ModuleId, type UpdateModuleRequest } from '@hearth/shared';
import { modulesApi } from '../api/modules';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { AdminError, AdminPage } from '../components/AdminPage';
import { Icon, type IconName } from '../components/Icon';
import { useModules } from '../modules/context';
import './ModulesSettingsScreen.css';

const icons: Record<ModuleId, IconName> = {
  calendar: 'calendar',
  weather: 'cloud-sun',
  reminders: 'bell',
  chores: 'chores',
  lists: 'list',
  meals: 'meal',
  home: 'home',
  photos: 'image',
  games: 'games',
  notices: 'bell',
  dailyVerse: 'book-open',
  nba: 'basketball',
  morningRoutine: 'sun',
  afternoonRoutine: 'sunset',
  fitness: 'weights',
};
const help: Partial<Record<ModuleId, string>> = {
  chores: 'Includes routines',
  home: 'Scenes and screen actions',
  dailyVerse: 'Visibility on Today is set separately',
  nba: 'Standings, this week and next week',
  fitness: 'Personal goals, weekly workouts and streaks',
  morningRoutine: 'Morning steps and scheduled chores',
  afternoonRoutine: 'After-school steps and scheduled chores',
};
export function ModulesSettingsScreen() {
  const enabled = useModules();
  const client = useQueryClient();
  const [pending, setPending] = useState<{ id: ModuleId; input: UpdateModuleRequest } | null>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  async function save(id: ModuleId) {
    if (running.current || (pending !== null && pending.id !== id)) return;
    const operation = pending ?? {
      id,
      input: { requestId: createRequestId('module'), enabled: !enabled[id] },
    };
    setPending(operation);
    running.current = true;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await modulesApi.update(operation.id, operation.input);
      setPending(null);
      // An exact replay contains its original receipt, not necessarily today's latest settings.
      await client.invalidateQueries({
        predicate: (query) => query.queryKey[0] === queryKeys.modules[0],
      });
      setNotice(`${MODULE_LABELS[operation.id]} setting saved.`);
    } catch (failure) {
      if (
        failure instanceof HearthApiError &&
        ['VALIDATION_ERROR', 'FORBIDDEN', 'UNAUTHENTICATED', 'CONFLICT', 'NOT_FOUND'].includes(
          failure.payload.error.code,
        )
      )
        setPending(null);
      setError(failure instanceof Error ? failure.message : 'Could not confirm this change.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <AdminPage title="Modules" backTo="/more" backLabel="Back to More">
      <p>
        Choose what this home uses. Off hides a module everywhere and stops access to it, including
        from Home Assistant. Your data stays saved.
      </p>
      {error ? (
        <AdminError
          message={error}
          onRetry={pending === null ? undefined : () => void save(pending.id)}
        />
      ) : null}
      <p className="modules-status" role="status">
        {busy ? 'Saving…' : notice}
      </p>
      <div className="modules-list">
        {MODULE_IDS.map((id, index) => (
          <Fragment key={id}>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[id]}
              aria-label={MODULE_LABELS[id]}
              className="module-switch focusable"
              aria-disabled={busy || undefined}
              disabled={pending !== null && pending.id !== id}
              data-focus-entry={index === 0 ? 'true' : undefined}
              data-focus-id={`module-${id}`}
              data-focus-up={`module-${MODULE_IDS[Math.max(0, index - 1)]}`}
              data-focus-down={
                id === 'games'
                  ? 'game-modules'
                  : `module-${MODULE_IDS[Math.min(MODULE_IDS.length - 1, index + 1)]}`
              }
              onClick={() => void save(id)}
            >
              <Icon name={icons[id]} />
              <span>
                <strong>{MODULE_LABELS[id]}</strong>
                {help[id] ? <small>{help[id]}</small> : null}
              </span>
              <span className="module-switch__state">{enabled[id] ? 'On' : 'Off'}</span>
              <span className="settings-toggle" aria-hidden="true">
                <span />
              </span>
            </button>
            {id === 'games' ? (
              <Link
                className="module-submenu focusable"
                to="/admin/modules/games"
                data-focus-id="game-modules"
                data-focus-up="module-games"
                data-focus-down="module-notices"
              >
                Choose games <Icon name="chevron-right" />
              </Link>
            ) : null}
          </Fragment>
        ))}
      </div>
      <p className="field-help">
        Today, phone and screen management, and system settings stay available. Home Assistant can
        turn modules back on only after an adult approves that access.
      </p>
    </AdminPage>
  );
}
