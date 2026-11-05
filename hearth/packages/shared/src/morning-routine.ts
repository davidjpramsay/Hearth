import { z } from 'zod';
import {
  AuditSummarySchema,
  LocalDateSchema,
  LocalTimeSchema,
  MemberSchema,
  OpaqueIdSchema,
  TimestampSchema,
  TimezoneSchema,
} from './schemas.js';

export const MorningPersonSchema = MemberSchema.pick({
  id: true,
  displayName: true,
  color: true,
  avatarUrl: true,
  role: true,
});
export const MorningStepSchema = z
  .object({
    id: OpaqueIdSchema,
    title: z.string().trim().min(1).max(140),
    choreTemplateId: OpaqueIdSchema.optional(),
  })
  .strict();
export const MorningConfigurationSchema = z
  .object({
    startTime: LocalTimeSchema,
    endTime: LocalTimeSchema,
    selectedMemberIds: z.array(OpaqueIdSchema).max(20),
    routines: z
      .array(
        z.object({ memberId: OpaqueIdSchema, steps: z.array(MorningStepSchema).max(12) }).strict(),
      )
      .max(20),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.endTime <= value.startTime)
      context.addIssue({
        code: 'custom',
        message: 'End time must be after start time on the same day.',
        path: ['endTime'],
      });
    for (const routine of value.routines) {
      if (routine.steps.some((step) => !step.choreTemplateId && step.title.length > 80))
        context.addIssue({
          code: 'custom',
          message: 'Ordinary step titles can have up to 80 characters.',
        });
      const links = routine.steps.flatMap((step) =>
        step.choreTemplateId ? [step.choreTemplateId] : [],
      );
      if (new Set(links).size !== links.length)
        context.addIssue({
          code: 'custom',
          message: 'Add each chore only once per person in a routine.',
        });
    }
    const selected = value.selectedMemberIds;
    const people = value.routines.map((routine) => routine.memberId);
    const steps = value.routines.flatMap((routine) => routine.steps.map((step) => step.id));
    if (
      new Set(selected).size !== selected.length ||
      new Set(people).size !== people.length ||
      new Set(steps).size !== steps.length
    )
      context.addIssue({ code: 'custom', message: 'People and step identifiers must be unique.' });
    if (selected.some((id) => !people.includes(id)))
      context.addIssue({
        code: 'custom',
        message: 'Every selected person needs a routine, even if empty.',
      });
  });
export const MORNING_DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const MorningDaySchema = z.enum(MORNING_DAY_IDS);
export const MorningProfileIdSchema = z.enum(['schoolDays', 'weekends']);
export const MORNING_PROFILE_LABELS = { schoolDays: 'School days', weekends: 'Weekends' } as const;
export const MorningProfileSchema = z
  .object({
    days: z
      .array(MorningDaySchema)
      .max(7)
      .refine((days) => new Set(days).size === days.length, 'Choose each day once.'),
    countdownEnabled: z.boolean(),
    configuration: MorningConfigurationSchema,
  })
  .strict();
export const MorningProfilesSchema = z
  .object({
    schoolDays: MorningProfileSchema,
    weekends: MorningProfileSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.schoolDays.days.some((day) => value.weekends.days.includes(day)))
      context.addIssue({ code: 'custom', message: 'Each day can use only one morning routine.' });
  });
export type MorningDay = z.infer<typeof MorningDaySchema>;
export type MorningProfileId = z.infer<typeof MorningProfileIdSchema>;
export type MorningProfiles = z.infer<typeof MorningProfilesSchema>;

function copyMorningConfiguration(configuration: MorningConfiguration): MorningConfiguration {
  return {
    ...configuration,
    selectedMemberIds: [...configuration.selectedMemberIds],
    routines: configuration.routines.map((routine) => ({
      ...routine,
      steps: routine.steps.map((step) => ({ ...step })),
    })),
  };
}

