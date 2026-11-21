import { describe, expect, it, vi } from 'vitest';
import { NBA_TEAMS } from '@hearth/shared';
import { localDateInTimezone } from '@hearth/core';
import { EspnNbaProvider } from './nba-provider.js';
import { NbaService } from '../nba-service.js';

const table = () => ({
  season: { displayName: '2026-27' },
  children: ['Eastern Conference', 'Western Conference'].map((name, side) => ({
    name,
    standings: {
      entries: NBA_TEAMS.slice(side * 15, side * 15 + 15).map(([id], i) => ({
        team: { id },
        stats: [
          { name: 'wins', value: 10 },
          { name: 'losses', value: 5 },
          { name: 'winPercent', value: 2 / 3 },
          { name: 'gamesBehind', value: 0 },
          { name: 'playoffSeed', value: i + 1 },
          { name: 'streak', displayValue: 'W2' },
        ],
      })),
    },
  })),
});
const event = (id: string, date: string, completed = true, value = 42) => ({
  id,
  date,
  season: { type: 1 },
  status: {
    type: {
      name: completed ? 'STATUS_FINAL' : 'STATUS_SCHEDULED',
      state: completed ? 'post' : 'pre',
      completed,
      shortDetail: completed ? 'Final' : 'Scheduled',
    },
  },
  competitions: [
    {
      competitors: ['home', 'away'].map((homeAway, i) => ({
        homeAway,
        team: { id: String(i + 1) },
        score: completed ? String(110 + i) : '0',
        leaders: [
          {
            name: 'points',
            leaders: [
              { value, athlete: { displayName: `Example Player ${i}`, id: String(1966 + i) } },
            ],
          },
        ],
      })),
    },
  ],
});
const board = (events: ReturnType<typeof event>[] = []) => ({
  leagues: [{ season: { displayName: '2026-27', type: { name: 'Preseason' } } }],
  events,
});
function harness(events: ReturnType<typeof event>[]) {
  const response = (url: string) => {
    if (url.endsWith('/standings')) return Response.json(table());
    const date = new URL(url).searchParams.get('dates')!;
    expect(date).toMatch(/^\d{8}$/);
    const day = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    return Response.json(
      board(events.filter((item) => localDateInTimezone(item.date, 'America/New_York') === day)),
    );
  };
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => response(String(url)));
  return { fetcher, response, provider: new EspnNbaProvider(fetcher) };
}
describe('bounded ESPN NBA adapter', () => {
  it('missing or malformed optional artwork identity cannot break the score projection', async () => {
    const h = harness([]);
    const raw = board([event('1', '2026-10-20T01:00:00Z')]);
    const invalid = JSON.parse(JSON.stringify(raw));
    invalid.events[0].competitions[0].competitors[0].leaders[0].leaders[0].athlete.id =
      'https://untrusted.invalid/image';
    invalid.events[0].competitions[0].competitors[1].leaders[0].leaders[0].athlete.id = null;
    h.fetcher.mockImplementation(async (url) =>
      String(url).includes('dates=20261019') ? Response.json(invalid) : h.response(String(url)),
    );
    const data = await h.provider.read('2026-10-19', 'UTC');
    expect(data.games).toHaveLength(1);
    expect(data.highlights.every((mark) => mark.playerId === null)).toBe(true);
  });
  it('aborts stalled provider requests at eight seconds', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
              once: true,
            }),
          ),
      );
      const failed = expect(new EspnNbaProvider(fetcher).read('2026-10-19', 'UTC')).rejects.toThrow(
        'aborted',
      );
      await vi.advanceTimersByTimeAsync(8_000);
      await failed;
      expect(fetcher.mock.calls.every(([, init]) => init?.signal?.aborted)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it('covers complete local weeks across a month boundary with padded daily requests, ties and preseason labels', async () => {
    const h = harness([
      event('1', '2026-10-25T15:59:00Z'), // Perth Sunday: exclude
      event('2', '2026-10-25T16:00:00Z'), // Monday midnight
      event('3', '2026-11-07T16:00:00Z', false),
      event('4', '2026-11-08T16:00:00Z'), // following Monday: exclude
    ]);
    const data = await h.provider.read('2026-10-26', 'Australia/Perth');
    const urls = h.fetcher.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls).toHaveLength(17);
    expect(new Set(urls.map((url) => url.href)).size).toBe(17);
    expect(urls.every((url) => url.origin === 'https://site.api.espn.com')).toBe(true);
    expect(urls[0]?.pathname).toBe('/apis/v2/sports/basketball/nba/standings');
    expect(urls.slice(1).map((url) => url.searchParams.get('dates'))).toEqual([
      '20261025',
      '20261026',
      '20261027',
      '20261028',
      '20261029',
      '20261030',
      '20261031',
      '20261101',
      '20261102',
      '20261103',
      '20261104',
      '20261105',
      '20261106',
      '20261107',
      '20261108',
      '20261109',
    ]);
    expect(urls.slice(1).every((url) => url.searchParams.get('limit') === '1000')).toBe(true);
    expect(data.games.map((game) => game.id)).toEqual(['2', '3']);
    expect(data.games[0]?.localDate).toBe('2026-10-26');
    expect(data.games[1]?.homeScore).toBeNull();
    expect(data.phase).toBe('Preseason');
    expect(data.standings).toHaveLength(30);
    expect(data.highlights).toHaveLength(2);
    expect(data.highlights.map((mark) => mark.playerId)).toEqual(['1966', '1967']);
  });
  it('respects the DST Sunday boundary, not a fixed 14×24h window', async () => {
    const h = harness([event('1', '2026-11-02T04:59:00Z'), event('2', '2026-11-02T05:00:00Z')]);
    const data = await h.provider.read('2026-10-19', 'America/New_York');
    expect(data.games.map((game) => game.id)).toEqual(['1']);
  });
  it('does not include next week’s bigger result in this week’s best', async () => {
    const h = harness([
      event('1', '2026-10-20T01:00:00Z', true, 35),
      event('2', '2026-10-27T01:00:00Z', true, 80),
    ]);
    expect(
      (await h.provider.read('2026-10-19', 'Australia/Perth')).highlights.every(
        (mark) => mark.value === 35,
      ),
    ).toBe(true);
  });
  it('fails closed for incomplete standings and a limit-sized possibly truncated day', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ children: [] }));
    await expect(new EspnNbaProvider(fetcher).read('2026-10-19', 'UTC')).rejects.toThrow();
    const h = harness(
      Array.from({ length: 1000 }, (_, i) => event(String(i), '2026-10-20T01:00:00Z')),
    );
    await expect(h.provider.read('2026-10-19', 'UTC')).rejects.toThrow();
  });
  it('does not follow redirects or expose a raw provider response', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('private diagnostic', { status: 403 }));
    await expect(new EspnNbaProvider(fetcher).read('2026-10-19', 'UTC')).rejects.toThrow(
      'NBA feed is unavailable.',
    );
    expect(fetcher.mock.calls[0]?.[1]?.redirect).toBe('error');
  });
  it('bounds decoded bytes', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('x'.repeat(4 * 1024 * 1024 + 1)));
    await expect(new EspnNbaProvider(fetcher).read('2026-10-19', 'UTC')).rejects.toThrow(
      'safe size limit',
    );
  });

  it.each([
    ['Pacific/Kiritimati', '2026-12-27T10:00:00Z', '2027-01-10T10:00:00Z'],
    ['Etc/GMT+12', '2026-12-28T12:00:00Z', '2027-01-11T12:00:00Z'],
  ])('covers both local midnight edges in %s across a year boundary', async (zone, start, end) => {
    const h = harness([
      event('1', new Date(Date.parse(start) - 1).toISOString()),
      event('2', start),
      event('3', new Date(Date.parse(end) - 1).toISOString()),
      event('4', end),
    ]);
    expect((await h.provider.read('2026-12-28', zone)).games.map((game) => game.id)).toEqual([
      '2',
      '3',
    ]);
  });

  it('accepts genuinely empty days without losing later next-week games', async () => {
    const h = harness([event('1', '2026-11-01T23:30:00Z', false)]);
    const data = await h.provider.read('2026-10-19', 'America/New_York');
    expect(data.games.map((game) => game.id)).toEqual(['1']);
    expect(data.games[0]?.localDate).toBe('2026-11-01');
    expect(h.fetcher).toHaveBeenCalledTimes(17);
  });

  it('rejects a provider that ignores the requested day instead of publishing a partial month', async () => {
    const h = harness([]);
    h.fetcher.mockImplementation(async (url) =>
      Response.json(
        String(url).endsWith('/standings') ? table() : board([event('1', '2026-10-20T01:00:00Z')]),
      ),
    );
    await expect(h.provider.read('2026-10-19', 'UTC')).rejects.toThrow('date coverage');
    expect(h.fetcher.mock.calls.every(([, init]) => init?.signal?.aborted)).toBe(true);
    expect(h.fetcher.mock.calls.length).toBeLessThan(17);
  });

  it('rejects a missing events array, malformed day or later season disagreement', async () => {
    for (const invalid of [
      { leagues: board().leagues },
      board([event('1', 'invalid-date')]),
      {
        ...board(),
        leagues: [{ season: { displayName: '2025-26', type: { name: 'Regular Season' } } }],
      },
    ]) {
      const h = harness([]);
      h.fetcher.mockImplementation(async (url) =>
        String(url).includes('dates=20261028') ? Response.json(invalid) : h.response(String(url)),
      );
      await expect(h.provider.read('2026-10-19', 'UTC')).rejects.toThrow();
    }
  });

  it('limits the whole projection to four concurrent requests and stops at the shared eight-second deadline', async () => {
    vi.useFakeTimers();
    try {
      const h = harness([]);
      let active = 0;
      let peak = 0;
      h.fetcher.mockImplementation(
        (url, init) =>
          new Promise((resolve, reject) => {
            active++;
            peak = Math.max(peak, active);
            const abort = () => {
              clearTimeout(timer);
              active--;
              reject(new Error('aborted'));
            };
            const timer = setTimeout(() => {
              init?.signal?.removeEventListener('abort', abort);
              active--;
              resolve(h.response(String(url)));
            }, 3_000);
            init?.signal?.addEventListener('abort', abort, { once: true });
          }),
      );
      const failed = expect(h.provider.read('2026-10-19', 'UTC')).rejects.toThrow('aborted');
      expect(h.fetcher).toHaveBeenCalledTimes(4);
      await vi.advanceTimersByTimeAsync(7_999);
      expect(h.fetcher).toHaveBeenCalledTimes(12);
      await vi.advanceTimersByTimeAsync(1);
      await failed;
      expect(peak).toBe(4);
      expect(active).toBe(0);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(h.fetcher).toHaveBeenCalledTimes(12);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the whole last-good fortnight stale after one daily failure, then recovers', async () => {
    const h = harness([event('1', '2026-10-20T01:00:00Z')]);
    let time = Date.parse('2026-10-20T12:00:00Z');
    const service = new NbaService(h.provider, undefined, () => new Date(time));
    const original = await service.overview('test_household', 'UTC');
    expect(original.status).toBe('current');
    h.fetcher.mockImplementation(async (url) =>
      String(url).includes('dates=20261028')
        ? new Response(null, { status: 503 })
        : h.response(String(url)),
    );
    time += 15 * 60_000;
    const stale = await service.overview('test_household', 'UTC');
    expect(stale.status).toBe('stale');
    expect(stale.data).toEqual(original.data);
    expect(stale.fetchedAt).toBe(original.fetchedAt);
    h.fetcher.mockImplementation(async (url) => h.response(String(url)));
    time += 60_000;
    expect((await service.overview('test_household', 'UTC')).status).toBe('current');
  });
});
