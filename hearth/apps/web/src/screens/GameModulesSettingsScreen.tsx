import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  GAME_MODULE_IDS,
  GAME_MODULE_LABELS,
  type GameModuleId,
  type UpdateModuleRequest,
} from '@hearth/shared';
import { AdminError, AdminPage } from '../components/AdminPage';
import { Icon } from '../components/Icon';
import { modulesApi } from '../api/modules';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { useGameModules, useModules } from '../modules/context';
import './ModulesSettingsScreen.css';

export function GameModulesSettingsScreen() {
  const enabled = useGameModules();
  const parent = useModules().games;
  const client = useQueryClient();
  const running = useRef(false);
  const [pending, setPending] = useState<{ id: GameModuleId; input: UpdateModuleRequest } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  async function save(id: GameModuleId) {
    if (running.current || (pending && pending.id !== id)) return;
    const operation = pending ?? {
      id,
      input: { requestId: createRequestId('game'), enabled: !enabled[id] },
    };
    setPending(operation);
    running.current = true;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await modulesApi.updateGame(operation.id, operation.input);
      setPending(null);
      await client.invalidateQueries({ queryKey: queryKeys.modules });
      setNotice(`${GAME_MODULE_LABELS[operation.id]} setting saved.`);
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
    <AdminPage title="Game modules" backTo="/admin/modules" backLabel="Back to Modules">
      <p>Choose the games your family sees. Turning a game off keeps its saved progress.</p>
      {!parent ? (
        <p role="status">Games is turned off. These choices will apply when Games is back on.</p>
      ) : null}
      {error ? (
        <AdminError message={error} onRetry={pending ? () => void save(pending.id) : undefined} />
      ) : null}
      <p className="modules-status" role="status">
        {busy ? 'Saving…' : notice}
      </p>
      <div className="modules-list">
        {GAME_MODULE_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            role="switch"
            aria-checked={enabled[id]}
            aria-label={GAME_MODULE_LABELS[id]}
            className="module-switch focusable"
            aria-disabled={busy || undefined}
            disabled={pending !== null && pending.id !== id}
            data-focus-id={`game-module-${id}`}
            data-focus-entry={index === 0 ? 'true' : undefined}
            onClick={() => void save(id)}
          >
            <Icon name="games" />
            <span>
              <strong>{GAME_MODULE_LABELS[id]}</strong>
              <small>
                {id === 'connectFour'
                  ? 'Two players on this screen'
                  : 'Your private word puzzle archive'}
              </small>
            </span>
            <span className="module-switch__state">{enabled[id] ? 'On' : 'Off'}</span>
            <span className="settings-toggle" aria-hidden="true">
              <span />
            </span>
          </button>
        ))}
      </div>
    </AdminPage>
  );
}
