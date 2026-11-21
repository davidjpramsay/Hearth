import { addLocalDays, localDateInTimezone } from '@hearth/core';
import { NbaDataSchema, NbaTeamIdSchema, NbaPlayerIdSchema, type NbaData } from '@hearth/shared';
import { z } from 'zod';
import { boundResponse } from './bounded-response.js';

export interface NbaProvider {
  readonly source: 'ESPN' | 'Fictional demo';
  read(weekStart: string, timezone: string): Promise<NbaData>;
}
const text = z.string().max(200);
const team = z.object({ id: z.string().max(20) });
const leader = z.object({
  name: text,
  leaders: z
    .array(
      z.object({
        value: z.number().finite(),
        athlete: z.object({ displayName: text, id: z.unknown().optional() }),
      }),
    )
    .max(30),
});
const scoreboard = z.object({
  leagues: z
    .array(z.object({ season: z.object({ displayName: text, type: z.object({ name: text }) }) }))
    .min(1)
    .max(5),
  events: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        season: z.object({ type: z.number() }),
        status: z.object({
          type: z.object({
            name: text,
            state: z.enum(['pre', 'in', 'post']),
            completed: z.boolean(),
            shortDetail: text,
          }),
        }),
        competitions: z
          .array(
            z.object({
              competitors: z
                .array(
                  z.object({
                    homeAway: z.enum(['home', 'away']),
                    team,
                    score: z.string().max(10).optional(),
                    leaders: z.array(leader).max(20).optional(),
                  }),
                )
                .length(2),
            }),
          )
          .min(1)
          .max(5),
      }),
    )
    .max(999), // Reaching the requested limit may mean truncation. Do not publish it.
});
const standings = z.object({
  season: z.object({ displayName: text }),
  children: z
    .array(
      z.object({
        name: text,
        standings: z.object({
          entries: z
            .array(
              z.object({
                team,
                stats: z
                  .array(
                    z.object({
                      name: text,
                      value: z.number().finite().optional(),
                      displayValue: text.optional(),
                    }),
                  )
                  .max(100),
              }),
            )
            .length(15),
        }),
      }),
    )
    .length(2),
});
// ESPN's daily scoreboards use US Eastern dates, not UTC or household-local dates.
const SCOREBOARD_TIMEZONE = 'America/New_York';
const SCOREBOARD_ORIGIN = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

/** Public read feed, no key. Fixed origins only; no browser cookies/third-party assets. */
export class EspnNbaProvider implements NbaProvider {
  readonly source = 'ESPN' as const;
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async read(weekStart: string, timezone: string): Promise<NbaData> {
    const end = addLocalDays(weekStart, 14);
    const { table, boards } = await this.feeds(weekStart);
    const season = boards[0]!.leagues[0]!.season;
    if (boards.some((board) => board.leagues[0]!.season.displayName !== table.season.displayName))
      throw new Error('NBA season feeds disagree.');
    const rows: NbaData['standings'] = [];
    for (const conference of table.children) {
      const label =
        conference.name === 'Eastern Conference'
          ? 'East'
          : conference.name === 'Western Conference'
            ? 'West'
            : null;
      if (!label) throw new Error('Unknown NBA conference.');
      for (const [index, entry] of conference.standings.entries.entries()) {
        const stat = (name: string) => entry.stats.find((item) => item.name === name);
        rows.push({
          teamId: entry.team.id,
          conference: label,
          rank: stat('playoffSeed')?.value ?? index + 1,
          wins: stat('wins')!.value!,
          losses: stat('losses')!.value!,
          winPercent: stat('winPercent')!.value!,
          gamesBehind: stat('gamesBehind')!.value!,
          streak: stat('streak')?.displayValue ?? '—',
        });
      }
    }
    if (new Set(rows.map((row) => row.teamId)).size !== 30)
      throw new Error('Incomplete NBA standings.');
    const games = new Map<string, NbaData['games'][number]>();
    const performances: NbaData['highlights'] = [];
    for (const event of boards.flatMap((board) => board.events)) {
      if (games.has(event.id)) continue;
      const localDate = localDateInTimezone(new Date(event.date).toISOString(), timezone);
      if (localDate < weekStart || localDate >= end) continue;
      const competitors = event.competitions[0]!.competitors;
      const home = competitors.find((item) => item.homeAway === 'home');
      const away = competitors.find((item) => item.homeAway === 'away');
      if (!home || !away) throw new Error('Incomplete NBA game.');
      // The module covers the 30 NBA clubs, not All-Star squads or overseas opponents.
      if (
        !NbaTeamIdSchema.safeParse(home.team.id).success ||
        !NbaTeamIdSchema.safeParse(away.team.id).success
      )
        continue;
      const status = event.status.type;
      const state = status.name.includes('POSTPONED')
        ? 'postponed'
        : status.name.includes('CANCEL')
          ? 'cancelled'
          : status.completed
            ? 'final'
            : status.state === 'in'
              ? 'in-progress'
              : 'scheduled';
      const hasScore = state === 'final' || state === 'in-progress';
      const phase =
        event.season.type === 1
          ? 'Preseason'
          : event.season.type === 2
            ? 'Regular season'
            : event.season.type === 3
              ? 'Playoffs'
              : 'Other';
      games.set(event.id, {
        id: event.id,
        localDate,
        startsAt: new Date(event.date).toISOString(),
        homeTeamId: home.team.id,
        awayTeamId: away.team.id,
        homeScore: hasScore ? Number(home.score) : null,
        awayScore: hasScore ? Number(away.score) : null,
        status: state,
        detail: status.shortDetail,
        phase,
      });
      if (state === 'final' && localDate < addLocalDays(weekStart, 7)) {
        for (const side of competitors)
          for (const category of ['points', 'rebounds', 'assists'] as const) {
            for (const mark of side.leaders?.find((item) => item.name === category)?.leaders ??
              []) {
              const playerId = NbaPlayerIdSchema.safeParse(mark.athlete.id);
              performances.push({
                category,
                player: mark.athlete.displayName,
                playerId: playerId.success ? playerId.data : null,
                teamId: side.team.id,
                value: mark.value,
                gameId: event.id,
                localDate,
              });
            }
          }
      }
    }
    const best = { points: 0, rebounds: 0, assists: 0 };
    for (const mark of performances)
      best[mark.category] = Math.max(best[mark.category], mark.value);
    const highlights = performances.filter(
      (mark) => mark.value > 0 && mark.value === best[mark.category],
    );
    return NbaDataSchema.parse({
      season: season.displayName,
      phase: season.type.name,
      standings: rows,
      games: [...games.values()].sort(
        (a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id),
      ),
      highlights,
    });
  }

