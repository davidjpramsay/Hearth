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
