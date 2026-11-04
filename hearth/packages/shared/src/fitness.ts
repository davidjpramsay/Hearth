import { z } from 'zod';
import {
  AuditSummarySchema,
  LocalDateSchema,
  MemberSchema,
  OpaqueIdSchema,
  TimestampSchema,
  TimezoneSchema,
} from './schemas.js';

export const FITNESS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const FITNESS_DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const FITNESS_ACTIVITIES = ['running', 'swimming', 'weights', 'class'] as const;
export const FITNESS_ACTIVITY_LABELS = {
  running: 'Running',
  swimming: 'Swimming',
  weights: 'Weights',
  class: 'Fitness class',
} as const;
export const FitnessExerciseSchema = z
  .object({
    id: OpaqueIdSchema,
    name: z.string().trim().min(1).max(80),
    weightKg: z.number().min(0).max(1000).nullable(),
    sets: z.number().int().min(1).max(100).nullable(),
    reps: z.number().int().min(1).max(1000).nullable(),
  })
  .strict();
export const FitnessWorkoutSchema = z
  .object({
    id: OpaqueIdSchema,
    // Absent/null is a preserved workout from the original ungrouped plan.
    goalId: OpaqueIdSchema.nullable().optional(),
    title: z.string().trim().min(1).max(80),
    activity: z.enum(FITNESS_ACTIVITIES),
    days: z
      .array(z.enum(FITNESS_DAYS))
      .min(1)
      .max(7)
      .refine((v) => new Set(v).size === v.length, 'Choose each day once.'),
    durationMinutes: z.number().int().min(1).max(1440).nullable(),
    distanceKm: z.number().positive().max(1000).nullable(),
    notes: z.string().trim().max(1000),
    exercises: z.array(FitnessExerciseSchema).max(20),
  })
  .strict()
  .refine(
    (v) => new Set(v.exercises.map((e) => e.id)).size === v.exercises.length,
    'Exercise IDs must be unique.',
  );
export const FitnessPersonPlanSchema = z
  .object({
    memberId: OpaqueIdSchema,
    weeklyFocus: z.string().trim().max(240),
    goals: z
      .array(
        z
          .object({
            id: OpaqueIdSchema,
            title: z.string().trim().min(1).max(160),
            targetDate: LocalDateSchema.nullable(),
            achieved: z.boolean(),
            weeklyFocus: z.string().trim().max(240).optional(),
          })
          .strict(),
      )
      .max(5),
    workouts: z.array(FitnessWorkoutSchema).max(14),
  })
  .strict();
export const FitnessConfigurationSchema = z
  .object({
    selectedMemberIds: z.array(OpaqueIdSchema).max(20),
    plans: z.array(FitnessPersonPlanSchema).max(20),
  })
  .strict()
  .superRefine((v, ctx) => {
    const people = v.plans.map((p) => p.memberId);
    const workouts = v.plans.flatMap((p) => p.workouts.map((w) => w.id));
    const goals = v.plans.flatMap((p) => p.goals.map((g) => g.id));
    if (
      [people, workouts, goals, v.selectedMemberIds].some((ids) => new Set(ids).size !== ids.length)
    )
      ctx.addIssue({
        code: 'custom',
        message: 'People, goals and workouts need unique identifiers.',
      });
    for (const [i, person] of v.plans.entries()) {
      for (const [j, workout] of person.workouts.entries()) {
        if (workout.goalId != null && !person.goals.some((g) => g.id === workout.goalId))
          ctx.addIssue({
            code: 'custom',
            path: ['plans', i, 'workouts', j, 'goalId'],
            message: 'Choose a goal belonging to this person.',
          });
      }
    }
    if (v.selectedMemberIds.some((id) => !people.includes(id)))
      ctx.addIssue({
        code: 'custom',
        message: 'Every selected person needs a plan, even if empty.',
      });
  });
export const FitnessPersonSchema = MemberSchema.pick({
  id: true,
  displayName: true,
  avatarUrl: true,
  color: true,
  role: true,
});
export const FitnessPlanVersionSchema = z.object({
  revision: z.number().int().nonnegative(),
  effectiveFrom: LocalDateSchema,
  configuration: FitnessConfigurationSchema,
});
export const FitnessSettingsSchema = FitnessPlanVersionSchema.extend({
  people: z.array(FitnessPersonSchema),
  localDate: LocalDateSchema,
});
export const UpdateFitnessSettingsSchema = z
  .object({
    requestId: OpaqueIdSchema,
    expectedRevision: z.number().int().nonnegative(),
    configuration: FitnessConfigurationSchema,
  })
  .strict();
export const FitnessSettingsResultSchema = z.object({
  settings: FitnessSettingsSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export const FitnessProgressSchema = z.object({
  localDate: LocalDateSchema,
  memberId: OpaqueIdSchema,
  workoutId: OpaqueIdSchema,
  isCompleted: z.boolean(),
  version: z.number().int().nonnegative(),
});
export const SetFitnessCompletionSchema = FitnessProgressSchema.omit({ version: true })
  .extend({
    requestId: OpaqueIdSchema,
    planRevision: z.number().int().positive(),
    expectedVersion: z.number().int().nonnegative(),
  })
  .strict();
export const FitnessCompletionResultSchema = FitnessProgressSchema.extend({
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export const FitnessGoalOverviewSchema = FitnessPersonPlanSchema.shape.goals.element.extend({
  routine: z.array(FitnessWorkoutSchema).max(14),
});
export const FitnessSessionSchema = z.object({
  workout: FitnessWorkoutSchema,
  goal: z.object({ id: OpaqueIdSchema, title: z.string() }).nullable().default(null),
  isCompleted: z.boolean(),
  version: z.number().int().nonnegative(),
});
export const FitnessOverviewSchema = z.object({
  householdId: OpaqueIdSchema,
  generatedAt: TimestampSchema,
  timezone: TimezoneSchema,
  localDate: LocalDateSchema,
  weekStart: LocalDateSchema,
  people: z
    .array(
      z.object({
        person: FitnessPersonSchema,
        goals: z.array(FitnessGoalOverviewSchema).max(5),
        weeklyFocus: z.string(),
        streak: z.object({
          current: z.number().int().nonnegative(),
          best: z.number().int().nonnegative(),
        }),
        days: z
          .array(
            z.object({
              localDate: LocalDateSchema,
              planRevision: z.number().int().nonnegative(),
              sessions: z.array(FitnessSessionSchema).max(14),
            }),
          )
          .length(7),
      }),
    )
    .max(20),
});
export type FitnessConfiguration = z.infer<typeof FitnessConfigurationSchema>;
export type FitnessPersonPlan = z.infer<typeof FitnessPersonPlanSchema>;
export type FitnessWorkout = z.infer<typeof FitnessWorkoutSchema>;
export type FitnessExercise = z.infer<typeof FitnessExerciseSchema>;
export type FitnessPlanVersion = z.infer<typeof FitnessPlanVersionSchema>;
export type FitnessSettings = z.infer<typeof FitnessSettingsSchema>;
export type UpdateFitnessSettings = z.infer<typeof UpdateFitnessSettingsSchema>;
export type FitnessSettingsResult = z.infer<typeof FitnessSettingsResultSchema>;
export type FitnessProgress = z.infer<typeof FitnessProgressSchema>;
export type SetFitnessCompletion = z.infer<typeof SetFitnessCompletionSchema>;
export type FitnessCompletionResult = z.infer<typeof FitnessCompletionResultSchema>;
export type FitnessOverview = z.infer<typeof FitnessOverviewSchema>;
export type FitnessSession = z.infer<typeof FitnessSessionSchema>;
