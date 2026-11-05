import { it, expect } from 'vitest';
import {
  FitnessConfigurationSchema,
  FitnessWorkoutSchema,
  SetFitnessCompletionSchema,
} from './fitness.js';
const workout = {
  id: 'workout_one',
  title: 'Weights',
  activity: 'weights',
  days: ['sun'],
  durationMinutes: null,
  distanceKm: null,
  notes: '',
  exercises: [{ id: 'exercise_one', name: 'Squat', weightKg: 12.5, sets: 3, reps: 10 }],
};
it('preserves nullable measurements and distinct explicit zero weight', () => {
  expect(FitnessWorkoutSchema.parse(workout)).toEqual(workout);
  expect(
    FitnessWorkoutSchema.parse({
      ...workout,
      exercises: [{ ...workout.exercises[0], weightKg: 0 }],
    }).exercises[0]?.weightKg,
  ).toBe(0);
});
it('bounds schedules, details, numbers and identifiers', () => {
  for (const invalid of [
    { ...workout, days: [] },
    { ...workout, days: ['sun', 'sun'] },
    { ...workout, notes: 'x'.repeat(1001) },
    { ...workout, distanceKm: -1 },
    { ...workout, exercises: [{ ...workout.exercises[0], sets: 1.5 }] },
    { ...workout, exercises: Array(21).fill(workout.exercises[0]) },
    { ...workout, secret: 'not accepted' },
  ])
    expect(FitnessWorkoutSchema.safeParse(invalid).success).toBe(false);
});
it('accepts empty setup, rejects duplicate or missing plans', () => {
  expect(FitnessConfigurationSchema.parse({ selectedMemberIds: [], plans: [] })).toBeTruthy();
  expect(
    FitnessConfigurationSchema.safeParse({ selectedMemberIds: ['member_a'], plans: [] }).success,
  ).toBe(false);
  const plan = { memberId: 'member_a', weeklyFocus: '', goals: [], workouts: [workout, workout] };
  expect(
    FitnessConfigurationSchema.safeParse({ selectedMemberIds: ['member_a'], plans: [plan] })
      .success,
  ).toBe(false);
});
it('rejects invalid dates and stale-version shapes before commands', () => {
  expect(
    SetFitnessCompletionSchema.safeParse({
      requestId: 'request_one',
      memberId: 'member_a',
      workoutId: 'workout_one',
      localDate: '2026-02-30',
      planRevision: 1,
      expectedVersion: 0,
      isCompleted: true,
    }).success,
  ).toBe(false);
});

it('links workouts only to a goal owned by the same person', () => {
  const goal = {
    id: 'goal_run',
    title: 'Run 5 km',
    targetDate: null,
    achieved: false,
    weeklyFocus: 'Build consistency',
  };
  const config = {
    selectedMemberIds: ['member_a'],
    plans: [
      {
        memberId: 'member_a',
        weeklyFocus: '',
        goals: [goal],
        workouts: [{ ...workout, goalId: goal.id }],
      },
      {
        memberId: 'member_b',
        weeklyFocus: '',
        goals: [{ ...goal, id: 'goal_other' }],
        workouts: [],
      },
    ],
  };
  expect(FitnessConfigurationSchema.parse(config)).toEqual(config);
  for (const goalId of ['goal_missing', 'goal_other']) {
    const changed = {
      ...config,
      plans: [{ ...config.plans[0], workouts: [{ ...workout, goalId }] }, config.plans[1]],
    };
    expect(FitnessConfigurationSchema.safeParse(changed).success).toBe(false);
  }
});
it('does not inject goal defaults into original commands and change their replay hash', () => {
  const original = {
    selectedMemberIds: ['member_a'],
    plans: [{ memberId: 'member_a', weeklyFocus: 'Kept focus', goals: [], workouts: [workout] }],
  };
  expect(JSON.stringify(FitnessConfigurationSchema.parse(original))).toBe(JSON.stringify(original));
});

it('accepts a general-fitness class without creating a goal or filling optional details', () => {
  for (const goal of [{}, { goalId: null }]) {
    const original = {
      selectedMemberIds: ['member_a'],
      plans: [
        {
          memberId: 'member_a',
          weeklyFocus: '',
          goals: [],
          workouts: [
            { ...workout, ...goal, title: 'Fitness class', activity: 'class', exercises: [] },
          ],
        },
      ],
    };
    expect(FitnessConfigurationSchema.parse(original)).toEqual(original);
  }
});