/** Upgrade only the old school schedule; never seed personal weekend steps. */
export function defaultMorningProfiles(configuration: MorningConfiguration): MorningProfiles {
  return {
    schoolDays: {
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      countdownEnabled: true,
      configuration: copyMorningConfiguration(configuration),
    },
    weekends: {
      days: ['sat', 'sun'],
      countdownEnabled: false,
      configuration: {
        ...copyMorningConfiguration(configuration),
        routines: configuration.routines.map((routine) => ({
          memberId: routine.memberId,
          steps: [],
        })),
      },
    },
  };
}
export const MorningSettingsSchema = z.preprocess(
  (input) => {
    if (typeof input !== 'object' || input === null || 'profiles' in input) return input;
    const value = input as Record<string, unknown>;
    const legacy = MorningConfigurationSchema.safeParse(value.configuration);
    return legacy.success ? { ...value, profiles: defaultMorningProfiles(legacy.data) } : input;
  },
  z.object({
    revision: z.number().int().nonnegative(),
    // Kept as a school-only projection for installed v1 clients.
    configuration: MorningConfigurationSchema,
    profiles: MorningProfilesSchema,
    people: z.array(MorningPersonSchema),
  }),
);
export const UpdateMorningSettingsSchema = z
  .object({
    requestId: OpaqueIdSchema,
    expectedRevision: z.number().int().nonnegative(),
    configuration: MorningConfigurationSchema,
  })
  .strict();
export const UpdateMorningProfilesSchema = z
  .object({
    requestId: OpaqueIdSchema,
    expectedRevision: z.number().int().nonnegative(),
    profiles: MorningProfilesSchema,
  })
  .strict();
export const MorningSettingsCommandSchema = z.union([
  UpdateMorningProfilesSchema,
  UpdateMorningSettingsSchema,
]);
export type UpdateMorningProfiles = z.infer<typeof UpdateMorningProfilesSchema>;
export type MorningSettingsCommand = z.infer<typeof MorningSettingsCommandSchema>;
export const MorningSettingsResultSchema = z.object({
  settings: MorningSettingsSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export const MorningProgressSchema = MorningStepSchema.extend({
  chore: z
    .object({
      occurrenceId: OpaqueIdSchema,
      completionId: OpaqueIdSchema.nullable(),
      locked: z.boolean(),
    })
    .optional(),
  isCompleted: z.boolean(),
  version: z.number().int().nonnegative(),
});
export const MorningOverviewSchema = z.preprocess(
  (input) => {
    if (typeof input !== 'object' || input === null || 'profileId' in input) return input;
    const value = input as Record<string, unknown>;
    return { ...value, profileId: value.isWeekday ? 'schoolDays' : null };
  },
  z.object({
    householdId: OpaqueIdSchema,
    generatedAt: TimestampSchema,
    timezone: TimezoneSchema,
    localDate: LocalDateSchema,
    isWeekday: z.boolean(),
    profileId: MorningProfileIdSchema.nullable(),
    countdownEnabled: z.boolean().default(true),
    settingsRevision: z.number().int().nonnegative(),
    startTime: LocalTimeSchema,
    endTime: LocalTimeSchema,
    people: z
      .array(
        z.object({ person: MorningPersonSchema, steps: z.array(MorningProgressSchema).max(12) }),
      )
      .max(20),
  }),
);
export const SetMorningCompletionSchema = z
  .object({
    requestId: OpaqueIdSchema,
    localDate: LocalDateSchema,
    memberId: OpaqueIdSchema,
    stepId: OpaqueIdSchema,
    settingsRevision: z.number().int().nonnegative(),
    expectedVersion: z.number().int().nonnegative(),
    isCompleted: z.boolean(),
    profileId: MorningProfileIdSchema.optional(),
  })
  .strict();
export const MorningCompletionResultSchema = z.object({
  profileId: MorningProfileIdSchema.optional(),
  localDate: LocalDateSchema,
  memberId: OpaqueIdSchema,
  stepId: OpaqueIdSchema,
  isCompleted: z.boolean(),
  version: z.number().int().positive(),
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});
export type MorningConfiguration = z.infer<typeof MorningConfigurationSchema>;
export type MorningSettings = z.infer<typeof MorningSettingsSchema>;
export type UpdateMorningSettings = z.infer<typeof UpdateMorningSettingsSchema>;
export type MorningSettingsResult = z.infer<typeof MorningSettingsResultSchema>;
export type MorningOverview = z.infer<typeof MorningOverviewSchema>;
export type SetMorningCompletion = z.infer<typeof SetMorningCompletionSchema>;
export type MorningCompletionResult = z.infer<typeof MorningCompletionResultSchema>;
