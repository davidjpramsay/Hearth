import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeEventSchema } from '@hearth/shared';

import { getHearthRuntime, householdId } from '../api/core';
import { getRealtimeUrl } from '../api/realtime';
import { hostedReleaseMonitor } from '../runtime/hostedRelease';

export const REALTIME_QUERY_DOMAINS: Record<string, readonly string[]> = {
  'fitness.changed': ['fitness', 'fitness-settings', 'fitness-library', 'activity'],
  'morning-routine.changed': ['morning-routine', 'morning-routine-settings', 'activity'],
  'nba.changed': ['nba', 'nba-settings', 'activity'],
  'modules.changed': [
    'modules',
    'today',
    'today-configuration',
    'admin',
    'activity',
    'home-assistant-bridge',
  ],
  'chore.changed': ['today', 'chores', 'chore-occurrence', 'pocket-money', 'activity'],
  'list.changed': ['today', 'lists', 'list-settings', 'activity'],
  'meal.changed': ['today', 'meals', 'saved-meal-library', 'activity'],
  'pocket-money.changed': ['pocket-money', 'activity'],
  'chore-template.changed': ['today', 'chores', 'chore-templates', 'pocket-money', 'activity'],
  'home.changed': ['home', 'home-assistant-connection', 'activity'],
  'today.changed': ['today', 'today-configuration', 'daily-verse', 'activity'],
  'weather.changed': [
    'weather-location',
    'weather',
    'indoor-climate',
    'indoor-climate-settings',
    'today',
    'week',
    'activity',
  ],
  'calendar.changed': [
    'today',
    'week',
    'month',
    'calendar-connection',
    'system-status',
    'activity',
  ],
  'photos.changed': ['photos', 'photo-source', 'today', 'activity'],
  'reminders.changed': ['reminders', 'today', 'activity'],
};

export function useRealtimeInvalidation(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const id = householdId(getHearthRuntime());
    const domains = new Set<string>();
    let fullCatchUp = false;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    let disconnected = true;
    let stopped = false;
    const flush = () => {
      scheduled = undefined;
      if (document.visibilityState === 'hidden') return;
      // Do not replace an in-flight optimistic command with an older server projection.
      if (queryClient.isMutating() > 0) {
        scheduled = setTimeout(flush, 1_000);
        return;
      }
      const all = fullCatchUp;
      const changed = new Set(domains);
      fullCatchUp = false;
      domains.clear();
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === id && (all || changed.has(String(query.queryKey[1]))),
      });
      if (all) void queryClient.invalidateQueries({ queryKey: ['hearth-runtime'] });
    };
    const schedule = (all = true) => {
      if (stopped) return;
      fullCatchUp ||= all;
      if (scheduled === undefined) scheduled = setTimeout(flush, 250);
    };
    const foreground = () => {
      if (document.visibilityState !== 'hidden') schedule();
    };
    const source = typeof EventSource === 'undefined' ? null : new EventSource(getRealtimeUrl());
    const connected = () => {
      disconnected = false;
      schedule();
      void hostedReleaseMonitor.check();
    };
    const receive = (message: MessageEvent<string>) => {
      let payload: unknown;
      try {
        payload = JSON.parse(message.data) as unknown;
      } catch {
        return;
      }
      const event = RealtimeEventSchema.safeParse(payload);
      if (!event.success) return;
      const affected = REALTIME_QUERY_DOMAINS[event.data.kind];
      if (affected === undefined) schedule();
      else {
        affected.forEach((domain) => domains.add(domain));
        schedule(false);
      }
    };
    source?.addEventListener('open', connected);
    source?.addEventListener('error', () => {
      disconnected = true;
    });
    const signedOut = () => {
      stopped = true;
      if (scheduled !== undefined) clearTimeout(scheduled);
      clearInterval(fallback);
      source?.close();
    };
    [...Object.keys(REALTIME_QUERY_DOMAINS), 'household.changed'].forEach((kind) =>
      source?.addEventListener(kind, receive as EventListener),
    );
    window.addEventListener('online', foreground);
    window.addEventListener('pageshow', foreground);
    document.addEventListener('visibilitychange', foreground);
    const fallback = setInterval(() => {
      if (disconnected) foreground();
    }, 60_000);
    window.addEventListener('hearth:sign-out', signedOut);
    return () => {
      if (scheduled !== undefined) clearTimeout(scheduled);
      clearInterval(fallback);
      source?.close();
      window.removeEventListener('hearth:sign-out', signedOut);
      window.removeEventListener('online', foreground);
      window.removeEventListener('pageshow', foreground);
      document.removeEventListener('visibilitychange', foreground);
    };
  }, [queryClient]);
}
