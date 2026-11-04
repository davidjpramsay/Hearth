import { z } from 'zod';
import { MAX_PHOTO_UPLOAD_BYTES } from './photo-uploads.js';

export const OpaqueIdSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z][a-z0-9_-]+$/, 'Expected an opaque Hearth identifier');

export const LocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD local date')
  .refine((value) => {
    const date = new Date(`${value}T12:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Expected a real calendar date');

export const LocalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected a 24-hour HH:mm local time');

export const TimestampSchema = z.iso.datetime({ offset: true });
const timezoneValidity = new Map<string, boolean>();
export const TimezoneSchema = z
  .string()
  .min(1)
  .max(80)
  .refine((value) => {
    if (value.length === 0 || value.length > 80) return false;
    const cached = timezoneValidity.get(value);
    if (cached !== undefined) return cached;
    let valid = false;
    try {
      new Intl.DateTimeFormat('en-AU', { timeZone: value });
      valid = true;
    } catch {
      /* Do not persist a timezone that will crash clock/date rendering. */
    }
    if (timezoneValidity.size >= 64) timezoneValidity.clear();
    timezoneValidity.set(value, valid);
    return valid;
  }, 'Choose a supported timezone');
export const FAMILY_CALENDAR_COLOR = '#2f766d' as const;

export const CapabilitySchema = z.enum([
  'household.admin',
  'household.view',
  'chores.complete',
  'lists.change',
  'meals.change',
  'pocket-money.view',
  'home.control',
]);

export const MemberSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  avatarUrl: z.string().startsWith('/'),
  role: z.enum(['adult', 'child']),
  capabilities: z.array(CapabilitySchema),
});

export const HouseholdSummarySchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(100),
  timezone: TimezoneSchema,
  locale: z.string().min(2).max(20),
  mode: z.string().min(1).max(40),
  members: z.array(MemberSchema),
});

export const RuntimeModeSchema = z.enum(['demo', 'test', 'private']);

export const RuntimeHouseholdSchema = HouseholdSummarySchema.pick({
  id: true,
  name: true,
  timezone: true,
  locale: true,
});

export const RuntimeContextSchema = z.object({
  mode: RuntimeModeSchema,
  sharedScreen: z.boolean().optional(),
  generatedAt: TimestampSchema,
  household: RuntimeHouseholdSchema.nullable(),
  timezone: TimezoneSchema,
  locale: z.string().min(2).max(20),
  localDate: LocalDateSchema,
  weekStart: LocalDateSchema,
  currentMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  requiresSetup: z.boolean(),
});

export const PasskeyAuthStatusSchema = z.object({
  accessMethod: z.enum(['passkey', 'phone']).optional(),
  ownerPhone: z.boolean().optional(),
  mode: RuntimeModeSchema,
  sharedScreen: z.boolean().optional(),
  configured: z.boolean(),
  secureOrigin: z.boolean(),
  requiresSetup: z.boolean(),
  authenticated: z.boolean(),
  actor: MemberSchema.pick({ id: true, displayName: true, role: true }).nullable(),
});

export const FirstUsePasskeyOptionsRequestSchema = z
  .object({
    setupCode: z.string().trim().min(12).max(160),
    householdName: z.string().trim().min(1).max(100),
    adultName: z.string().trim().min(1).max(80),
    timezone: TimezoneSchema,
    passkeyLabel: z.string().trim().min(1).max(80),
  })
  .strict();

export const PasskeyCeremonyOptionsSchema = z.object({
  ceremonyId: OpaqueIdSchema,
  options: z.record(z.string(), z.unknown()),
  expiresAt: TimestampSchema,
});

export const PasskeyCeremonyVerificationRequestSchema = z
  .object({
    ceremonyId: OpaqueIdSchema,
    response: z.record(z.string(), z.unknown()),
  })
  .strict();

export const PasskeySessionSchema = z.object({
  authenticated: z.literal(true),
  householdId: OpaqueIdSchema,
  memberId: OpaqueIdSchema,
  displayName: z.string().min(1).max(80),
  expiresAt: TimestampSchema,
});

export const PasskeySignOutResultSchema = z.object({ signedOut: z.literal(true) });

export const PasskeyCredentialSummarySchema = z.object({
  id: OpaqueIdSchema,
  memberId: OpaqueIdSchema,
  label: z.string().min(1).max(80),
  deviceType: z.enum(['singleDevice', 'multiDevice']),
  backedUp: z.boolean(),
  createdAt: TimestampSchema,
  lastUsedAt: TimestampSchema.nullable(),
});

export const AdultAccessAccountSchema = z.object({
  member: MemberSchema.pick({ id: true, displayName: true, avatarUrl: true }),
  passkeys: z.array(PasskeyCredentialSummarySchema),
  recovery: z.object({
    configured: z.boolean(),
    createdAt: TimestampSchema.nullable(),
    expiresAt: TimestampSchema.nullable(),
  }),
});

export const AdultAccessSummarySchema = z.object({
  householdId: OpaqueIdSchema,
  actorMemberId: OpaqueIdSchema,
  adults: z.array(AdultAccessAccountSchema),
});

export const AdditionalPasskeyOptionsRequestSchema = z
  .object({
    memberId: OpaqueIdSchema,
    passkeyLabel: z.string().trim().min(1).max(80),
    signInOnThisDevice: z.boolean().optional(),
  })
  .strict();

export const RecoveryCodeConfirmationRequestSchema = z
  .object({
    ceremonyId: OpaqueIdSchema,
    response: z.record(z.string(), z.unknown()),
  })
  .strict();

export const RecoveryCodeRevealSchema = z.object({
  code: z.string().regex(/^([A-F0-9]{4}-){7}[A-F0-9]{4}$/),
  createdAt: TimestampSchema,
  expiresAt: TimestampSchema,
});

export const RecoveryPasskeyOptionsRequestSchema = z
  .object({
    recoveryCode: z.string().trim().min(32).max(64),
    passkeyLabel: z.string().trim().min(1).max(80),
  })
  .strict();

export const IntegrationStateSchema = z.object({
  kind: z.enum(['calendar', 'home-assistant']),
  status: z.enum([
    'healthy',
    'stale',
    'unavailable',
    'authentication-required',
    'read-only',
    'not-configured',
    'disabled',
  ]),
  lastSuccessfulAt: TimestampSchema.nullable(),
  message: z.string().min(1).max(180),
});

export const CalendarSourceSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  owner: MemberSchema.nullable(),
  access: z.enum(['read-only', 'read-write']),
});

export const CalendarEventSchema = z.object({
  id: OpaqueIdSchema,
  calendarId: OpaqueIdSchema,
  title: z.string().min(1).max(160),
  owner: MemberSchema.nullable(),
  sourceLabel: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  start: TimestampSchema,
  end: TimestampSchema,
  startLocalDate: LocalDateSchema,
  endLocalDate: LocalDateSchema,
  allDay: z.boolean(),
  location: z.string().max(240).nullable(),
  providerVersion: z.string().min(1).max(160).nullable(),
  recurrenceMasterId: OpaqueIdSchema.nullable(),
  isRecurrenceException: z.boolean(),
});

export const ChoreStateSchema = z.enum(['pending', 'completed', 'skipped', 'excused', 'cancelled']);

export const ROUTINE_TIME_OF_DAY_VALUES = [
  'Morning',
  'After school',
  'Evening',
  'Bedtime',
  'Anytime',
] as const;

export const RoutineTimeOfDaySchema = z.enum(ROUTINE_TIME_OF_DAY_VALUES);

export const ChoreOccurrenceSchema = z.object({
  id: OpaqueIdSchema,
  title: z.string().min(1).max(140),
  assignee: MemberSchema,
  routineLabel: RoutineTimeOfDaySchema,
  availableFromTime: LocalTimeSchema.nullable().default(null),
  dueTime: LocalTimeSchema.nullable().default(null),
  sortOrder: z.number().int().nonnegative().default(0),
  localDate: LocalDateSchema,
  state: ChoreStateSchema,
  completionId: OpaqueIdSchema.nullable(),
  completedAt: TimestampSchema.nullable(),
  completedLabel: z.string().max(80).nullable(),
  locked: z.boolean(),
});

export const WeatherSummarySchema = z.object({
  temperatureCelsius: z.number().int().min(-30).max(60),
  condition: z.string().min(1).max(80),
  source: z.enum(['demo', 'open-meteo']),
});

export const WeatherConditionSchema = z.enum(['clear', 'partly-cloudy', 'cloudy', 'rain']);

export const DailyForecastSchema = z.object({
  temperatureCelsius: z.number().int().min(-30).max(60),
  lowTemperatureCelsius: z.number().int().min(-30).max(60),
  highTemperatureCelsius: z.number().int().min(-30).max(60),
  precipitationProbabilityPercent: z.number().int().min(0).max(100),
  maxWindSpeedKph: z.number().int().min(0).max(500).nullable().optional(),
  dominantWindDirectionDegrees: z.number().int().min(0).max(360).nullable().optional(),
  condition: WeatherConditionSchema,
  label: z.string().min(1).max(80),
  source: z.enum(['demo', 'open-meteo']),
});

const WeatherLocalDateTimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/);

export const WeatherCurrentConditionsSchema = z.object({
  time: WeatherLocalDateTimeSchema,
  temperatureCelsius: z.number().int().min(-30).max(60),
  apparentTemperatureCelsius: z.number().int().min(-50).max(70),
  condition: WeatherConditionSchema,
  label: z.string().min(1).max(80),
  precipitationProbabilityPercent: z.number().int().min(0).max(100),
  windSpeedKph: z.number().int().min(0).max(500),
  windGustKph: z.number().int().min(0).max(500),
  windDirectionDegrees: z.number().int().min(0).max(360),
});

export const HourlyWeatherForecastSchema = WeatherCurrentConditionsSchema.extend({
  precipitationMillimetres: z.number().min(0).max(1_000),
});

export const WeatherForecastDaySchema = DailyForecastSchema.extend({
  localDate: LocalDateSchema,
});

export const WeatherForecastSchema = z.object({
  householdId: OpaqueIdSchema,
  configured: z.boolean().optional(),
  locationLabel: z.string().min(1).max(120).nullable(),
  timezone: TimezoneSchema,
  generatedAt: TimestampSchema,
  updatedAt: TimestampSchema.nullable(),
  freshness: z.enum(['current', 'stale', 'offline']),
  statusMessage: z.string().max(180).nullable(),
  current: WeatherCurrentConditionsSchema.nullable(),
  hourly: z.array(HourlyWeatherForecastSchema).max(48),
  daily: z.array(WeatherForecastDaySchema).max(16),
  source: z.enum(['demo', 'open-meteo']).nullable(),
});

const SameOriginAssetUrlSchema = z
  .string()
  .startsWith('/')
  .max(500)
  .refine((value) => !value.startsWith('//') && !value.includes('..'), {
    message: 'Asset URLs must stay on the Hearth origin.',
  });

export const PhotoOrientationSchema = z.enum(['landscape', 'portrait', 'square']);

export const TodayPhotoSummarySchema = z.object({
  url: SameOriginAssetUrlSchema,
  alt: z.string().min(1).max(180),
  orientation: PhotoOrientationSchema,
  width: z.number().int().positive().max(20_000).optional(),
  height: z.number().int().positive().max(20_000).optional(),
});

export const PhotoAssetSchema = z.object({
  id: OpaqueIdSchema,
  thumbnailUrl: SameOriginAssetUrlSchema,
  displayUrl: SameOriginAssetUrlSchema,
  alt: z.string().min(1).max(180),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
  orientation: PhotoOrientationSchema,
  capturedAt: TimestampSchema.nullable(),
  favourite: z.boolean(),
});

export const PhotoCurationActionSchema = z.enum(['favourite', 'unfavourite', 'hide', 'unhide']);

export const PhotoAssetSourceSchema = z.enum(['hearth-upload', 'synology-folder', 'demo']);

export const PhotoCurationAssetSchema = PhotoAssetSchema.extend({
  hidden: z.boolean(),
  source: PhotoAssetSourceSchema,
  canDeletePermanently: z.boolean(),
});

export const PhotoSourceSummarySchema = z.object({
  kind: z.enum(['demo', 'hearth-managed', 'synology-folder']),
  label: z.string().min(1).max(100),
  status: z.enum(['ready', 'unconfigured', 'unavailable']),
  message: z.string().min(1).max(180).nullable(),
});

export const PhotoUploadCapabilitySchema = z.object({
  enabled: z.boolean(),
  maxFileBytes: z.number().int().positive(),
  acceptedFormats: z.array(z.enum(['JPEG', 'PNG', 'HEIC', 'HEIF', 'TIFF', 'AVIF', 'WebP'])),
});

export const PhotoFolderImportStatusSchema = z.object({
  configured: z.boolean(),
  status: z.enum(['ready', 'unconfigured', 'unavailable']),
  lastCheckedAt: TimestampSchema.nullable(),
  importedPhotoCount: z.number().int().nonnegative(),
  message: z.string().min(1).max(180),
});

export const PhotoCollectionSchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(100),
  photoCount: z.number().int().nonnegative(),
  updatedAt: TimestampSchema.nullable(),
  source: PhotoSourceSummarySchema,
});

export const PhotoGallerySchema = z.object({
  householdId: OpaqueIdSchema,
  freshness: z.enum(['current', 'stale', 'offline']),
  statusMessage: z.string().max(180).nullable(),
  collection: PhotoCollectionSchema,
  featuredPhotoId: OpaqueIdSchema.nullable(),
  photos: z.array(PhotoAssetSchema),
});

export const PhotoSourceIndexStatusSchema = z.object({
  householdId: OpaqueIdSchema,
  collection: PhotoCollectionSchema,
  scanInProgress: z.boolean(),
  indexedFileCount: z.number().int().nonnegative(),
  visiblePhotoCount: z.number().int().nonnegative(),
  hiddenPhotoCount: z.number().int().nonnegative(),
  unsupportedFileCount: z.number().int().nonnegative(),
  corruptFileCount: z.number().int().nonnegative(),
  managedPhotoCount: z.number().int().nonnegative().default(0),
  importedPhotoCount: z.number().int().nonnegative().default(0),
  upload: PhotoUploadCapabilitySchema.default({
    enabled: false,
    maxFileBytes: MAX_PHOTO_UPLOAD_BYTES,
    acceptedFormats: ['JPEG', 'PNG', 'HEIC', 'HEIF', 'TIFF', 'AVIF', 'WebP'],
  }),
  folderImport: PhotoFolderImportStatusSchema.default({
    configured: false,
    status: 'unconfigured',
    lastCheckedAt: null,
    importedPhotoCount: 0,
    message: 'Optional Synology folder import is not connected.',
  }),
  photos: z.array(PhotoCurationAssetSchema),
});

export const TodaySectionVisibilitySchema = z.object({
  dinner: z.boolean(),
  listSummary: z.boolean(),
  notice: z.boolean(),
  photo: z.boolean(),
  dailyVerse: z.boolean(),
  reminders: z.boolean(),
});

export const TodayReminderSummarySchema = z
  .object({
    openCount: z.number().int().nonnegative(),
    items: z
      .array(
        z
          .object({
            id: OpaqueIdSchema,
            title: z.string().min(1).max(240),
            dueAt: TimestampSchema.nullable(),
            hasDueTime: z.boolean(),
          })
          .strict(),
      )
      .max(3),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.openCount === 0 && value.items.length > 0) {
      context.addIssue({
        code: 'custom',
        message: 'A reminder summary with no open reminders must not include preview items.',
        path: ['items'],
      });
    }
    if (value.openCount > 0 && value.items.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'An open reminder summary requires at least one preview item.',
        path: ['items'],
      });
    }
    if (value.items.length > value.openCount) {
      context.addIssue({
        code: 'custom',
        message: 'A reminder summary cannot preview more reminders than are open.',
        path: ['items'],
      });
    }
  });

export const DailyVerseSummarySchema = z.object({
  text: z.string().trim().min(1).max(1200),
  reference: z.string().trim().min(1).max(120),
  translation: z.enum(['ESV', 'Demo']),
  sourceUrl: z.url().nullable(),
  freshness: z.enum(['current', 'stale']),
  statusMessage: z.string().max(180).nullable(),
});

export const HouseholdNoticeSchema = z.object({
  id: OpaqueIdSchema,
  householdId: OpaqueIdSchema,
  message: z.string().trim().min(1).max(240),
  priority: z.enum(['standard', 'important']),
  startsAt: TimestampSchema,
  expiresAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const TodayConfigurationSchema = z.object({
  householdId: OpaqueIdSchema,
  sections: TodaySectionVisibilitySchema,
  activeNoticeId: OpaqueIdSchema.nullable(),
  notices: z.array(HouseholdNoticeSchema),
});

export const TodaySummarySchema = z.object({
  household: HouseholdSummarySchema,
  localDate: LocalDateSchema,
  generatedAt: TimestampSchema,
  displayTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  displayDate: z.string().min(1).max(100),
  weather: WeatherSummarySchema.nullable(),
  freshness: z.enum(['current', 'stale', 'offline']),
  calendarRefreshing: z.boolean().default(false),
  statusMessage: z.string().max(180).nullable(),
  calendars: z.array(CalendarSourceSchema),
  events: z.array(CalendarEventSchema),
  chores: z.array(ChoreOccurrenceSchema),
  dinner: z.string().max(180).nullable(),
  listSummary: z
    .object({
      name: z.string().min(1).max(100),
      remainingCount: z.number().int().nonnegative(),
    })
    .nullable(),
  notice: z.string().max(240).nullable(),
  photo: TodayPhotoSummarySchema.nullable(),
  dailyVerse: DailyVerseSummarySchema.nullable(),
  reminderSummary: TodayReminderSummarySchema.nullable(),
  sections: TodaySectionVisibilitySchema,
  integrations: z.array(IntegrationStateSchema),
});

export const WeekDaySchema = z.object({
  localDate: LocalDateSchema,
  dayLabel: z.string().min(1).max(20),
  dateLabel: z.string().min(1).max(20),
  isToday: z.boolean(),
  forecast: DailyForecastSchema.nullable(),
});

export const WeekScheduleSchema = z.object({
  householdId: OpaqueIdSchema,
  startDate: LocalDateSchema,
  endDate: LocalDateSchema,
  displayRange: z.string().min(1).max(80),
  freshness: z.enum(['current', 'stale', 'offline']),
  calendarRefreshing: z.boolean().default(false),
  statusMessage: z.string().max(180).nullable(),
  days: z.array(WeekDaySchema).length(7),
  calendars: z.array(CalendarSourceSchema),
  events: z.array(CalendarEventSchema),
});

export const MonthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const MonthDaySchema = z.object({
  localDate: LocalDateSchema,
  dayNumber: z.number().int().min(1).max(31),
  inMonth: z.boolean(),
  isToday: z.boolean(),
});

export const MonthScheduleSchema = z.object({
  householdId: OpaqueIdSchema,
  month: MonthKeySchema,
  gridStartDate: LocalDateSchema,
  gridEndDate: LocalDateSchema,
  displayMonth: z.string().min(1).max(40),
  displayYear: z.string().regex(/^\d{4}$/),
  freshness: z.enum(['current', 'stale', 'offline']),
  calendarRefreshing: z.boolean().default(false),
  statusMessage: z.string().max(180).nullable(),
  days: z.array(MonthDaySchema).length(42),
  calendars: z.array(CalendarSourceSchema),
  events: z.array(CalendarEventSchema),
});

export const ChoreGroupSchema = z.object({
  member: MemberSchema,
  occurrences: z.array(ChoreOccurrenceSchema),
});

export const ChoreListSchema = z.object({
  householdId: OpaqueIdSchema,
  localDate: LocalDateSchema,
  displayDate: z.string().min(1).max(100),
  completedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  groups: z.array(ChoreGroupSchema),
});

export const CommandRequestSchema = z.object({
  requestId: OpaqueIdSchema,
});

export const HomeActionIdSchema = z.enum(['evening-mode', 'goodnight', 'screen-off']);

export const HomeActionSchema = z.object({
  id: HomeActionIdSchema,
  label: z.string().min(1).max(80),
  description: z.string().min(1).max(160),
  icon: z.enum(['sun', 'moon', 'power']),
  confirmation: z.enum(['none', 'explicit']),
  enabled: z.boolean(),
  unavailableReason: z.string().min(1).max(180).nullable(),
});

export const PowerSafetyDecisionSchema = z.object({
  automaticScreenOffAllowed: z.boolean(),
  reason: z.enum([
    'clear',
    'presence-detected',
    'protected-media-active',
    'hearth-not-foreground',
    'state-unavailable',
  ]),
});

export const HomeStatusSchema = z.object({
  householdId: OpaqueIdSchema,
  roomLabel: z.string().min(1).max(80),
  generatedAt: TimestampSchema,
  freshness: z.enum(['current', 'stale']),
  statusMessage: z.string().min(1).max(180).nullable(),
  integration: IntegrationStateSchema,
  occupancy: z.enum(['occupied', 'clear', 'unknown']),
  televisionPower: z.enum(['on', 'standby', 'unknown']),
  protectedMediaActive: z.boolean(),
  powerProtectionLabel: z.string().min(1).max(100),
  automaticScreenOff: PowerSafetyDecisionSchema,
  actions: z.array(HomeActionSchema),
});

export const ExecuteHomeActionRequestSchema = CommandRequestSchema.extend({
  confirmed: z.boolean(),
});

export const AssistDaySummaryRequestSchema = CommandRequestSchema.extend({
  date: LocalDateSchema,
});

export const AssistChoreCompletionRequestSchema = CommandRequestSchema.extend({
  date: LocalDateSchema,
  memberName: z.string().trim().min(1).max(80),
  choreTitle: z.string().trim().min(1).max(140),
});

export const ChoreRepeatSchema = z.enum(['once', 'daily', 'weekdays', 'weekly']);

const ChoreDaySchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

function validateChoreSchedule(
  value: { repeat: z.infer<typeof ChoreRepeatSchema>; repeatDays: string[] },
  context: z.core.$RefinementCtx,
) {
  if (value.repeat !== 'once' && value.repeatDays.length === 0) {
    context.addIssue({
      code: 'custom',
      message: 'Choose at least one day for a recurring chore.',
      path: ['repeatDays'],
    });
  }
  if (value.repeat === 'once' && value.repeatDays.length > 0) {
    context.addIssue({
      code: 'custom',
      message: 'A one-off chore must not contain recurring days.',
      path: ['repeatDays'],
    });
  }
}

function validateChoreTemplate(
  value: {
    repeat: z.infer<typeof ChoreRepeatSchema>;
    repeatDays: string[];
    activeFrom: string;
    activeUntil: string | null;
    availableFromTime: string | null;
    dueTime: string | null;
  },
  context: z.core.$RefinementCtx,
) {
  validateChoreSchedule(value, context);
  validateChoreWindow(value, context);
  if (value.repeat === 'once' && value.activeUntil !== value.activeFrom) {
    context.addIssue({
      code: 'custom',
      message: 'A one-off chore must begin and end on its due date.',
      path: ['activeUntil'],
    });
  }
}

function validateChoreWindow(
  value: { availableFromTime: string | null; dueTime: string | null },
  context: z.core.$RefinementCtx,
) {
  if (
    value.availableFromTime !== null &&
    value.dueTime !== null &&
    value.availableFromTime >= value.dueTime
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Due by must be later than available from.',
      path: ['dueTime'],
    });
  }
}

function validateChoreFields(
  value: {
    repeat: z.infer<typeof ChoreRepeatSchema>;
    repeatDays: string[];
    availableFromTime: string | null;
    dueTime: string | null;
  },
  context: z.core.$RefinementCtx,
) {
  validateChoreSchedule(value, context);
  validateChoreWindow(value, context);
}

const ChoreTemplateAssigneesSchema = z
  .array(MemberSchema)
  .min(1, 'Choose at least one person for this chore.')
  .max(20)
  .refine((members) => new Set(members.map((member) => member.id)).size === members.length, {
    message: 'Choose each person only once.',
  });

function normalizeLegacyChoreTemplate(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if ('assignees' in record || !('assignee' in record)) return value;
  const { assignee, ...template } = record;
  return { ...template, assignees: [assignee] };
}

export const ChoreTemplateSchema = z.preprocess(
  normalizeLegacyChoreTemplate,
  z
    .object({
      id: OpaqueIdSchema,
      title: z.string().min(1).max(140),
      description: z.string().max(320).nullable(),
      assignees: ChoreTemplateAssigneesSchema,
      routineLabel: RoutineTimeOfDaySchema,
      availableFromTime: LocalTimeSchema.nullable().default(null),
      dueTime: LocalTimeSchema.nullable().default(null),
      sortOrder: z.number().int().nonnegative().default(0),
      repeat: ChoreRepeatSchema,
      repeatDays: z.array(ChoreDaySchema),
      activeFrom: LocalDateSchema,
      activeUntil: LocalDateSchema.nullable(),
      archived: z.boolean(),
    })
    .superRefine(validateChoreTemplate),
);

export const ChoreTemplateListSchema = z.object({
  householdId: OpaqueIdSchema,
  templates: z.array(ChoreTemplateSchema),
});

const ChoreTemplateAssigneeIdsSchema = z
  .array(OpaqueIdSchema)
  .min(1, 'Choose at least one person for this chore.')
  .max(20)
  .refine((memberIds) => new Set(memberIds).size === memberIds.length, {
    message: 'Choose each person only once.',
  });

const ChoreTemplateFieldsSchema = CommandRequestSchema.extend({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(320).nullable(),
  assigneeIds: ChoreTemplateAssigneeIdsSchema,
  routineLabel: RoutineTimeOfDaySchema,
  availableFromTime: LocalTimeSchema.nullable().default(null),
  dueTime: LocalTimeSchema.nullable().default(null),
  repeat: ChoreRepeatSchema,
  repeatDays: z.array(ChoreDaySchema),
  activeFrom: LocalDateSchema,
});

function normalizeLegacyChoreTemplateRequest(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if ('assigneeIds' in record || !('assigneeId' in record)) return value;
  const { assigneeId, ...request } = record;
  return { ...request, assigneeIds: [assigneeId] };
}

export const CreateChoreTemplateRequestSchema = z.preprocess(
  normalizeLegacyChoreTemplateRequest,
  ChoreTemplateFieldsSchema.superRefine(validateChoreFields),
);
export const UpdateChoreTemplateRequestSchema = z.preprocess(
  normalizeLegacyChoreTemplateRequest,
  ChoreTemplateFieldsSchema.superRefine(validateChoreFields),
);
export const RestoreChoreTemplateRequestSchema = CommandRequestSchema.extend({
  resumeFrom: LocalDateSchema,
});

export const ReorderChoreTemplatesRequestSchema = CommandRequestSchema.extend({
  orderedTemplateIds: uniqueIdOrder(OpaqueIdSchema),
});

export const ChoreTemplateCommandResultSchema = z.object({
  template: ChoreTemplateSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const ChoreTemplateOrderCommandResultSchema = z.object({
  list: ChoreTemplateListSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const HouseholdListTypeSchema = z.enum(['grocery', 'packing', 'shopping', 'wish', 'custom']);

export const ListItemSchema = z.object({
  id: OpaqueIdSchema,
  text: z.string().min(1).max(160),
  quantity: z.string().max(40).nullable(),
  checked: z.boolean(),
  checkedAt: TimestampSchema.nullable(),
  checkedByActorId: OpaqueIdSchema.nullable(),
});

export const HouseholdListSchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(100),
  type: HouseholdListTypeSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  remainingCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  items: z.array(ListItemSchema),
});

export const HouseholdListsSchema = z.object({
  householdId: OpaqueIdSchema,
  lists: z.array(HouseholdListSchema),
});

export const ArchivedHouseholdListSchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(100),
  type: HouseholdListTypeSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  archivedAt: TimestampSchema,
});

export const HouseholdListSettingsSchema = z.object({
  householdId: OpaqueIdSchema,
  activeLists: z.array(HouseholdListSchema),
  archivedLists: z.array(ArchivedHouseholdListSchema),
});

const HouseholdListFieldsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: HouseholdListTypeSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const CreateHouseholdListRequestSchema = CommandRequestSchema.extend(
  HouseholdListFieldsSchema.shape,
);
export const UpdateHouseholdListRequestSchema = CommandRequestSchema.extend(
  HouseholdListFieldsSchema.shape,
);

function uniqueIdOrder<T extends z.ZodTypeAny>(schema: T) {
  return z
    .array(schema)
    .min(1)
    .max(100)
    .superRefine((ids, context) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: 'custom',
          message: 'Order cannot contain duplicate identifiers.',
        });
      }
    });
}

export const ReorderHouseholdListsRequestSchema = CommandRequestSchema.extend({
  orderedListIds: uniqueIdOrder(OpaqueIdSchema),
});

export const UpdateListItemRequestSchema = CommandRequestSchema.extend({
  text: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(40).nullable(),
});

export const ReorderListItemsRequestSchema = CommandRequestSchema.extend({
  orderedItemIds: uniqueIdOrder(OpaqueIdSchema),
});

export const ListSettingsCommandResultSchema = z.object({
  settings: HouseholdListSettingsSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const AddListItemRequestSchema = CommandRequestSchema.extend({
  text: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(40).nullable(),
});

export const AssistAddListItemRequestSchema = AddListItemRequestSchema.extend({
  listName: z.string().trim().min(1).max(100),
});

export const ListItemCommandResultSchema = z.object({
  list: HouseholdListSchema,
  item: ListItemSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const MealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner']);

export const SavedMealSchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(140),
  description: z.string().max(320).nullable(),
  preparationMinutes: z.number().int().min(1).max(600).nullable(),
  favourite: z.boolean(),
  archivedAt: TimestampSchema.nullable(),
});

export const SavedMealLibrarySchema = z.object({
  householdId: OpaqueIdSchema,
  activeMeals: z.array(SavedMealSchema),
  archivedMeals: z.array(SavedMealSchema),
});

export const MealPlanEntrySchema = z.object({
  id: OpaqueIdSchema,
  localDate: LocalDateSchema,
  slot: MealSlotSchema,
  mealName: z.string().min(1).max(160),
  savedMealId: OpaqueIdSchema.nullable(),
  note: z.string().max(240).nullable(),
});

export const MealPlanDaySchema = z.object({
  localDate: LocalDateSchema,
  dayLabel: z.string().min(1).max(20),
  dateLabel: z.string().min(1).max(20),
  isToday: z.boolean(),
  entries: z.array(MealPlanEntrySchema),
});

export const MealPlanSchema = z.object({
  householdId: OpaqueIdSchema,
  startDate: LocalDateSchema,
  endDate: LocalDateSchema,
  displayRange: z.string().min(1).max(80),
  days: z.array(MealPlanDaySchema).length(7),
  savedMeals: z.array(SavedMealSchema),
});

export const UpsertMealPlanRequestSchema = CommandRequestSchema.extend({
  localDate: LocalDateSchema,
  slot: MealSlotSchema,
  mealName: z.string().trim().min(1).max(160),
  savedMealId: OpaqueIdSchema.nullable(),
  note: z.string().trim().max(240).nullable(),
});

export const CreateSavedMealRequestSchema = CommandRequestSchema.extend({
  name: z.string().trim().min(1).max(140),
  description: z.string().trim().max(320).nullable(),
  preparationMinutes: z.number().int().min(1).max(600).nullable(),
  favourite: z.boolean(),
});

export const UpdateSavedMealRequestSchema = CreateSavedMealRequestSchema;

export const MealPlanEntryInputSchema = UpsertMealPlanRequestSchema.omit({ requestId: true });

export const UpdateMealPlanWeekRequestSchema = CommandRequestSchema.extend({
  startDate: LocalDateSchema,
  entries: z.array(MealPlanEntryInputSchema).min(1).max(21),
}).superRefine((value, context) => {
  const start = Date.parse(`${value.startDate}T12:00:00Z`);
  const end = start + 6 * 86_400_000;
  const seen = new Set<string>();
  for (const [index, entry] of value.entries.entries()) {
    const date = Date.parse(`${entry.localDate}T12:00:00Z`);
    if (date < start || date > end) {
      context.addIssue({
        code: 'custom',
        message: 'Every meal must belong to the selected seven-day week.',
        path: ['entries', index, 'localDate'],
      });
    }
    const key = `${entry.localDate}:${entry.slot}`;
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        message: 'Each day and meal slot can appear only once.',
        path: ['entries', index, 'slot'],
      });
    }
    seen.add(key);
  }
});

export const ClearMealPlanWeekRequestSchema = CommandRequestSchema.extend({
  startDate: LocalDateSchema,
});

export const CopyMealPlanWeekRequestSchema = CommandRequestSchema.extend({
  sourceStartDate: LocalDateSchema,
  targetStartDate: LocalDateSchema,
  replaceExisting: z.boolean(),
});

export const SavedMealCommandResultSchema = z.object({
  savedMeal: SavedMealSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const MealCommandResultSchema = z.object({
  entry: MealPlanEntrySchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const MealPlanWeekCommandResultSchema = z.object({
  plan: MealPlanSchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const PaydaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export const PocketMoneyPaymentVoidSchema = z.object({
  id: OpaqueIdSchema,
  paymentId: OpaqueIdSchema,
  reason: z.string().trim().min(3).max(240),
  voidedAt: TimestampSchema,
  voidedByActorId: OpaqueIdSchema,
  source: z.literal('companion'),
});

export const PocketMoneyPaymentSchema = z
  .object({
    id: OpaqueIdSchema,
    memberId: OpaqueIdSchema,
    weekStart: LocalDateSchema,
    weekEnd: LocalDateSchema,
    scheduledCount: z.number().int().nonnegative(),
    completedCount: z.number().int().nonnegative(),
    completionPercentage: z.number().int().min(0).max(100),
    amountCents: z.number().int().nonnegative(),
    note: z.string().trim().min(1).max(240).nullable(),
    paidAt: TimestampSchema,
    paidByActorId: OpaqueIdSchema,
    source: z.enum(['companion', 'system']),
    void: PocketMoneyPaymentVoidSchema.nullable(),
  })
  .refine((payment) => payment.completedCount <= payment.scheduledCount, {
    message: 'Completed chores cannot exceed scheduled chores.',
    path: ['completedCount'],
  });

export const PocketMoneyChildSummarySchema = z
  .object({
    member: MemberSchema,
    weeklyAmountCents: z.number().int().positive().max(100_000).nullable(),
    currency: z.literal('AUD'),
    payday: PaydaySchema.nullable(),
    scheduledCount: z.number().int().nonnegative(),
    completedCount: z.number().int().nonnegative(),
    completionPercentage: z.number().int().min(0).max(100),
    earnedAmountCents: z.number().int().nonnegative().nullable(),
    paidAmountCents: z.number().int().nonnegative(),
    remainingAmountCents: z.number().int().nonnegative().nullable(),
    paydayReached: z.boolean(),
    status: z.enum(['not-configured', 'building', 'ready', 'partially-paid', 'paid']),
    payments: z.array(PocketMoneyPaymentSchema),
  })
  .refine((summary) => summary.completedCount <= summary.scheduledCount, {
    message: 'Completed chores cannot exceed scheduled chores.',
    path: ['completedCount'],
  });

export const PocketMoneyOverviewSchema = z.object({
  householdId: OpaqueIdSchema,
  weekStart: LocalDateSchema,
  weekEnd: LocalDateSchema,
  asOfDate: LocalDateSchema,
  displayRange: z.string().min(1).max(80),
  children: z.array(PocketMoneyChildSummarySchema),
  recentPayments: z.array(PocketMoneyPaymentSchema),
});

export const UpdatePocketMoneySettingsRequestSchema = CommandRequestSchema.extend({
  weeklyAmountCents: z.number().int().min(100).max(100_000),
  payday: PaydaySchema,
  weekStart: LocalDateSchema,
  asOfDate: LocalDateSchema,
});

export const RecordPocketMoneyPaymentRequestSchema = CommandRequestSchema.extend({
  memberId: OpaqueIdSchema,
  weekStart: LocalDateSchema,
  asOfDate: LocalDateSchema,
  amountCents: z.number().int().positive().max(100_000).optional(),
  note: z.string().trim().min(1).max(240).nullable().optional(),
});

export const VoidPocketMoneyPaymentRequestSchema = CommandRequestSchema.extend({
  asOfDate: LocalDateSchema,
  reason: z.string().trim().min(3).max(240),
});

export const PocketMoneySettingsCommandResultSchema = z.object({
  child: PocketMoneyChildSummarySchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const PocketMoneyPaymentCommandResultSchema = z.object({
  payment: PocketMoneyPaymentSchema,
  child: PocketMoneyChildSummarySchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const PocketMoneyPaymentVoidCommandResultSchema = z.object({
  payment: PocketMoneyPaymentSchema,
  child: PocketMoneyChildSummarySchema,
  audit: z.lazy(() => AuditSummarySchema),
  replayed: z.boolean(),
});

export const CompletionReversalRequestSchema = CommandRequestSchema.extend({
  completionId: OpaqueIdSchema,
});

export const ChoreExceptionRequestSchema = CommandRequestSchema.extend({
  reason: z.string().trim().min(2).max(240),
});

export const ChoreReassignmentRequestSchema = ChoreExceptionRequestSchema.extend({
  assigneeId: OpaqueIdSchema,
});

export const AuditSummarySchema = z.object({
  id: OpaqueIdSchema,
  actorType: z.enum(['member', 'device', 'service', 'system']),
  actorId: OpaqueIdSchema,
  source: z.enum(['tv', 'companion', 'voice', 'automation', 'sync', 'system']),
  action: z.enum([
    'fitness.library.save',
    'fitness.library.upload',
    'fitness.library.remove-video',
    'fitness.library.archive',
    'fitness.settings.update',
    'fitness.complete',
    'fitness.reopen',
    'morning-routine.settings.update',
    'morning-routine.complete',
    'morning-routine.reopen',
    'chore.complete',
    'chore.undo',
    'chore.skip',
    'chore.excuse',
    'chore.reassign',
    'household.update',
    'member.create',
    'member.update',
    'member.avatar.update',
    'member.avatar.reset',
    'member.archive',
    'device.pair',
    'device.revoke',
    'reminder.integration.retired',
    'reminder.create',
    'reminder.update',
    'reminder.complete',
    'reminder.reopen',
    'reminder.delete',
    'chore-template.create',
    'chore-template.update',
    'chore-template.archive',
    'chore-template.restore',
    'chore-template.reorder',
    'list.create',
    'list.update',
    'list.archive',
    'list.restore',
    'list.reorder',
    'list.item.add',
    'list.item.update',
    'list.item.archive',
    'list.item.reorder',
    'list.item.clear-checked',
    'list.item.complete',
    'list.item.undo',
    'meal.plan',
    'meal.week.update',
    'meal.week.clear',
    'meal.week.copy',
    'saved-meal.create',
    'saved-meal.update',
    'saved-meal.archive',
    'saved-meal.restore',
    'pocket-money.settings.update',
    'pocket-money.payment.record',
    'pocket-money.payment.void',
    'calendar.connection.save',
    'calendar.mappings.update',
    'calendar.connection.remove',
    'weather.location.update',
    'home-assistant.connection.save',
    'home-assistant.connection.remove',
    'home-assistant.bridge.grant',
    'home-assistant.bridge.approve',
    'home-assistant.bridge.revoke',
    'screen.navigate',
    'system.backup.create',
    'system.update.install',
    'system.update.complete',
    'photo.upload',
    'photo.source.refresh',
    'photo.favourite',
    'photo.unfavourite',
    'photo.hide',
    'photo.unhide',
    'photo.delete',
    'auth.passkey.register',
    'auth.passkey.revoke',
    'auth.recovery-code.rotate',
    'auth.account.recover',
    'auth.phone.connect',
    'auth.phone.invite',
    'auth.phone.approve',
    'auth.phone.invitation.cancel',
    'auth.phone.remove',
    'auth.phone.confirm',
    'auth.phone.owner-key.issue',
    'auth.phone.owner.replace',
    'auth.phone.recovery.policy',
    'auth.phone.recovery.card.prepare',
    'auth.phone.recovery.card.activate',
    'auth.phone.owner.recovery.card',
    'auth.phone.owner.recovery.invite',
    'home.action.execute',
    'notice.create',
    'notice.update',
    'notice.archive',
    'today.sections.update',
    'module.update',
    'nba.settings.update',
    'indoor-climate.settings.update',
  ]),
  targetId: OpaqueIdSchema,
  occurredAt: TimestampSchema,
  result: z.enum(['succeeded', 'rejected', 'failed', 'reversed']),
});

export const PasskeyRegistrationResultSchema = z.object({
  credential: PasskeyCredentialSummarySchema,
  audit: AuditSummarySchema,
});

export const RevokePasskeyRequestSchema = CommandRequestSchema;

export const PasskeyRevocationResultSchema = z.object({
  access: AdultAccessSummarySchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

const NoticeFieldsSchema = z.object({
  message: HouseholdNoticeSchema.shape.message,
  priority: HouseholdNoticeSchema.shape.priority,
  startsAt: TimestampSchema,
  expiresAt: TimestampSchema.nullable(),
});

function validateNoticeWindow(
  value: z.infer<typeof NoticeFieldsSchema>,
  context: z.core.$RefinementCtx,
) {
  if (value.expiresAt !== null && Date.parse(value.expiresAt) <= Date.parse(value.startsAt)) {
    context.addIssue({
      code: 'custom',
      message: 'The notice expiry must be after its start time.',
      path: ['expiresAt'],
    });
  }
}

export const CreateHouseholdNoticeRequestSchema = CommandRequestSchema.extend(
  NoticeFieldsSchema.shape,
).superRefine(validateNoticeWindow);
export const UpdateHouseholdNoticeRequestSchema = CreateHouseholdNoticeRequestSchema;
export const ArchiveHouseholdNoticeRequestSchema = CommandRequestSchema;
export const UpdateTodaySectionsRequestSchema = CommandRequestSchema.extend(
  TodaySectionVisibilitySchema.shape,
);

export const RefreshPhotoSourceRequestSchema = CommandRequestSchema;

export const UpdatePhotoCurationRequestSchema = CommandRequestSchema.extend({
  action: PhotoCurationActionSchema,
});

export const DeleteManagedPhotoRequestSchema = CommandRequestSchema;

export const PhotoSourceRefreshResultSchema = z.object({
  status: PhotoSourceIndexStatusSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const PhotoCurationCommandResultSchema = z.object({
  photo: PhotoCurationAssetSchema,
  status: PhotoSourceIndexStatusSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const PhotoDeletionCommandResultSchema = z.object({
  deletedAssetId: OpaqueIdSchema,
  status: PhotoSourceIndexStatusSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const PhotoUploadResultSchema = z.object({
  photo: PhotoCurationAssetSchema,
  status: PhotoSourceIndexStatusSchema,
  duplicate: z.boolean(),
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const TodayConfigurationCommandResultSchema = z.object({
  configuration: TodayConfigurationSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const ChoreCommandResultSchema = z.object({
  occurrence: ChoreOccurrenceSchema,
  completionId: OpaqueIdSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const ChoreSkipResultSchema = z.object({
  occurrence: ChoreOccurrenceSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const ChoreOccurrenceChangeResultSchema = ChoreSkipResultSchema;

export const ChoreOccurrenceHistoryEntrySchema = z.object({
  id: OpaqueIdSchema,
  action: z.enum(['chore.complete', 'chore.undo', 'chore.skip', 'chore.excuse', 'chore.reassign']),
  label: z.string().min(1).max(180),
  actorLabel: z.string().min(1).max(80),
  occurredAt: TimestampSchema,
  reason: z.string().max(240).nullable(),
});

export const ChoreOccurrenceDetailSchema = z.object({
  occurrence: ChoreOccurrenceSchema,
  description: z.string().max(320).nullable(),
  history: z.array(ChoreOccurrenceHistoryEntrySchema),
});

export const HomeActionResultSchema = z.object({
  actionId: HomeActionIdSchema,
  label: z.string().min(1).max(80),
  message: z.string().min(1).max(180),
  executedAt: TimestampSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const AssistDaySummaryResultSchema = z.object({
  requestId: OpaqueIdSchema,
  date: LocalDateSchema,
  speech: z.string().min(1).max(480),
});

export const AssistChoreCompletionResultSchema = z.object({
  speech: z.string().min(1).max(240),
  command: ChoreCommandResultSchema,
});

export const RealtimeEventSchema = z.object({
  id: OpaqueIdSchema,
  kind: z.enum([
    'chore.changed',
    'household.changed',
    'list.changed',
    'meal.changed',
    'pocket-money.changed',
    'chore-template.changed',
    'home.changed',
    'calendar.changed',
    'weather.changed',
    'today.changed',
    'photos.changed',
    'reminders.changed',
    'modules.changed',
    'nba.changed',
    'fitness.changed',
    'morning-routine.changed',
  ]),
  householdId: OpaqueIdSchema,
  targetId: OpaqueIdSchema,
  occurredAt: TimestampSchema,
});

export const ApiErrorCodeSchema = z.enum([
  'MODULE_DISABLED',
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'CONFLICT',
  'FORBIDDEN',
  'OFFLINE',
  'INTEGRATION_UNAVAILABLE',
  'COMMAND_FAILED',
  'CONFIRMATION_REQUIRED',
  'AMBIGUOUS_TARGET',
  'DUPLICATE_ITEM',
  'STALE_SNAPSHOT',
]);

export const AdminActorSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().min(1).max(80),
  role: z.enum(['adult', 'child']),
  capabilities: z.array(CapabilitySchema),
});

export const PairedDeviceSchema = z.object({
  id: OpaqueIdSchema,
  name: z.string().min(1).max(80),
  type: z.literal('television'),
  status: z.enum(['connected', 'revoked']),
  scopes: z.array(z.enum(['household.read', 'chores.complete', 'lists.change', 'home.control'])),
  pairedAt: TimestampSchema,
  lastSeenAt: TimestampSchema.nullable(),
  revokedAt: TimestampSchema.nullable(),
});

export const PairingCodeSchema = z
  .string()
  .length(6)
  .regex(/^[A-Z0-9]{6}$/, 'Expected a six-character pairing code');

export const PairingRequestSchema = z.object({
  id: OpaqueIdSchema,
  requestId: OpaqueIdSchema,
  code: PairingCodeSchema,
  deviceName: z.string().min(1).max(80),
  status: z.enum(['pending', 'approved', 'expired', 'cancelled']),
  expiresAt: TimestampSchema,
  approvedDeviceId: OpaqueIdSchema.nullable(),
});

export const AdminOverviewSchema = z.object({
  household: HouseholdSummarySchema,
  actor: AdminActorSchema,
  pairedDevices: z.array(PairedDeviceSchema),
  pendingPairings: z.array(PairingRequestSchema),
  integrations: z.array(IntegrationStateSchema),
  recentAudit: z.array(AuditSummarySchema),
  localOnly: z.literal(true),
});

export const ActivityFeedSchema = z.object({
  entries: z.array(AuditSummarySchema).max(100),
  generatedAt: TimestampSchema,
  localOnly: z.literal(true),
});

export const CalendarConnectionCalendarSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  owner: MemberSchema.nullable(),
});

export const CalendarConnectionSettingsSchema = z.object({
  id: OpaqueIdSchema,
  provider: z.literal('caldav'),
  label: z.string().trim().min(1).max(80),
  serverHost: z.string().trim().min(1).max(253),
  accountHint: z.string().trim().min(1).max(80),
  status: z.enum(['ready', 'needs-attention']),
  readOnly: z.literal(true),
  calendars: z.array(CalendarConnectionCalendarSchema).min(1).max(40),
  lastCheckedAt: TimestampSchema,
  lastSuccessfulAt: TimestampSchema.nullable(),
  message: z.string().trim().min(1).max(180),
});

const HttpsCalendarServerSchema = z
  .url()
  .max(500)
  .refine((value) => /^https:\/\//i.test(value), 'Expected an HTTPS URL');

export const CalendarConnectionTestRequestSchema = z
  .object({
    serverUrl: HttpsCalendarServerSchema,
    username: z.string().trim().min(1).max(320),
    appPassword: z.string().min(4).max(512),
  })
  .strict();

export const CalendarConnectionOptionSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const CalendarConnectionTestResultSchema = z.object({
  testId: OpaqueIdSchema,
  provider: z.literal('caldav'),
  serverHost: z.string().trim().min(1).max(253),
  accountHint: z.string().trim().min(1).max(80),
  availableCalendars: z.array(CalendarConnectionOptionSchema).min(1).max(40),
  expiresAt: TimestampSchema,
});

const SelectedCalendarSchema = z.object({
  calendarId: OpaqueIdSchema,
  ownerMemberId: OpaqueIdSchema.nullable(),
});

export const SaveCalendarConnectionRequestSchema = CommandRequestSchema.extend({
  testId: OpaqueIdSchema,
  label: z.string().trim().min(1).max(80),
  calendars: z.array(SelectedCalendarSchema).min(1).max(40),
}).superRefine((value, context) => {
  const ids = value.calendars.map(({ calendarId }) => calendarId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: 'custom',
      path: ['calendars'],
      message: 'Choose each calendar only once',
    });
  }
});

export const RemoveCalendarConnectionRequestSchema = CommandRequestSchema;

const CalendarMappingSchema = z.object({
  calendarId: OpaqueIdSchema,
  ownerMemberId: OpaqueIdSchema.nullable(),
});

export const UpdateCalendarMappingsRequestSchema = CommandRequestSchema.extend({
  calendars: z.array(CalendarMappingSchema).min(1).max(40),
}).superRefine((value, context) => {
  const ids = value.calendars.map(({ calendarId }) => calendarId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: 'custom',
      path: ['calendars'],
      message: 'Choose each calendar only once',
    });
  }
});

export const CalendarConnectionCommandResultSchema = z.object({
  connection: CalendarConnectionSettingsSchema.nullable(),
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const WeatherLocationSourceSchema = z.enum(['search', 'device', 'environment']);

export const WeatherLocationSchema = z.object({
  label: z.string().trim().min(1).max(120),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  source: WeatherLocationSourceSchema,
  updatedAt: TimestampSchema.nullable(),
});

export const WeatherLocationSearchRequestSchema = z
  .object({ query: z.string().trim().min(2).max(100) })
  .strict();

export const WeatherLocationSearchResultSchema = z.object({
  id: OpaqueIdSchema,
  label: z.string().trim().min(1).max(120),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const WeatherLocationSearchResultsSchema = z.object({
  results: z.array(WeatherLocationSearchResultSchema).max(10),
});

export const WeatherLocationTestRequestSchema = z
  .object({
    label: z.string().trim().min(1).max(120).nullable(),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    source: z.enum(['search', 'device']),
  })
  .strict();

export const WeatherLocationTestResultSchema = z.object({
  testId: OpaqueIdSchema,
  location: WeatherLocationSchema,
  current: WeatherSummarySchema,
  expiresAt: TimestampSchema,
});

export const SaveWeatherLocationRequestSchema = CommandRequestSchema.extend({
  testId: OpaqueIdSchema,
});

export const WeatherLocationCommandResultSchema = z.object({
  location: WeatherLocationSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const HomeAssistantConnectionSettingsSchema = z.object({
  id: OpaqueIdSchema,
  provider: z.literal('home-assistant'),
  label: z.string().trim().min(1).max(80),
  serverHost: z.string().trim().min(1).max(253),
  instanceName: z.string().trim().min(1).max(100),
  version: z.string().trim().min(1).max(40),
  status: z.enum(['ready', 'needs-attention']),
  stateMappings: z.object({
    occupancy: z.string().trim().min(1).max(100),
    televisionPower: z.string().trim().min(1).max(100),
    hearthForeground: z.string().trim().min(1).max(100),
    protectedMedia: z.string().trim().min(1).max(100),
  }),
  actionMappings: z.object({
    evening: z.string().trim().min(1).max(100),
    goodnight: z.string().trim().min(1).max(100),
    screenOff: z.string().trim().min(1).max(100),
  }),
  lastCheckedAt: TimestampSchema,
  lastSuccessfulAt: TimestampSchema.nullable(),
  message: z.string().trim().min(1).max(180),
});

const HomeAssistantServerUrlSchema = z
  .url()
  .max(500)
  .superRefine((value, context) => {
    const rootAddress = /^(https?):\/\/([^/@:#?]+|\[[^\]]+\])(?::\d+)?\/?$/i.exec(value);
    if (rootAddress === null) {
      context.addIssue({
        code: 'custom',
        message: 'Use the Home Assistant root address without credentials, a path or query',
      });
      return;
    }
    const [, protocol = '', hostname = ''] = rootAddress;
    if (protocol.toLowerCase() === 'http' && !isPrivateHomeAssistantHost(hostname)) {
      context.addIssue({
        code: 'custom',
        message: 'Plain HTTP is allowed only for a private local Home Assistant address',
      });
    }
  });

export const HomeAssistantConnectionTestRequestSchema = z
  .object({
    serverUrl: HomeAssistantServerUrlSchema,
    accessToken: z.string().trim().min(20).max(512),
  })
  .strict();

export const HomeAssistantConnectionOptionSchema = z.object({
  id: OpaqueIdSchema,
  displayName: z.string().trim().min(1).max(100),
  kindLabel: z.string().trim().min(1).max(60),
});

const HomeAssistantConnectionOptionsSchema = z.object({
  occupancy: z.array(HomeAssistantConnectionOptionSchema).max(80),
  televisionPower: z.array(HomeAssistantConnectionOptionSchema).max(80),
  hearthForeground: z.array(HomeAssistantConnectionOptionSchema).max(80),
  protectedMedia: z.array(HomeAssistantConnectionOptionSchema).max(80),
  scripts: z.array(HomeAssistantConnectionOptionSchema).max(80),
});

export const HomeAssistantConnectionTestResultSchema = z.object({
  testId: OpaqueIdSchema,
  provider: z.literal('home-assistant'),
  serverHost: z.string().trim().min(1).max(253),
  instanceName: z.string().trim().min(1).max(100),
  version: z.string().trim().min(1).max(40),
  options: HomeAssistantConnectionOptionsSchema,
  expiresAt: TimestampSchema,
});

const HomeAssistantMappingSelectionSchema = z.object({
  occupancyId: OpaqueIdSchema,
  televisionPowerId: OpaqueIdSchema,
  hearthForegroundId: OpaqueIdSchema,
  protectedMediaId: OpaqueIdSchema,
  eveningScriptId: OpaqueIdSchema,
  goodnightScriptId: OpaqueIdSchema,
  screenOffScriptId: OpaqueIdSchema,
});

export const SaveHomeAssistantConnectionRequestSchema = CommandRequestSchema.extend({
  testId: OpaqueIdSchema,
  label: z.string().trim().min(1).max(80),
  mappings: HomeAssistantMappingSelectionSchema,
}).superRefine((value, context) => {
  const states = [
    value.mappings.occupancyId,
    value.mappings.televisionPowerId,
    value.mappings.hearthForegroundId,
    value.mappings.protectedMediaId,
  ];
  const scripts = [
    value.mappings.eveningScriptId,
    value.mappings.goodnightScriptId,
    value.mappings.screenOffScriptId,
  ];
  if (new Set(states).size !== states.length) {
    context.addIssue({
      code: 'custom',
      path: ['mappings'],
      message: 'Choose a different state for each safety signal',
    });
  }
  if (new Set(scripts).size !== scripts.length) {
    context.addIssue({
      code: 'custom',
      path: ['mappings'],
      message: 'Choose a different script for each Home action',
    });
  }
});

export const RemoveHomeAssistantConnectionRequestSchema = CommandRequestSchema;

export const HomeAssistantConnectionCommandResultSchema = z.object({
  connection: HomeAssistantConnectionSettingsSchema.nullable(),
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const SystemBackupStatusSchema = z.object({
  state: z.enum(['ready', 'never-run', 'not-configured', 'failed']),
  scheduled: z.boolean(),
  retentionCount: z.number().int().min(1).max(90),
  lastSuccessfulAt: TimestampSchema.nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  message: z.string().trim().min(1).max(180),
});

export const SystemStatusSchema = z.object({
  version: z.string().trim().min(1).max(80),
  mode: RuntimeModeSchema,
  generatedAt: TimestampSchema,
  database: z.object({
    state: z.enum(['ready', 'needs-attention']),
    migrationVersion: z.number().int().positive(),
    message: z.string().trim().min(1).max(180),
  }),
  backup: SystemBackupStatusSchema,
});

export const CreateSystemBackupRequestSchema = CommandRequestSchema;

export const SystemBackupCommandResultSchema = z.object({
  status: SystemStatusSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const ApplianceReleaseVersionSchema = z
  .string()
  .regex(/^[a-f0-9]{40}$/, 'Use a complete verified release identifier');

export const ApplianceUpdatePhaseSchema = z.enum([
  'idle',
  'queued',
  'installing',
  'checking-health',
  'rolling-back',
  'succeeded',
  'failed',
]);

export const ApplianceUpdateCheckSchema = z.object({
  state: z.enum(['ready', 'attention', 'unavailable']),
  message: z.string().trim().min(1).max(160),
});

export const ApplianceUpdateOperationSchema = z.object({
  phase: ApplianceUpdatePhaseSchema,
  progress: z.number().int().min(0).max(100),
  message: z.string().trim().min(1).max(180),
  targetVersion: ApplianceReleaseVersionSchema.nullable(),
  startedAt: TimestampSchema.nullable(),
  completedAt: TimestampSchema.nullable(),
});

export const ApplianceUpdateStatusSchema = z.object({
  supported: z.boolean(),
  platform: z.enum(['synology', 'termux', 'development']),
  installedVersion: z.string().trim().min(1).max(80),
  checkedAt: TimestampSchema,
  availableRelease: z
    .object({
      version: ApplianceReleaseVersionSchema,
      publishedAt: TimestampSchema,
      summary: z.string().trim().min(1).max(180),
    })
    .nullable(),
  updateAvailable: z.boolean(),
  canInstall: z.boolean(),
  checks: z.object({
    internet: ApplianceUpdateCheckSchema,
    storage: ApplianceUpdateCheckSchema,
    power: ApplianceUpdateCheckSchema,
  }),
  operation: ApplianceUpdateOperationSchema,
});

export const InstallApplianceUpdateRequestSchema = CommandRequestSchema.extend({
  targetVersion: ApplianceReleaseVersionSchema,
}).strict();

export const ApplianceUpdateCommandResultSchema = z.object({
  status: ApplianceUpdateStatusSchema,
  backup: SystemBackupStatusSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

function isPrivateHomeAssistantHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.home.arpa') ||
    host === '::1'
  ) {
    return true;
  }
  if (host.includes(':')) {
    const firstHextet = Number.parseInt(host.split(':', 1)[0] ?? '', 16);
    return (
      Number.isInteger(firstHextet) &&
      ((firstHextet >= 0xfc00 && firstHextet <= 0xfdff) ||
        (firstHextet >= 0xfe80 && firstHextet <= 0xfebf))
    );
  }
  const octets = host.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  )
    return false;
  const [first = -1, second = -1] = octets;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}

export const UpdateHouseholdRequestSchema = CommandRequestSchema.extend({
  name: z.string().trim().min(1).max(100),
  timezone: TimezoneSchema,
});

const MemberFieldsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(['adult', 'child']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  administrator: z.boolean(),
});

function validateMemberPermissions(
  value: z.infer<typeof MemberFieldsSchema>,
  context: z.core.$RefinementCtx,
) {
  if (value.administrator && value.role !== 'adult') {
    context.addIssue({
      code: 'custom',
      message: 'Only an adult can be a household administrator.',
      path: ['administrator'],
    });
  }
}

export const CreateMemberRequestSchema = CommandRequestSchema.extend(
  MemberFieldsSchema.shape,
).superRefine(validateMemberPermissions);
export const UpdateMemberRequestSchema = CommandRequestSchema.extend(
  MemberFieldsSchema.shape,
).superRefine(validateMemberPermissions);
export const ArchiveMemberRequestSchema = CommandRequestSchema;

export const UpdateMemberAvatarRequestSchema = CommandRequestSchema.extend({
  mimeType: z.literal('image/jpeg'),
  dataBase64: z
    .string()
    .min(4)
    .max(1_400_000)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'Expected base64-encoded image data')
    .refine((value) => value.length % 4 === 0, 'Expected complete base64-encoded image data'),
});
export const ResetMemberAvatarRequestSchema = CommandRequestSchema;

export const MemberAvatarCommandResultSchema = z.object({
  member: MemberSchema,
  audit: AuditSummarySchema,
  replayed: z.boolean(),
});

export const CreatePairingRequestSchema = CommandRequestSchema.extend({
  deviceName: z.string().trim().min(1).max(80),
});

export const PairingSecretSchema = z
  .string()
  .min(43)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'Expected a base64url pairing secret');

export const CreateTvPairingSessionRequestSchema = CreatePairingRequestSchema.extend({
  applicationVersion: z.string().trim().min(1).max(40),
  pairingSecret: PairingSecretSchema,
});

export const TvPairingSessionSchema = z.object({
  pairing: PairingRequestSchema,
});

export const ExchangeTvPairingRequestSchema = CommandRequestSchema.extend({
  pairingSecret: PairingSecretSchema,
});

export const TvDeviceSessionSchema = z.object({
  deviceId: OpaqueIdSchema,
  householdId: OpaqueIdSchema,
  deviceName: z.string().min(1).max(80),
  scopes: PairedDeviceSchema.shape.scopes,
  pairedAt: TimestampSchema,
});

export const ApprovePairingRequestSchema = CommandRequestSchema.extend({
  code: PairingCodeSchema,
});

export const RevokeDeviceRequestSchema = CommandRequestSchema;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string().min(1).max(240),
    retryable: z.boolean(),
    requestId: OpaqueIdSchema.nullable(),
  }),
});

export const DemoScenarioSchema = z.enum([
  'healthy',
  'loading',
  'empty',
  'stale',
  'unavailable',
  'permission',
  'fail-next',
  'protected-media',
]);

export const DemoScenarioRequestSchema = z.object({ scenario: DemoScenarioSchema });

export type Member = z.infer<typeof MemberSchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type HouseholdSummary = z.infer<typeof HouseholdSummarySchema>;
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>;
export type RuntimeHousehold = z.infer<typeof RuntimeHouseholdSchema>;
export type RuntimeContext = z.infer<typeof RuntimeContextSchema>;
export type PasskeyAuthStatus = z.infer<typeof PasskeyAuthStatusSchema>;
export type FirstUsePasskeyOptionsRequest = z.infer<typeof FirstUsePasskeyOptionsRequestSchema>;
export type PasskeyCeremonyOptions = z.infer<typeof PasskeyCeremonyOptionsSchema>;
export type PasskeyCeremonyVerificationRequest = z.infer<
  typeof PasskeyCeremonyVerificationRequestSchema
>;
export type PasskeySession = z.infer<typeof PasskeySessionSchema>;
export type PasskeySignOutResult = z.infer<typeof PasskeySignOutResultSchema>;
export type PasskeyCredentialSummary = z.infer<typeof PasskeyCredentialSummarySchema>;
export type AdultAccessAccount = z.infer<typeof AdultAccessAccountSchema>;
export type AdultAccessSummary = z.infer<typeof AdultAccessSummarySchema>;
export type AdditionalPasskeyOptionsRequest = z.infer<typeof AdditionalPasskeyOptionsRequestSchema>;
export type RecoveryCodeConfirmationRequest = z.infer<typeof RecoveryCodeConfirmationRequestSchema>;
export type RecoveryCodeReveal = z.infer<typeof RecoveryCodeRevealSchema>;
export type RecoveryPasskeyOptionsRequest = z.infer<typeof RecoveryPasskeyOptionsRequestSchema>;
export type PasskeyRegistrationResult = z.infer<typeof PasskeyRegistrationResultSchema>;
export type RevokePasskeyRequest = z.infer<typeof RevokePasskeyRequestSchema>;
export type PasskeyRevocationResult = z.infer<typeof PasskeyRevocationResultSchema>;
export type IntegrationState = z.infer<typeof IntegrationStateSchema>;
export type CalendarSource = z.infer<typeof CalendarSourceSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type ChoreState = z.infer<typeof ChoreStateSchema>;
export type RoutineTimeOfDay = z.infer<typeof RoutineTimeOfDaySchema>;
export type ChoreOccurrence = z.infer<typeof ChoreOccurrenceSchema>;
export type TodaySummary = z.infer<typeof TodaySummarySchema>;
export type DailyVerseSummary = z.infer<typeof DailyVerseSummarySchema>;
export type WeatherSummary = z.infer<typeof WeatherSummarySchema>;
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;
export type WeatherCurrentConditions = z.infer<typeof WeatherCurrentConditionsSchema>;
export type HourlyWeatherForecast = z.infer<typeof HourlyWeatherForecastSchema>;
export type WeatherForecastDay = z.infer<typeof WeatherForecastDaySchema>;
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;
export type TodaySectionVisibility = z.infer<typeof TodaySectionVisibilitySchema>;
export type HouseholdNotice = z.infer<typeof HouseholdNoticeSchema>;
export type TodayConfiguration = z.infer<typeof TodayConfigurationSchema>;
export type CreateHouseholdNoticeRequest = z.infer<typeof CreateHouseholdNoticeRequestSchema>;
export type UpdateHouseholdNoticeRequest = z.infer<typeof UpdateHouseholdNoticeRequestSchema>;
export type UpdateTodaySectionsRequest = z.infer<typeof UpdateTodaySectionsRequestSchema>;
export type TodayConfigurationCommandResult = z.infer<typeof TodayConfigurationCommandResultSchema>;
export type TodayPhotoSummary = z.infer<typeof TodayPhotoSummarySchema>;
export type PhotoOrientation = z.infer<typeof PhotoOrientationSchema>;
export type PhotoAsset = z.infer<typeof PhotoAssetSchema>;
export type PhotoCurationAction = z.infer<typeof PhotoCurationActionSchema>;
export type PhotoAssetSource = z.infer<typeof PhotoAssetSourceSchema>;
export type PhotoCurationAsset = z.infer<typeof PhotoCurationAssetSchema>;
export type PhotoSourceSummary = z.infer<typeof PhotoSourceSummarySchema>;
export type PhotoCollection = z.infer<typeof PhotoCollectionSchema>;
export type PhotoGallery = z.infer<typeof PhotoGallerySchema>;
export type PhotoSourceIndexStatus = z.infer<typeof PhotoSourceIndexStatusSchema>;
export type PhotoUploadCapability = z.infer<typeof PhotoUploadCapabilitySchema>;
export type PhotoFolderImportStatus = z.infer<typeof PhotoFolderImportStatusSchema>;
export type RefreshPhotoSourceRequest = z.infer<typeof RefreshPhotoSourceRequestSchema>;
export type PhotoSourceRefreshResult = z.infer<typeof PhotoSourceRefreshResultSchema>;
export type UpdatePhotoCurationRequest = z.infer<typeof UpdatePhotoCurationRequestSchema>;
export type DeleteManagedPhotoRequest = z.infer<typeof DeleteManagedPhotoRequestSchema>;
export type PhotoCurationCommandResult = z.infer<typeof PhotoCurationCommandResultSchema>;
export type PhotoDeletionCommandResult = z.infer<typeof PhotoDeletionCommandResultSchema>;
export type PhotoUploadResult = z.infer<typeof PhotoUploadResultSchema>;
export type DailyForecast = z.infer<typeof DailyForecastSchema>;
export type WeekDay = z.infer<typeof WeekDaySchema>;
export type WeekSchedule = z.infer<typeof WeekScheduleSchema>;
export type MonthKey = z.infer<typeof MonthKeySchema>;
export type MonthDay = z.infer<typeof MonthDaySchema>;
export type MonthSchedule = z.infer<typeof MonthScheduleSchema>;
export type ChoreGroup = z.infer<typeof ChoreGroupSchema>;
export type ChoreList = z.infer<typeof ChoreListSchema>;
export type HomeActionId = z.infer<typeof HomeActionIdSchema>;
export type HomeAction = z.infer<typeof HomeActionSchema>;
export type PowerSafetyDecision = z.infer<typeof PowerSafetyDecisionSchema>;
export type HomeStatus = z.infer<typeof HomeStatusSchema>;
export type ExecuteHomeActionRequest = z.infer<typeof ExecuteHomeActionRequestSchema>;
export type AssistDaySummaryRequest = z.infer<typeof AssistDaySummaryRequestSchema>;
export type AssistChoreCompletionRequest = z.infer<typeof AssistChoreCompletionRequestSchema>;
export type ChoreRepeat = z.infer<typeof ChoreRepeatSchema>;
export type ChoreTemplate = z.infer<typeof ChoreTemplateSchema>;
export type ChoreTemplateList = z.infer<typeof ChoreTemplateListSchema>;
export type CreateChoreTemplateRequest = z.infer<typeof CreateChoreTemplateRequestSchema>;
export type UpdateChoreTemplateRequest = z.infer<typeof UpdateChoreTemplateRequestSchema>;
export type RestoreChoreTemplateRequest = z.infer<typeof RestoreChoreTemplateRequestSchema>;
export type ChoreTemplateCommandResult = z.infer<typeof ChoreTemplateCommandResultSchema>;
export type ReorderChoreTemplatesRequest = z.infer<typeof ReorderChoreTemplatesRequestSchema>;
export type ChoreTemplateOrderCommandResult = z.infer<typeof ChoreTemplateOrderCommandResultSchema>;
export type HouseholdListType = z.infer<typeof HouseholdListTypeSchema>;
export type ListItem = z.infer<typeof ListItemSchema>;
export type HouseholdList = z.infer<typeof HouseholdListSchema>;
export type HouseholdLists = z.infer<typeof HouseholdListsSchema>;
export type ArchivedHouseholdList = z.infer<typeof ArchivedHouseholdListSchema>;
export type HouseholdListSettings = z.infer<typeof HouseholdListSettingsSchema>;
export type CreateHouseholdListRequest = z.infer<typeof CreateHouseholdListRequestSchema>;
export type UpdateHouseholdListRequest = z.infer<typeof UpdateHouseholdListRequestSchema>;
export type ReorderHouseholdListsRequest = z.infer<typeof ReorderHouseholdListsRequestSchema>;
export type UpdateListItemRequest = z.infer<typeof UpdateListItemRequestSchema>;
export type ReorderListItemsRequest = z.infer<typeof ReorderListItemsRequestSchema>;
export type ListSettingsCommandResult = z.infer<typeof ListSettingsCommandResultSchema>;
export type AddListItemRequest = z.infer<typeof AddListItemRequestSchema>;
export type AssistAddListItemRequest = z.infer<typeof AssistAddListItemRequestSchema>;
export type ListItemCommandResult = z.infer<typeof ListItemCommandResultSchema>;
export type MealSlot = z.infer<typeof MealSlotSchema>;
export type SavedMeal = z.infer<typeof SavedMealSchema>;
export type SavedMealLibrary = z.infer<typeof SavedMealLibrarySchema>;
export type MealPlanEntry = z.infer<typeof MealPlanEntrySchema>;
export type MealPlanEntryInput = z.infer<typeof MealPlanEntryInputSchema>;
export type MealPlanDay = z.infer<typeof MealPlanDaySchema>;
export type MealPlan = z.infer<typeof MealPlanSchema>;
export type UpsertMealPlanRequest = z.infer<typeof UpsertMealPlanRequestSchema>;
export type CreateSavedMealRequest = z.infer<typeof CreateSavedMealRequestSchema>;
export type UpdateSavedMealRequest = z.infer<typeof UpdateSavedMealRequestSchema>;
export type UpdateMealPlanWeekRequest = z.infer<typeof UpdateMealPlanWeekRequestSchema>;
export type ClearMealPlanWeekRequest = z.infer<typeof ClearMealPlanWeekRequestSchema>;
export type CopyMealPlanWeekRequest = z.infer<typeof CopyMealPlanWeekRequestSchema>;
export type SavedMealCommandResult = z.infer<typeof SavedMealCommandResultSchema>;
export type MealCommandResult = z.infer<typeof MealCommandResultSchema>;
export type MealPlanWeekCommandResult = z.infer<typeof MealPlanWeekCommandResultSchema>;
export type Payday = z.infer<typeof PaydaySchema>;
export type PocketMoneyPaymentVoid = z.infer<typeof PocketMoneyPaymentVoidSchema>;
export type PocketMoneyPayment = z.infer<typeof PocketMoneyPaymentSchema>;
export type PocketMoneyChildSummary = z.infer<typeof PocketMoneyChildSummarySchema>;
export type PocketMoneyOverview = z.infer<typeof PocketMoneyOverviewSchema>;
export type UpdatePocketMoneySettingsRequest = z.infer<
  typeof UpdatePocketMoneySettingsRequestSchema
>;
export type RecordPocketMoneyPaymentRequest = z.infer<typeof RecordPocketMoneyPaymentRequestSchema>;
export type VoidPocketMoneyPaymentRequest = z.infer<typeof VoidPocketMoneyPaymentRequestSchema>;
export type PocketMoneySettingsCommandResult = z.infer<
  typeof PocketMoneySettingsCommandResultSchema
>;
export type PocketMoneyPaymentCommandResult = z.infer<typeof PocketMoneyPaymentCommandResultSchema>;
export type PocketMoneyPaymentVoidCommandResult = z.infer<
  typeof PocketMoneyPaymentVoidCommandResultSchema
>;
export type CommandRequest = z.infer<typeof CommandRequestSchema>;
export type CompletionReversalRequest = z.infer<typeof CompletionReversalRequestSchema>;
export type ChoreExceptionRequest = z.infer<typeof ChoreExceptionRequestSchema>;
export type ChoreReassignmentRequest = z.infer<typeof ChoreReassignmentRequestSchema>;
export type AuditSummary = z.infer<typeof AuditSummarySchema>;
export type ChoreCommandResult = z.infer<typeof ChoreCommandResultSchema>;
export type ChoreSkipResult = z.infer<typeof ChoreSkipResultSchema>;
export type ChoreOccurrenceChangeResult = z.infer<typeof ChoreOccurrenceChangeResultSchema>;
export type ChoreOccurrenceHistoryEntry = z.infer<typeof ChoreOccurrenceHistoryEntrySchema>;
export type ChoreOccurrenceDetail = z.infer<typeof ChoreOccurrenceDetailSchema>;
export type HomeActionResult = z.infer<typeof HomeActionResultSchema>;
export type AssistDaySummaryResult = z.infer<typeof AssistDaySummaryResultSchema>;
export type AssistChoreCompletionResult = z.infer<typeof AssistChoreCompletionResultSchema>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type DemoScenario = z.infer<typeof DemoScenarioSchema>;
export type AdminActor = z.infer<typeof AdminActorSchema>;
export type PairedDevice = z.infer<typeof PairedDeviceSchema>;
export type PairingRequest = z.infer<typeof PairingRequestSchema>;
export type AdminOverview = z.infer<typeof AdminOverviewSchema>;
export type ActivityFeed = z.infer<typeof ActivityFeedSchema>;
export type CalendarConnectionCalendar = z.infer<typeof CalendarConnectionCalendarSchema>;
export type CalendarConnectionSettings = z.infer<typeof CalendarConnectionSettingsSchema>;
export type CalendarConnectionTestRequest = z.infer<typeof CalendarConnectionTestRequestSchema>;
export type CalendarConnectionOption = z.infer<typeof CalendarConnectionOptionSchema>;
export type CalendarConnectionTestResult = z.infer<typeof CalendarConnectionTestResultSchema>;
export type SaveCalendarConnectionRequest = z.infer<typeof SaveCalendarConnectionRequestSchema>;
export type RemoveCalendarConnectionRequest = z.infer<typeof RemoveCalendarConnectionRequestSchema>;
export type CalendarConnectionCommandResult = z.infer<typeof CalendarConnectionCommandResultSchema>;
export type UpdateCalendarMappingsRequest = z.infer<typeof UpdateCalendarMappingsRequestSchema>;
export type WeatherLocationSource = z.infer<typeof WeatherLocationSourceSchema>;
export type WeatherLocation = z.infer<typeof WeatherLocationSchema>;
export type WeatherLocationSearchRequest = z.infer<typeof WeatherLocationSearchRequestSchema>;
export type WeatherLocationSearchResult = z.infer<typeof WeatherLocationSearchResultSchema>;
export type WeatherLocationSearchResults = z.infer<typeof WeatherLocationSearchResultsSchema>;
export type WeatherLocationTestRequest = z.infer<typeof WeatherLocationTestRequestSchema>;
export type WeatherLocationTestResult = z.infer<typeof WeatherLocationTestResultSchema>;
export type SaveWeatherLocationRequest = z.infer<typeof SaveWeatherLocationRequestSchema>;
export type WeatherLocationCommandResult = z.infer<typeof WeatherLocationCommandResultSchema>;
export type HomeAssistantConnectionSettings = z.infer<typeof HomeAssistantConnectionSettingsSchema>;
export type HomeAssistantConnectionTestRequest = z.infer<
  typeof HomeAssistantConnectionTestRequestSchema
>;
export type HomeAssistantConnectionOption = z.infer<typeof HomeAssistantConnectionOptionSchema>;
export type HomeAssistantConnectionTestResult = z.infer<
  typeof HomeAssistantConnectionTestResultSchema
>;
export type SaveHomeAssistantConnectionRequest = z.infer<
  typeof SaveHomeAssistantConnectionRequestSchema
>;
export type RemoveHomeAssistantConnectionRequest = z.infer<
  typeof RemoveHomeAssistantConnectionRequestSchema
>;
export type HomeAssistantConnectionCommandResult = z.infer<
  typeof HomeAssistantConnectionCommandResultSchema
>;
export type SystemBackupStatus = z.infer<typeof SystemBackupStatusSchema>;
export type SystemStatus = z.infer<typeof SystemStatusSchema>;
export type CreateSystemBackupRequest = z.infer<typeof CreateSystemBackupRequestSchema>;
export type SystemBackupCommandResult = z.infer<typeof SystemBackupCommandResultSchema>;
export type ApplianceReleaseVersion = z.infer<typeof ApplianceReleaseVersionSchema>;
export type ApplianceUpdatePhase = z.infer<typeof ApplianceUpdatePhaseSchema>;
export type ApplianceUpdateCheck = z.infer<typeof ApplianceUpdateCheckSchema>;
export type ApplianceUpdateOperation = z.infer<typeof ApplianceUpdateOperationSchema>;
export type ApplianceUpdateStatus = z.infer<typeof ApplianceUpdateStatusSchema>;
export type InstallApplianceUpdateRequest = z.infer<typeof InstallApplianceUpdateRequestSchema>;
export type ApplianceUpdateCommandResult = z.infer<typeof ApplianceUpdateCommandResultSchema>;
export type UpdateHouseholdRequest = z.infer<typeof UpdateHouseholdRequestSchema>;
export type CreateMemberRequest = z.infer<typeof CreateMemberRequestSchema>;
export type UpdateMemberRequest = z.infer<typeof UpdateMemberRequestSchema>;
export type ArchiveMemberRequest = z.infer<typeof ArchiveMemberRequestSchema>;
export type UpdateMemberAvatarRequest = z.infer<typeof UpdateMemberAvatarRequestSchema>;
export type ResetMemberAvatarRequest = z.infer<typeof ResetMemberAvatarRequestSchema>;
export type MemberAvatarCommandResult = z.infer<typeof MemberAvatarCommandResultSchema>;
export type CreatePairingRequest = z.infer<typeof CreatePairingRequestSchema>;
export type CreateTvPairingSessionRequest = z.infer<typeof CreateTvPairingSessionRequestSchema>;
export type TvPairingSession = z.infer<typeof TvPairingSessionSchema>;
export type ExchangeTvPairingRequest = z.infer<typeof ExchangeTvPairingRequestSchema>;
export type TvDeviceSession = z.infer<typeof TvDeviceSessionSchema>;
export type ApprovePairingRequest = z.infer<typeof ApprovePairingRequestSchema>;
export type RevokeDeviceRequest = z.infer<typeof RevokeDeviceRequestSchema>;
