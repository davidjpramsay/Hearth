import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DailyVerseSummary } from '@hearth/shared';
import { dailyVerseApi } from '../api/dailyVerse';
import { queryKeys } from '../api/queryKeys';
import { calendarRefreshPolicy } from '../hooks/calendarRefreshPolicy';
import { DailyVerseDetailsDialog } from './DailyVerseDetailsDialog';
import { SummaryBand } from './SummaryBand';

export function MorningRoutineVerse({
  period = 'morning',
  entry = false,
}: {
  period?: 'morning' | 'afternoon';
  entry?: boolean;
}) {
  const query = useQuery({
    queryKey: queryKeys.dailyVerse,
    queryFn: ({ signal }) => dailyVerseApi.get(signal),
    ...calendarRefreshPolicy,
    retry: false,
  });
  const [selected, setSelected] = useState<DailyVerseSummary | null>(null);
  const verse = query.data;
  const stale = query.isError || verse?.freshness === 'stale';
  return (
    <>
      <SummaryBand
        ariaLabel={verse ? `Read ${verse.reference}` : 'Refresh daily verse'}
        className="morning-verse"
        focus={{
          'data-focus-id': 'morning-daily-verse',
          'data-focus-left': `nav-${period}`,
          ...(entry ? { 'data-focus-entry': 'true' as const } : {}),
        }}
        icon="book-open"
        label={stale && verse ? 'Daily verse · saved' : 'Daily verse'}
        onActivate={(event) => {
          // Safari taps do not focus buttons, but the shared dialog restores its opener's focus.
          event.currentTarget.focus({ preventScroll: true });
          if (verse)
            setSelected(
              query.isError
                ? {
                    ...verse,
                    freshness: 'stale',
                    statusMessage: 'Showing a saved verse. Check your connection to refresh it.',
                  }
                : verse,
            );
          else if (!query.isFetching) void query.refetch();
        }}
      >
        {verse
          ? `${verse.reference} · ${verse.text}`
          : query.isPending
            ? 'Loading today’s verse…'
            : 'Today’s verse isn’t available yet. Select to try again.'}
      </SummaryBand>
      <DailyVerseDetailsDialog verse={selected} onClose={() => setSelected(null)} />
    </>
  );
}