  private async feeds(weekStart: string) {
    // One padded day at each edge covers all household timezones, including DST.
    // Whole months can exceed the byte cap; ESPN rejects multi-day date ranges.
    const days = Array.from({ length: 16 }, (_, i) => addLocalDays(weekStart, i - 1));
    const requests = [
      { day: null, url: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings' },
      ...days.map((day) => ({
        day,
        url: `${SCOREBOARD_ORIGIN}/scoreboard?dates=${day.replaceAll('-', '')}&limit=1000`,
      })),
    ];
    const controller = new AbortController();
    // Bound the complete projection, including queued requests and all body reads.
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let cursor = 0;
    let table: z.infer<typeof standings> | undefined;
    const boards: z.infer<typeof scoreboard>[] = new Array(days.length);
    const worker = async () => {
      while (cursor < requests.length) {
        controller.signal.throwIfAborted();
        const index = cursor++;
        const request = requests[index]!;
        const data = await this.json(request.url, controller.signal);
        controller.signal.throwIfAborted();
        if (request.day === null) table = standings.parse(data);
        else {
          const board = scoreboard.parse(data);
          // Reject an ignored date parameter/month fallback rather than publish a partial week.
          if (
            board.events.some(
              (event) => localDateInTimezone(event.date, SCOREBOARD_TIMEZONE) !== request.day,
            )
          )
            throw new Error('NBA scoreboard date coverage disagrees.');
          boards[index - 1] = board;
        }
      }
    };
    try {
      await Promise.all(Array.from({ length: 4 }, worker));
      if (!table) throw new Error('Incomplete NBA standings.');
      return { table, boards };
    } finally {
      // A failed day must cancel siblings and prevent further queued requests.
      controller.abort();
      clearTimeout(timeout);
    }
  }

  private async json(url: string, signal: AbortSignal): Promise<unknown> {
    const response = await this.fetcher(url, {
      signal,
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('NBA feed is unavailable.');
    const bounded = await boundResponse(response, 4 * 1024 * 1024, signal);
    return await bounded.json();
  }
}

export class DemoNbaProvider implements NbaProvider {
  readonly source = 'Fictional demo' as const;
  async read(weekStart: string, timezone: string): Promise<NbaData> {
    const { NBA_TEAMS } = await import('@hearth/shared');
    const east = new Set([
      '1',
      '2',
      '17',
      '30',
      '4',
      '5',
      '8',
      '11',
      '14',
      '15',
      '18',
      '19',
      '20',
      '28',
      '27',
    ]);
    const ranks = { East: 0, West: 0 };
    const games = Array.from({ length: 22 }, (_, i) => {
      const startsAt = `${addLocalDays(weekStart, Math.floor(i / 2))}T01:00:00.000Z`;
      return {
        id: String(1000 + i),
        startsAt,
        localDate: localDateInTimezone(startsAt, timezone),
        homeTeamId: NBA_TEAMS[i % 30]![0],
        awayTeamId: NBA_TEAMS[(i + 6) % 30]![0],
        homeScore: i < 6 ? 114 + i : null,
        awayScore: i < 6 ? 108 + i : null,
        status: i < 6 ? 'final' : 'scheduled',
        detail: i < 6 ? 'Final' : 'Scheduled',
        phase: 'Regular season',
      };
    });
    return NbaDataSchema.parse({
      season: 'Demo season',
      phase: 'Fictional demo',
      games,
      standings: NBA_TEAMS.map(([teamId]) => {
        const conference = east.has(teamId) ? 'East' : 'West';
        const rank = ++ranks[conference];
        return {
          teamId,
          conference,
          rank,
          wins: 49 - rank,
          losses: 15 + rank,
          winPercent: (49 - rank) / 64,
          gamesBehind: rank - 1,
          streak: rank % 2 ? 'W3' : 'L1',
        };
      }),
      highlights: (['points', 'rebounds', 'assists'] as const).map((category, i) => ({
        category,
        value: [42, 19, 14][i],
        player: ['Jordan Example', 'Taylor Sample', 'Casey Demo'][i],
        teamId: NBA_TEAMS[i]![0],
        gameId: String(1000 + i),
        localDate: addLocalDays(weekStart, Math.floor(i / 2)),
      })),
    });
  }
}
