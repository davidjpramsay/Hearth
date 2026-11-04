import { describe, it, expect } from 'vitest';
import { fitnessStreak, fitnessWorkouts } from './fitness.js';
import { type FitnessPlanVersion, type FitnessProgress, type FitnessWorkout } from '@hearth/shared';
const workout: FitnessWorkout = {
  id: 'workout_run',
  title: 'Run',
  activity: 'running',
  days: ['mon', 'wed', 'fri'],
  durationMinutes: 30,
  distanceKm: null,
  notes: '',
  exercises: [],
};
const plan: FitnessPlanVersion = {
  revision: 1,
  effectiveFrom: '2026-08-03',
  configuration: {
    selectedMemberIds: ['member_ari'],
    plans: [{ memberId: 'member_ari', goals: [], weeklyFocus: '', workouts: [workout] }],
  },
};
const done = (date: string, id = 'workout_run'): FitnessProgress => ({
  localDate: date,
  memberId: 'member_ari',
  workoutId: id,
  isCompleted: true,
  version: 1,
});
describe('Fitness scheduled-day streaks', () => {
  it('does not break on rest days or unfinished today', () => {
    for (const today of ['2026-08-03', '2026-08-04', '2026-08-05'])
      expect(fitnessStreak([plan], [done('2026-08-03')], 'member_ari', today)).toEqual({
        current: 1,
        best: 1,
      });
  });
  it('counts scheduled days, not calendar days or weeks', () => {
    expect(
      fitnessStreak(
        [plan],
        [done('2026-08-03'), done('2026-08-05'), done('2026-08-07')],
        'member_ari',
        '2026-08-10',
      ),
    ).toEqual({ current: 3, best: 3 });
  });
  it('breaks after a missed day, retaining best', () => {
    expect(
      fitnessStreak([plan], [done('2026-08-03'), done('2026-08-05')], 'member_ari', '2026-08-08'),
    ).toEqual({ current: 0, best: 2 });
    expect(
      fitnessStreak(
        [plan],
        [done('2026-08-03'), done('2026-08-05'), done('2026-08-10')],
        'member_ari',
        '2026-08-10',
      ),
    ).toEqual({ current: 1, best: 2 });
  });
  it('requires every session, and undo recalculates', () => {
    const multi = JSON.parse(JSON.stringify(plan)) as FitnessPlanVersion;
    multi.configuration.plans[0]!.workouts.push({
      ...workout,
      id: 'workout_swim',
      activity: 'swimming',
    });
    expect(fitnessStreak([multi], [done('2026-08-03')], 'member_ari', '2026-08-03')).toEqual({
      current: 0,
      best: 0,
    });
    expect(
      fitnessStreak(
        [multi],
        [done('2026-08-03'), done('2026-08-03', 'workout_swim')],
        'member_ari',
        '2026-08-03',
      ),
    ).toEqual({ current: 1, best: 1 });
    expect(
      fitnessStreak(
        [multi],
        [done('2026-08-03'), { ...done('2026-08-03', 'workout_swim'), isCompleted: false }],
        'member_ari',
        '2026-08-03',
      ),
    ).toEqual({ current: 0, best: 0 });
  });
  it('uses each date’s plan, including unselected periods', () => {
    const paused = {
      ...plan,
      revision: 2,
      effectiveFrom: '2026-08-04',
      configuration: { ...plan.configuration, selectedMemberIds: [] },
    };
    const resumed = { ...plan, revision: 3, effectiveFrom: '2026-08-10' };
    expect(
      fitnessStreak(
        [plan, paused, resumed],
        [done('2026-08-03'), done('2026-08-10')],
        'member_ari',
        '2026-08-10',
      ),
    ).toEqual({ current: 2, best: 2 });
    expect(fitnessWorkouts([plan, paused, resumed], 'member_ari', '2026-08-05')).toEqual([]);
  });
  it('cannot erase missed old days by changing the plan', () => {
    const edited = JSON.parse(JSON.stringify(plan)) as FitnessPlanVersion;
    edited.revision = 2;
    edited.effectiveFrom = '2026-08-06';
    edited.configuration.plans[0]!.workouts[0]!.days = ['fri'];
    expect(
      fitnessStreak(
        [plan, edited],
        [done('2026-08-03'), done('2026-08-07')],
        'member_ari',
        '2026-08-07',
      ),
    ).toEqual({ current: 1, best: 1 });
  });
  it('does not count unscheduled, future or other-person checks', () => {
    expect(
      fitnessStreak(
        [plan],
        [
          done('2026-08-04'),
          done('2026-08-05'),
          { ...done('2026-08-03'), memberId: 'member_other' },
        ],
        'member_ari',
        '2026-08-04',
      ),
    ).toEqual({ current: 0, best: 0 });
  });
  it('preserves workout details and applies selected weekdays across year boundaries', () => {
    const p = { ...plan, effectiveFrom: '2026-01-01' };
    expect(fitnessWorkouts([p], 'member_ari', '2027-01-01')).toEqual([workout]);
    expect(fitnessWorkouts([p], 'member_ari', '2027-01-02')).toEqual([]);
  });
});

it('combines active goal routines and counts the scheduled day only when all are done', () => {
  const goals = [
    { id: 'goal_run', title: 'Run 5 km', targetDate: null, achieved: false },
    { id: 'goal_swim', title: 'Swim confidently', targetDate: null, achieved: false },
  ];
  const grouped: FitnessPlanVersion = {
    ...plan,
    configuration: {
      ...plan.configuration,
      plans: [
        {
          ...plan.configuration.plans[0]!,
          goals,
          workouts: [
            { ...workout, goalId: 'goal_run' },
            {
              ...workout,
              id: 'workout_swim',
              activity: 'swimming',
              goalId: 'goal_swim',
              days: ['mon', 'thu'],
            },
          ],
        },
      ],
    },
  };
  expect(fitnessWorkouts([grouped], 'member_ari', '2026-08-03')).toHaveLength(2);
  expect(fitnessWorkouts([grouped], 'member_ari', '2026-08-05').map((w) => w.goalId)).toEqual([
    'goal_run',
  ]);
  expect(fitnessWorkouts([grouped], 'member_ari', '2026-08-06').map((w) => w.goalId)).toEqual([
    'goal_swim',
  ]);
  expect(fitnessStreak([grouped], [done('2026-08-03')], 'member_ari', '2026-08-03').current).toBe(
    0,
  );
  const checks = [done('2026-08-03'), done('2026-08-03', 'workout_swim')];
  expect(fitnessStreak([grouped], checks, 'member_ari', '2026-08-03').current).toBe(1);
  const next: FitnessPlanVersion = {
    ...grouped,
    revision: 2,
    effectiveFrom: '2026-08-04',
    configuration: {
      ...grouped.configuration,
      plans: [
        {
          ...grouped.configuration.plans[0]!,
          goals: goals.map((g) => ({ ...g, achieved: g.id === 'goal_run' })),
        },
      ],
    },
  };
  expect(fitnessWorkouts([grouped, next], 'member_ari', '2026-08-05')).toEqual([]);
  expect(fitnessWorkouts([grouped, next], 'member_ari', '2026-08-06')).toHaveLength(1);
  expect(fitnessWorkouts([grouped, next], 'member_ari', '2026-08-03')).toHaveLength(2);
  expect(fitnessStreak([grouped, next], checks, 'member_ari', '2026-08-06').current).toBe(1);
});
