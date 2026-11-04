import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import type { ModuleId } from '@hearth/shared';
import { modulesApi } from '../api/modules';
import { queryKeys } from '../api/queryKeys';
import { ModulesContext } from './context';

const domains: Partial<Record<ModuleId, readonly string[]>> = {
  calendar: ['week', 'month', 'calendar-connection'],
  weather: ['weather', 'weather-location', 'indoor-climate', 'indoor-climate-settings'],
  reminders: ['reminders'],
  chores: ['chores', 'chore-occurrence', 'chore-templates', 'pocket-money'],
  lists: ['lists', 'list-settings'],
  meals: ['meals', 'saved-meal-library'],
  home: ['home', 'home-assistant-connection'],
  photos: ['photos', 'photo-source'],
  games: ['games', 'word-groups'],
  nba: ['nba', 'nba-settings'],
  fitness: ['fitness', 'fitness-settings', 'fitness-library'],
  morningRoutine: ['morning-routine', 'morning-routine-settings'],
};
export function ModulesProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.modules,
    queryFn: ({ signal }) => modulesApi.get(signal),
    retry: false,
    networkMode: 'online',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const flags = query.data?.enabled;
  useEffect(() => {
    if (!flags) return;
    const disabled = new Set(
      Object.entries(domains).flatMap(([id, keys]) => (flags[id as ModuleId] ? [] : keys)),
    );
    const household = query.data?.householdId;
    const predicate = (item: { queryKey: readonly unknown[] }) =>
      item.queryKey[0] === household && disabled.has(String(item.queryKey[1]));
    void client.cancelQueries({ predicate }).then(() => client.removeQueries({ predicate }));
  }, [client, flags, query.data]);
  if (!flags)
    return (
      <main className="runtime-gate" aria-busy={query.isPending}>
        <img alt="" src="/brand/hearth-mark.png" />
        <h1>{query.isError ? 'Could not load Hearth modules' : 'Loading Hearth'}</h1>
        {query.isError ? (
          <>
            <p role="alert">Check the connection to this home, then try again.</p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </>
        ) : null}
      </main>
    );
  return <ModulesContext value={flags}>{children}</ModulesContext>;
}
