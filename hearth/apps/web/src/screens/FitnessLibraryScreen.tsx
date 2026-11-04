import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MAX_FITNESS_CLIP_BYTES,
  type FitnessLibraryExercise,
  type FitnessLibraryResult,
} from '@hearth/shared';
import { fitnessLibraryApi } from '../api/fitnessLibrary';
import { createRequestId, HearthApiError } from '../api/core';
import { queryKeys } from '../api/queryKeys';
import { AdminPage, AdminQueryState } from '../components/AdminPage';
import { useUnsavedChanges, confirmDiscardChanges } from '../hooks/useUnsavedChanges';
import './FitnessSettingsScreen.css';
import './FitnessLibraryScreen.css';
type Draft = Pick<
  FitnessLibraryExercise,
  'id' | 'name' | 'instructions' | 'version' | 'demonstration'
>;
const fresh = (): Draft => ({
  id: createRequestId('library_exercise'),
  name: '',
  instructions: '',
  version: 0,
  demonstration: null,
});
export function FitnessLibraryScreen() {
  const query = useQuery({
    queryKey: queryKeys.fitnessLibrary,
    queryFn: ({ signal }) => fitnessLibraryApi.get(signal),
    retry: false,
  });
  const client = useQueryClient();
  const [selected, setSelected] = useState<Draft>(fresh);
  const [original, setOriginal] = useState<Draft>(selected);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [hasPending, setHasPending] = useState(false);
  const pending = useRef<null | (() => Promise<FitnessLibraryResult>)>(null);
  const dirty = JSON.stringify(selected) !== JSON.stringify(original);
  useUnsavedChanges(dirty || busy || hasPending);
  const frozen = busy || hasPending;
  function choose(draft: Draft) {
    if (frozen || !confirmDiscardChanges(dirty)) return;
    setSelected(draft);
    setOriginal(draft);
    setError('');
    setMessage('');
  }
  async function execute(job?: () => Promise<FitnessLibraryResult>) {
    if (busy) return;
    if (job) pending.current = job;
    if (!pending.current) return;
    setHasPending(true);
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await pending.current();
      const latest = await fitnessLibraryApi.get();
      pending.current = null;
      client.setQueryData(queryKeys.fitnessLibrary, latest);
      const next = latest.exercises.find((e) => e.id === result.exercise?.id) ?? fresh();
      setSelected(next);
      setOriginal(next);
      setMessage('Library updated. Linked routines use the same demonstration.');
    } catch (e) {
      if (e instanceof HearthApiError && !e.payload.error.retryable) pending.current = null;
      setError(
        e instanceof HearthApiError
          ? e.message
          : 'Could not confirm the update. Retry to check the same request.',
      );
    } finally {
      setHasPending(pending.current !== null);
      setBusy(false);
    }
  }
  const command = () => ({
    requestId: createRequestId('library'),
    expectedVersion: selected.version,
  });
  if (!query.data)
    return (
      <AdminQueryState
        title="Exercise library"
        backTo="/admin/fitness"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <AdminPage title="Exercise library" backTo="/admin/fitness" backLabel="Back to Fitness">
      <p>
        Save a demonstration once, then choose it in anyone’s workout. Weights, sets and reps stay
        with each workout.
      </p>
      {query.isError ? (
        <p role="alert">
          The library could not refresh.{' '}
          <button type="button" className="admin-secondary" onClick={() => void query.refetch()}>
            Refresh library
          </button>
        </p>
      ) : null}
      <div className="fitness-settings fitness-library-layout">
        <section aria-label="Saved exercises" className="fitness-library-list">
          <label>
            Find an exercise
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <button
            type="button"
            className="admin-primary"
            disabled={frozen}
            onClick={() => choose(fresh())}
          >
            New exercise
          </button>
          {query.data.exercises.length === 0 ? <p>No saved exercises yet.</p> : null}
          {query.data.exercises
            .filter((e) => e.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
            .map((e) => (
              <button
                type="button"
                className="admin-secondary"
                key={e.id}
                aria-pressed={selected.id === e.id}
                disabled={frozen}
                onClick={() => choose(e)}
              >
                <strong>{e.name}</strong>
                <span>{e.demonstration ? 'Demonstration ready' : 'Instructions only'}</span>
              </button>
            ))}
        </section>
        <section className="fitness-library-editor" aria-label="Edit library exercise">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = {
                  ...command(),
                  name: selected.name,
                  instructions: selected.instructions,
                },
                id = selected.id;
              void execute(() => fitnessLibraryApi.save(id, input));
            }}
          >
            <fieldset disabled={frozen || query.isError}>
              <legend>{selected.version ? 'Edit exercise' : 'New exercise'}</legend>
              <label>
                Exercise name
                <input
                  required
                  maxLength={80}
                  value={selected.name}
                  onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                />
              </label>
              <label>
                Instructions
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={selected.instructions}
                  onChange={(e) => setSelected({ ...selected, instructions: e.target.value })}
                />
              </label>
              <button type="submit" className="admin-primary">
                Save exercise
              </button>
            </fieldset>
          </form>
          {selected.version > 0 ? (
            <fieldset disabled={frozen || dirty || query.isError}>
              <legend>Demonstration</legend>
              <p>
                {selected.demonstration
                  ? 'A clip is ready in linked workouts.'
                  : 'Optional: add a short demonstration.'}
              </p>
              <p>
                MP4 (H.264), up to 25 MB and ten minutes. Clips play silently; add written
                instructions above.
              </p>
              <label>
                {selected.demonstration ? 'Replace MP4' : 'Add MP4'}
                <input
                  type="file"
                  accept="video/mp4,.mp4"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (file.size > MAX_FITNESS_CLIP_BYTES || !file.size) {
                      setError('Choose an MP4 up to 25 MB.');
                      return;
                    }
                    const input = command(),
                      id = selected.id;
                    void execute(() => fitnessLibraryApi.upload(id, input, file));
                  }}
                />
              </label>
              {selected.demonstration ? (
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => {
                    if (
                      !window.confirm(
                        'Remove this demonstration from every linked workout? Exercise details and completion history stay.',
                      )
                    )
                      return;
                    const input = command(),
                      id = selected.id;
                    void execute(() => fitnessLibraryApi.remove(id, input, 'remove-video'));
                  }}
                >
                  Remove demonstration
                </button>
              ) : null}
            </fieldset>
          ) : (
            <p>Save the exercise to add its demonstration.</p>
          )}
          {selected.version > 0 ? (
            <button
              type="button"
              className="admin-danger"
              disabled={frozen || query.isError}
              onClick={() => {
                if (
                  !window.confirm(
                    'Remove this library exercise and its clip? Saved workout names, weights, sets, reps and ticks will remain.',
                  )
                )
                  return;
                const input = command(),
                  id = selected.id;
                void execute(() => fitnessLibraryApi.remove(id, input, 'archive'));
              }}
            >
              Remove library exercise
            </button>
          ) : null}
          {dirty && selected.version > 0 ? (
            <p>Save your instructions before changing the video.</p>
          ) : null}
          <p role="status">{busy ? 'Saving…' : message}</p>
          {error ? (
            <div role="alert">
              <p>{error}</p>
              {hasPending ? (
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy}
                  onClick={() => void execute()}
                >
                  Retry same update
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    void query.refetch().then((result) => {
                      if (result.data)
                        choose(result.data.exercises.find((e) => e.id === selected.id) ?? fresh());
                    });
                  }}
                >
                  Reload exercise
                </button>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </AdminPage>
  );
}
