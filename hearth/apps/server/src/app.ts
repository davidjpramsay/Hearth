import { FitnessLibraryService } from './fitness-library-service.js';
import { fitnessByteRange } from './fitness-media.js';
import {
  MAX_FITNESS_CLIP_BYTES,
  FitnessLibrarySchema,
  FitnessLibraryCommandSchema,
  FitnessLibraryResultSchema,
  SaveFitnessLibraryExerciseSchema,
} from '@hearth/shared';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { BrowserAccess } from './browser-access.js';
import { NbaService } from './nba-service.js';
import { FitnessService } from './fitness-service.js';
import { MorningRoutineService } from './morning-routine-service.js';
import { IndoorClimateService, createDemoIndoorService } from './indoor-climate-service.js';
import { RestIndoorProvider } from './integrations/indoor-climate-provider.js';
import {
  IndoorClimateSchema,
  IndoorPeriodSchema,
  IndoorSettingsSchema,
  IndoorTestSchema,
  SaveIndoorSettingsSchema,
  IndoorDiscoverySchema,
  IndoorSettingsResultSchema,
} from '@hearth/shared';
import {
  FitnessOverviewSchema,
  FitnessSettingsSchema,
  UpdateFitnessSettingsSchema,
  SetFitnessCompletionSchema,
  MorningOverviewSchema,
  MorningSettingsSchema,
  MorningSettingsCommandSchema,
  SetMorningCompletionSchema,
} from '@hearth/shared';
import { NbaGameService } from './nba-game-service.js';
import {
  DemoNbaBoxScore,
  EspnNbaBoxScore,
  type NbaBoxScoreProvider,
} from './integrations/nba-box-score.js';
import { DemoNbaProvider, EspnNbaProvider } from './integrations/nba-provider.js';
import { EspnNbaMedia, NoNbaMedia, type NbaMediaProvider } from './integrations/nba-media.js';
import { HomeAssistantBridgeService } from './home-assistant-bridge.js';
import { HomeAssistantPairingService } from './home-assistant-pairings.js';
import { ModuleRequestLeases, ModulesService, moduleForApiRoute } from './modules-repository.js';
import {
  ModuleIdSchema,
  ModulesConfigurationSchema,
  UpdateModuleRequestSchema,
  ModuleCommandResultSchema,
  NbaOverviewSchema,
  NbaSettingsSchema,
  UpdateNbaSettingsSchema,
  NbaTeamIdSchema,
  NbaPlayerIdSchema,
} from '@hearth/shared';
import { PHONE_PENDING_COOKIE, type PhoneConnectionService } from './phone-connections.js';
import { z } from 'zod';

import {
  HomeDomainError,
  PlanningDomainError,
  buildAssistDaySummary,
  resolveAssistChore,
  resolveHouseholdListTarget,
} from '@hearth/core';

import {
  isTelevisionUserAgent,
  BridgeCalendarQuerySchema,
  BridgeChoreCompletionRequestSchema,
  BridgeConnectionSchema,
  BridgeGrantRequestSchema,
  BridgeGrantResultSchema,
  BridgePairingStartSchema,
  BridgePairingSchema,
  BridgePairingApprovalSchema,
  BridgePairingApprovalResultSchema,
  BridgePairingExchangeSchema,
  BridgePairingExchangeResultSchema,
  ScreenNavigationRequestSchema,
  ScreenNavigationResultSchema,
  ScreenPresentationRequestSchema,
  ScreenPresentationResultSchema,
  OwnerPhoneClaimSchema,
  PhoneInvitationCreateSchema,
  PhoneInvitationClaimSchema,
  PhoneCommandSchema,
  PhoneConnectionsSchema,
  PhoneInvitationStateSchema,
  PhoneInvitationRevealSchema,
  PhonePendingSchema,
  PhoneRemovalSchema,
  PhoneConfirmationSchema,
  PhoneRecoverySummarySchema,
  PhoneRecoveryPolicyCommandSchema,
  PhoneRecoveryCardRevealSchema,
  PhoneRecoveryCommandResultSchema,
  PhoneRecoveryClaimSchema,
  AddListItemRequestSchema,
  GameCatalogueSchema,
  WordGroupsPuzzleSchema,
  AdditionalPasskeyOptionsRequestSchema,
  ActivityFeedSchema,
  AdminOverviewSchema,
  ApplianceUpdateCommandResultSchema,
  ApplianceUpdateStatusSchema,
  AdultAccessSummarySchema,
  ApiErrorSchema,
  AssistAddListItemRequestSchema,
  AssistChoreCompletionRequestSchema,
  AssistChoreCompletionResultSchema,
  AssistDaySummaryRequestSchema,
  AssistDaySummaryResultSchema,
  ApprovePairingRequestSchema,
  ArchiveMemberRequestSchema,
  ArchiveHouseholdNoticeRequestSchema,
  CalendarConnectionCommandResultSchema,
  CalendarConnectionSettingsSchema,
  CalendarConnectionTestRequestSchema,
  CalendarConnectionTestResultSchema,
  ChoreCommandResultSchema,
  ChoreExceptionRequestSchema,
  ChoreListSchema,
  ChoreOccurrenceChangeResultSchema,
  ChoreOccurrenceDetailSchema,
  ChoreReassignmentRequestSchema,
  ChoreSkipResultSchema,
  ChoreTemplateCommandResultSchema,
  ChoreTemplateListSchema,
  ChoreTemplateOrderCommandResultSchema,
  CommandRequestSchema,
  CompletionReversalRequestSchema,
  CopyMealPlanWeekRequestSchema,
  CreateMemberRequestSchema,
  CreateHouseholdNoticeRequestSchema,
  CreatePairingRequestSchema,
  CreateReminderRequestSchema,
  CreateTvPairingSessionRequestSchema,
  CreateChoreTemplateRequestSchema,
  CreateHouseholdListRequestSchema,
  CreateSavedMealRequestSchema,
  DeleteReminderRequestSchema,
  DeleteManagedPhotoRequestSchema,
  DemoScenarioRequestSchema,
  ExecuteHomeActionRequestSchema,
  ExchangeTvPairingRequestSchema,
  FirstUsePasskeyOptionsRequestSchema,
  HouseholdListsSchema,
  HouseholdListSettingsSchema,
  HomeActionIdSchema,
  HomeActionResultSchema,
  HomeAssistantConnectionCommandResultSchema,
  HomeAssistantConnectionSettingsSchema,
  HomeAssistantConnectionTestRequestSchema,
  HomeAssistantConnectionTestResultSchema,
  HomeStatusSchema,
  InstallApplianceUpdateRequestSchema,
  ListItemCommandResultSchema,
  ListSettingsCommandResultSchema,
  LocalDateSchema,
  ClearMealPlanWeekRequestSchema,
  MealCommandResultSchema,
  MealPlanSchema,
  MealPlanWeekCommandResultSchema,
  MemberAvatarCommandResultSchema,
  type Member,
  MemberSchema,
  MonthKeySchema,
  MonthScheduleSchema,
  OpaqueIdSchema,
  PairedDeviceSchema,
  PairingRequestSchema,
  PasskeyAuthStatusSchema,
  PasskeyCeremonyOptionsSchema,
  PasskeyCeremonyVerificationRequestSchema,
  PasskeyRegistrationResultSchema,
  PasskeyRevocationResultSchema,
  PasskeySessionSchema,
  PasskeySignOutResultSchema,
  PhotoCurationCommandResultSchema,
  PhotoDeletionCommandResultSchema,
  PhotoGallerySchema,
  PhotoSourceIndexStatusSchema,
  PhotoSourceRefreshResultSchema,
  PhotoUploadResultSchema,
  RefreshPhotoSourceRequestSchema,
  ReminderOverviewSchema,
  ReminderCommandResultSchema,
  ReminderDeletionResultSchema,
  RestoreChoreTemplateRequestSchema,
  ReorderHouseholdListsRequestSchema,
  ReorderChoreTemplatesRequestSchema,
  ReorderListItemsRequestSchema,
  PocketMoneyOverviewSchema,
  PocketMoneyPaymentCommandResultSchema,
  PocketMoneyPaymentVoidCommandResultSchema,
  PocketMoneySettingsCommandResultSchema,
  RealtimeEventSchema,
  RecoveryCodeConfirmationRequestSchema,
  RecoveryCodeRevealSchema,
  RecoveryPasskeyOptionsRequestSchema,
  RecordPocketMoneyPaymentRequestSchema,
  RemoveCalendarConnectionRequestSchema,
  RemoveHomeAssistantConnectionRequestSchema,
  ResetMemberAvatarRequestSchema,
  RevokeDeviceRequestSchema,
  RevokePasskeyRequestSchema,
  RuntimeContextSchema,
  SavedMealCommandResultSchema,
  SavedMealLibrarySchema,
  SaveCalendarConnectionRequestSchema,
  SaveHomeAssistantConnectionRequestSchema,
  SetReminderCompletionRequestSchema,
  SystemBackupCommandResultSchema,
  SystemStatusSchema,
  TimestampSchema,
  TodayConfigurationCommandResultSchema,
  TodayConfigurationSchema,
  TvDeviceSessionSchema,
  TvPairingSessionSchema,
  UpdateHouseholdRequestSchema,
  UpdateCalendarMappingsRequestSchema,
  UpdateHouseholdNoticeRequestSchema,
  UpdateChoreTemplateRequestSchema,
  UpdateHouseholdListRequestSchema,
  UpdateListItemRequestSchema,
  UpdateMemberRequestSchema,
  UpdateMemberAvatarRequestSchema,
  UpdateMealPlanWeekRequestSchema,
  UpdatePhotoCurationRequestSchema,
  UpdatePocketMoneySettingsRequestSchema,
  UpdateReminderRequestSchema,
  UpdateSavedMealRequestSchema,
  UpdateTodaySectionsRequestSchema,
  VoidPocketMoneyPaymentRequestSchema,
  WeekScheduleSchema,
  WeatherForecastSchema,
  WeatherLocationCommandResultSchema,
  WeatherLocationSchema,
  WeatherLocationSearchRequestSchema,
  WeatherLocationSearchResultsSchema,
  WeatherLocationTestRequestSchema,
  WeatherLocationTestResultSchema,
  SaveWeatherLocationRequestSchema,
  UpsertMealPlanRequestSchema,
} from '@hearth/shared';

import {
  DEMO_ADMIN_ACTOR_ID,
  InMemoryAdminRepository,
  credentialHash,
  type AdminRepository,
} from './admin-repository.js';
import {
  UnavailableApplianceUpdateService,
  type ApplianceUpdateRepository,
} from './appliance-update.js';
import {
  CalendarConnectionService,
  FakeCalendarConnectionVerifier,
  type CalendarConnectionRepository,
} from './calendar-connection-repository.js';
import { HEARTH_COMPANION_COOKIE, type CompanionAuthRepository } from './companion-auth.js';
import {
  FakeHomeAssistantConnectionVerifier,
  HomeAssistantConnectionService,
  type HomeAssistantConnectionRepository,
} from './home-assistant-connection-repository.js';
import { RealtimeHub } from './realtime.js';
import { GamesArchive } from './games-archive.js';
import { createTodayReader } from './today-reader.js';
import { TodayVerseCache } from './integrations/today-verse-cache.js';
import { localDateInTimezone } from '@hearth/core';
import { DailyVerseSummarySchema } from '@hearth/shared';
import { HomeService, type HomeRepository } from './home-repository.js';
import { UnconfiguredHomeAssistantProvider } from './integrations/home-assistant-provider.js';
import {
  FakeDailyVerseProvider,
  UnconfiguredDailyVerseProvider,
  type DailyVerseProvider,
} from './integrations/daily-verse-provider.js';
import { UnconfiguredPhotoSourceProvider } from './integrations/photo-source.js';
import { MAX_MANAGED_PHOTO_BYTES } from './integrations/synology-photo-source.js';
import { PhotoService, type PhotoRepository } from './photo-repository.js';
import { InMemoryPlanningRepository, type PlanningRepository } from './planning-repository.js';
import { PocketMoneyService, type PocketMoneyRepository } from './pocket-money-repository.js';
import { ReminderService, type ReminderRepository } from './reminder-repository.js';
import { TodayContentService, type TodayContentRepository } from './today-content-repository.js';
import {
  FakeWeatherLocationVerifier,
  WeatherLocationService,
  type WeatherLocationRepository,
} from './weather-location-repository.js';
import { InMemorySystemOperations, type SystemOperationsRepository } from './system-operations.js';
import { DEMO_HOUSEHOLD_ID, DEMO_NOW } from './demo/seed.js';
import {
  DEMO_TV_ACTOR,
  InMemoryHearthRepository,
  RepositoryError,
  type CommandActor,
  type HearthRepository,
} from './repository.js';
import {
  FixedClock,
  SystemClock,
  resolveRuntimeContext,
  type RuntimeConfiguration,
} from './runtime-context.js';

const HouseholdParamsSchema = z.object({ householdId: OpaqueIdSchema });
const ChoreParamsSchema = HouseholdParamsSchema.extend({ occurrenceId: OpaqueIdSchema });
const HomeActionParamsSchema = HouseholdParamsSchema.extend({ actionId: HomeActionIdSchema });
const MemberParamsSchema = HouseholdParamsSchema.extend({ memberId: OpaqueIdSchema });
const DeviceParamsSchema = HouseholdParamsSchema.extend({ deviceId: OpaqueIdSchema });
const ListParamsSchema = HouseholdParamsSchema.extend({ listId: OpaqueIdSchema });
const ListItemParamsSchema = HouseholdParamsSchema.extend({ itemId: OpaqueIdSchema });
const SavedMealParamsSchema = HouseholdParamsSchema.extend({ mealId: OpaqueIdSchema });
const ChoreTemplateParamsSchema = HouseholdParamsSchema.extend({ templateId: OpaqueIdSchema });
const NoticeParamsSchema = HouseholdParamsSchema.extend({ noticeId: OpaqueIdSchema });
const PocketMoneyPaymentParamsSchema = HouseholdParamsSchema.extend({ paymentId: OpaqueIdSchema });
const PhotoCurationParamsSchema = HouseholdParamsSchema.extend({ assetId: OpaqueIdSchema });
const PasskeyParamsSchema = HouseholdParamsSchema.extend({ passkeyId: OpaqueIdSchema });
const PhotoAssetParamsSchema = HouseholdParamsSchema.extend({
  assetId: OpaqueIdSchema,
  variant: z.enum(['display', 'thumbnail']),
});
const PhotoUploadHeadersSchema = z
  .object({
    'content-type': z.string().min(1).max(100),
    'x-hearth-request-id': OpaqueIdSchema,
    'x-hearth-photo-captured-at': TimestampSchema.optional(),
  })
  .passthrough();
const PHOTO_UPLOAD_MIME_TYPES = new Set([
  'image/avif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tif',
  'image/tiff',
  'image/webp',
  'image/x-heic',
  'image/x-heif',
]);
const PairingParamsSchema = z.object({ pairingId: OpaqueIdSchema });
const ReminderParamsSchema = HouseholdParamsSchema.extend({
  reminderId: OpaqueIdSchema,
});
const ReminderQuerySchema = z.object({
  includeCompleted: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});
const TodayQuerySchema = z.object({ date: LocalDateSchema });
const WeekQuerySchema = z.object({ start: LocalDateSchema });
const MonthQuerySchema = z.object({ month: MonthKeySchema });
const PocketMoneyQuerySchema = z.object({
  weekStart: LocalDateSchema,
  asOf: LocalDateSchema,
});
const ActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const LOGGER_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'request.headers.authorization',
  '*.token',
  '*.password',
  '*.dataBase64',
  '*.appPassword',
  '*.accessToken',
  '*.setupCode',
  '*.recoveryCode',
  '*.pairingSecret',
  '*.secret',
  'req.body.secret',
  'req.body.code',
  '*.ownerKey',
  '*.invitationSecret',
  '*.pendingToken',
  '*.qrUrl',
  'req.body.ownerKey',
  'req.body.invitationSecret',
  '*.recoverySecret',
  'req.body.recoverySecret',
] as const;

export const HEARTH_DEVICE_COOKIE = 'hearth_device';
const DEVICE_SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export interface BuildServerOptions {
  repository?: HearthRepository;
  adminRepository?: AdminRepository;
  logger?: boolean;
  demoMode?: boolean;
  realtimeHub?: RealtimeHub;
  planningRepository?: PlanningRepository;
  homeRepository?: HomeRepository;
  photoRepository?: PhotoRepository;
  pocketMoneyRepository?: PocketMoneyRepository;
  reminderRepository?: ReminderRepository;
  calendarConnectionRepository?: CalendarConnectionRepository;
  homeAssistantConnectionRepository?: HomeAssistantConnectionRepository;
  homeAssistantBridge?: HomeAssistantBridgeService;
  homeAssistantPairings?: HomeAssistantPairingService;
  modules?: ModulesService;
  systemOperations?: SystemOperationsRepository;
  applianceUpdate?: ApplianceUpdateRepository;
  companionAuth?: CompanionAuthRepository;
  phoneConnections?: PhoneConnectionService;
  todayContentRepository?: TodayContentRepository;
  dailyVerseProvider?: DailyVerseProvider;
  weatherLocationRepository?: WeatherLocationRepository;
  runtime?: RuntimeConfiguration;
  releaseVersion?: string;
  trustedProxyAddresses?: string[];
  readiness?: () => Promise<void> | void;
  gamesArchive?: GamesArchive;
  nba?: NbaService;
  fitness?: FitnessService;
  fitnessLibrary?: FitnessLibraryService;
  morningRoutine?: MorningRoutineService;
  indoorClimate?: IndoorClimateService;
  nbaBoxScore?: NbaBoxScoreProvider;
  nbaMedia?: NbaMediaProvider;
}

export function buildServer(options: BuildServerOptions = {}): FastifyInstance {
  const browserAccess = new BrowserAccess();
  const browserRequests = new WeakMap<FastifyRequest, ReturnType<BrowserAccess['begin']>>();
  const runtime =
    options.runtime ??
    (options.demoMode === false
      ? {
          mode: 'private' as const,
          householdId: null,
          clock: new SystemClock(),
        }
      : {
          mode: 'test' as const,
          householdId: DEMO_HOUSEHOLD_ID,
          clock: new FixedClock(DEMO_NOW),
        });
  const demoMode = runtime.mode !== 'private';
  const gamesArchive = options.gamesArchive ?? new GamesArchive(undefined, demoMode);
  const nbaMedia = options.nbaMedia ?? (demoMode ? new NoNbaMedia() : new EspnNbaMedia());
  const nba =
    options.nba ??
    new NbaService(demoMode ? new DemoNbaProvider() : new EspnNbaProvider(), undefined, () =>
      runtime.clock.now(),
    );
  const releaseVersion =
    options.releaseVersion?.trim() || process.env.HEARTH_VERSION?.trim() || 'development';
  const nbaGames = new NbaGameService(
    nba,
    options.nbaBoxScore ?? (demoMode ? new DemoNbaBoxScore() : new EspnNbaBoxScore()),
    () => runtime.clock.now(),
  );
  const modules = options.modules ?? new ModulesService(undefined, () => runtime.clock.now());
  const fitnessLibrary = options.fitnessLibrary ?? new FitnessLibraryService();
  const fitness = options.fitness ?? new FitnessService(undefined, () => runtime.clock.now());
  const morningRoutine =
    options.morningRoutine ?? new MorningRoutineService(undefined, () => runtime.clock.now());
  const moduleLeases = new ModuleRequestLeases();
  const moduleRequests = new WeakMap<
    FastifyRequest,
    { release?: () => void; finished: boolean; executing: boolean }
  >();
  const repository = options.repository ?? new InMemoryHearthRepository();
  const adminRepository =
    options.adminRepository ?? new InMemoryAdminRepository(() => runtime.clock.now());
  const realtime = options.realtimeHub ?? new RealtimeHub();
  const indoorClimate =
    options.indoorClimate ??
    (demoMode
      ? createDemoIndoorService(adminRepository, () => runtime.clock.now())
      : new IndoorClimateService(new RestIndoorProvider(), {
          admin: adminRepository,
          now: () => runtime.clock.now(),
        }));
  const planningRepository = options.planningRepository ?? new InMemoryPlanningRepository();
  const homeRepository =
    options.homeRepository ??
    (demoMode ? new HomeService() : new HomeService(new UnconfiguredHomeAssistantProvider()));
  const photoRepository =
    options.photoRepository ??
    (demoMode ? new PhotoService() : new PhotoService(new UnconfiguredPhotoSourceProvider()));
  const pocketMoneyRepository =
    options.pocketMoneyRepository ??
    new PocketMoneyService(repository, adminRepository, undefined, {
      seedDemo: demoMode,
      clock: runtime.clock,
    });
  const reminderRepository =
    options.reminderRepository ??
    new ReminderService(adminRepository, undefined, { seedDemo: demoMode, clock: runtime.clock });
  const todayContentRepository = options.todayContentRepository ?? new TodayContentService();
  const dailyVerseProvider =
    options.dailyVerseProvider ??
    (demoMode ? new FakeDailyVerseProvider() : new UnconfiguredDailyVerseProvider());
  const weatherLocationRepository =
    options.weatherLocationRepository ??
    new WeatherLocationService(adminRepository, new FakeWeatherLocationVerifier(), {
      now: () => runtime.clock.now(),
    });
  const calendarConnectionRepository =
    options.calendarConnectionRepository ??
    new CalendarConnectionService(
      adminRepository,
      new FakeCalendarConnectionVerifier(),
      demoMode
        ? {}
        : {
            credentialStore: {
              load: async () => {
                throw new Error('Private calendar secret storage is not configured.');
              },
              save: async () => {
                throw new Error('Private calendar secret storage is not configured.');
              },
              updateMappings: async () => {
                throw new Error('Private calendar secret storage is not configured.');
              },
              remove: async () => undefined,
            },
          },
    );
  const homeAssistantConnectionRepository =
    options.homeAssistantConnectionRepository ??
    new HomeAssistantConnectionService(
      adminRepository,
      new FakeHomeAssistantConnectionVerifier(),
      demoMode
        ? { now: () => runtime.clock.now() }
        : {
            now: () => runtime.clock.now(),
            credentialStore: {
              save: async () => {
                throw new Error('Private Home Assistant secret storage is not configured.');
              },
              remove: async () => undefined,
            },
          },
    );
  const systemOperations =
    options.systemOperations ??
    new InMemorySystemOperations(adminRepository, {
      version: releaseVersion,
      mode: runtime.mode,
      clock: runtime.clock,
    });
  const applianceUpdate =
    options.applianceUpdate ??
    new UnavailableApplianceUpdateService(adminRepository, {
      installedVersion: releaseVersion,
      clock: runtime.clock,
    });
  const server = Fastify({
    bodyLimit: 1_500_000,
    trustProxy: options.trustedProxyAddresses?.length ? options.trustedProxyAddresses : false,
    logger:
      options.logger === false
        ? false
        : {
            level: process.env.HEARTH_LOG_LEVEL ?? 'info',
            redact: [...LOGGER_REDACT_PATHS],
          },
  });
  server.addContentTypeParser('video/mp4', { parseAs: 'buffer' }, (_request, body, done) =>
    done(null, body),
  );
  server.addContentTypeParser(/^image\/.*/i, { parseAs: 'buffer' }, (_request, body, done) => {
    done(null, body);
  });

  const verseCache = new TodayVerseCache(dailyVerseProvider, (id) =>
    realtime.publish(id, 'today.changed', id),
  );
  const readToday = createTodayReader({
    modules,
    repository,
    adminRepository,
    planningRepository,
    photoRepository,
    todayContentRepository,
    reminderRepository,
    verseCache,
    now: () => runtime.clock.now(),
  });
  const homeAssistantBridge =
    options.homeAssistantBridge ??
    new HomeAssistantBridgeService(adminRepository, repository, {
      modules,
      now: () => runtime.clock.now(),
    });
  homeAssistantBridge.setModules(modules);
  (repository as HearthRepository).setModuleAvailability?.((id) => modules.get(id).enabled);
  const homeAssistantPairings =
    options.homeAssistantPairings ??
    new HomeAssistantPairingService(homeAssistantBridge, {
      now: () => runtime.clock.now(),
      assertApproval: (reference) => {
        if (options.phoneConnections) options.phoneConnections.assertApprovalReference(reference);
        else if (isPrivateMode(options))
          throw new RepositoryError('FORBIDDEN', 'Connect an adult phone first.');
      },
    });
  const machinePairingRoutes = new Set([
    '/api/v1/home-assistant/pairing-requests',
    '/api/v1/home-assistant/pairing-requests/:id/exchanges',
  ]);
  const automationRoutes = new Set([
    '/api/v1/home-assistant/modules/:moduleId',
    '/api/v1/home-assistant/state',
    '/api/v1/home-assistant/calendar',
    '/api/v1/home-assistant/screens/:deviceId/navigation',
    '/api/v1/home-assistant/chores/:occurrenceId/completion',
  ]);
  const automationSecret = (request: FastifyRequest): string => {
    const authorization = request.headers.authorization;
    if (
      request.headers.cookie !== undefined ||
      typeof authorization !== 'string' ||
      !/^HearthAutomation ha_[A-Za-z0-9_-]{43}$/.test(authorization)
    )
      throw new RepositoryError(
        'UNAUTHENTICATED',
        'Use the dedicated Home Assistant connection key.',
      );
    return authorization.slice('HearthAutomation '.length);
  };

  const retireRetainedScreenSession = (request: FastifyRequest, reply: FastifyReply) => {
    if (!isPrivateMode(options) || !isSharedScreenRequest(request.headers)) return;
    const retainedAdult = optionalCompanionCredential(request.headers);
    if (retainedAdult !== null && options.companionAuth !== undefined) {
      // Removing a screen cookie must never resurrect its retained adult authority.
      options.companionAuth.invalidateBrowserSession(retainedAdult);
      reply.header('Set-Cookie', options.companionAuth.clearSessionCookie());
    }
  };

  server.addHook('preHandler', async (request, reply) => {
    const routeUrl = request.routeOptions.url;
    if (routeUrl !== undefined && machinePairingRoutes.has(routeUrl)) {
      return run(reply, async () => {
        if (
          request.headers.cookie !== undefined ||
          request.headers.authorization !== undefined ||
          request.headers.origin !== undefined
        )
          throw new RepositoryError(
            'FORBIDDEN',
            'Start this request in the Home Assistant integration, not a browser.',
          );
      });
    }
    // This branch must precede browser/device classification. Never fall back to mixed cookies.
    const usesAutomation =
      typeof request.headers.authorization === 'string' &&
      /^\s*HearthAutomation(?:\s|$)/i.test(request.headers.authorization);
    if (usesAutomation || (routeUrl !== undefined && automationRoutes.has(routeUrl))) {
      return run(reply, async () => {
        if (routeUrl === undefined || !automationRoutes.has(routeUrl))
          throw new RepositoryError(
            'FORBIDDEN',
            'Home Assistant may use only its dedicated Hearth bridge endpoints.',
          );
        homeAssistantBridge.authenticate(automationSecret(request));
      });
    }
    if (
      options.phoneConnections &&
      (routeUrl?.includes('/auth/phones/') || routeUrl === '/api/v1/auth/sign-outs') &&
      request.method !== 'GET'
    ) {
      await run(reply, async () =>
        options.phoneConnections!.assertOrigin(
          request.headers.origin,
          request.headers['sec-fetch-site'],
        ),
      );
      if (reply.sent) return reply;
    }
    if (
      options.phoneConnections &&
      ((routeUrl?.startsWith('/api/v1/auth/') &&
        !routeUrl.includes('/phones/') &&
        !['/api/v1/auth/status', '/api/v1/auth/session', '/api/v1/auth/sign-outs'].includes(
          routeUrl,
        )) ||
        routeUrl?.includes('/adult-access/'))
    ) {
      return run(reply, async () => {
        throw new RepositoryError(
          'FORBIDDEN',
          'Passkey sign-in is retired. Use an adult connection code or scan a private setup or recovery card.',
        );
      });
    }
    if (options.phoneConnections && routeUrl?.includes('/phone-') && request.method !== 'GET') {
      await run(reply, async () =>
        options.phoneConnections!.assertOrigin(
          request.headers.origin,
          request.headers['sec-fetch-site'],
        ),
      );
      if (reply.sent) return reply;
    }
    retireRetainedScreenSession(request, reply);
    if (
      routeUrl?.startsWith('/api/v1/auth/') &&
      routeUrl !== '/api/v1/auth/status' &&
      routeUrl !== '/api/v1/auth/sign-outs'
    ) {
      await run(reply, async () => {
        assertControllerRequest(request.headers);
        browserRequests.set(
          request,
          browserAccess.begin(
            request.headers,
            reply,
            isPrivateMode(options),
            routeUrl.endsWith('-verifications'),
          ),
        );
      });
      if (reply.sent) return reply;
    }
    if (
      runtime.mode !== 'private' ||
      routeUrl === undefined ||
      !routeUrl.startsWith('/api/v1/households/:householdId')
    ) {
      return;
    }
    const params = HouseholdParamsSchema.safeParse(request.params);
    if (!params.success) return;
    return run(reply, async () => {
      await authorizePrivateHouseholdRead(
        request.headers,
        params.data.householdId,
        options,
        adminRepository,
      );
    });
  });

  const finishBrowserRequest = async (request: FastifyRequest) => {
    browserRequests.get(request)?.finish();
  };
  server.addHook('onResponse', finishBrowserRequest);
  server.addHook('onRequestAbort', finishBrowserRequest);
  server.addHook('onTimeout', finishBrowserRequest);
  // Hold feature reads/writes until their response completes; a module-off commit cannot race
  // a preceding authorized feature mutation. Core event streams never hold these finite leases.
  server.addHook('preHandler', async (request, reply) => {
    if (reply.sent) return;
    const route = request.routeOptions.url ?? '';
    const household = (request.params as { householdId?: string }).householdId;
    const automation = automationRoutes.has(route)
      ? homeAssistantBridge.authenticate(automationSecret(request)).householdId
      : null;
    const id = household ?? automation;
    if (!id || route.endsWith('/events') || !route.startsWith('/api/v1/')) return;
    const write = request.method === 'PUT' && /\/modules\/:moduleId$/.test(route);
    const content =
      moduleForApiRoute(route) !== null ||
      automation !== null ||
      /\/(today|today-configuration|today-sections|admin|assist\/day-summary)$/.test(route);
    if (!write && !content) return;
    await run(reply, async () => {
      const pending: { release?: () => void; finished: boolean; executing: boolean } = {
        finished: false,
        executing: false,
      };
      moduleRequests.set(request, pending);
      reply.raw.once('close', () => void finishModuleRequest(request));
      const release = await moduleLeases.acquire(id, write);
      if (pending.finished || request.raw.aborted) {
        release();
        throw new RepositoryError('COMMAND_FAILED', 'That request was cancelled.', true);
      }
      pending.release = release;
      const module = moduleForApiRoute(route);
      if (module) modules.assertEnabled(id, module);
    });
  });
  const finishModuleRequest = async (request: FastifyRequest) => {
    const entry = moduleRequests.get(request);
    if (!entry) return;
    entry.finished = true;
    if (!entry.executing) entry.release?.();
  };
  server.addHook('onResponse', finishModuleRequest);
  server.addHook('onRequestAbort', finishModuleRequest);
  server.addHook('onTimeout', finishModuleRequest);
  server.addHook('onRoute', (route) => {
    const handler = route.handler;
    route.handler = async function (request, reply) {
      const entry = moduleRequests.get(request);
      if (entry) entry.executing = true;
      try {
        return await handler.call(this, request, reply);
      } finally {
        if (entry) {
          entry.executing = false;
          // A disconnected caller cannot release a still-running feature mutation early.
          if (entry.finished) entry.release?.();
        }
      }
    };
  });

  function acceptAdultSession(
    request: FastifyRequest,
    auth: CompanionAuthRepository,
    token: string,
  ) {
    try {
      browserRequests.get(request)!.assertAllowed();
    } catch (error) {
      auth.invalidateBrowserSession(token);
      throw error;
    }
  }

  server.get('/api/v1/runtime', async (request, reply) => {
    if (runtime.mode === 'private') browserAccess.establish(request.headers, reply, true);
    const context = RuntimeContextSchema.parse({
      ...(await resolveRuntimeContext(runtime, adminRepository)),
      sharedScreen: isSharedScreenRequest(request.headers),
    });
    reply
      .header('Cache-Control', 'private, no-store')
      .header('Vary', 'Cookie, Authorization, User-Agent');
    if (runtime.mode !== 'private' || context.household === null) return context;

    const authorized = await hasPrivateHouseholdReadAccess(
      request.headers,
      context.household.id,
      options,
      adminRepository,
    );
    return RuntimeContextSchema.parse(
      authorized ? context : { ...context, household: null, requiresSetup: false },
    );
  });

  server.get('/api/v1/auth/status', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const sharedScreen = isSharedScreenRequest(request.headers);
    if (options.companionAuth === undefined) {
      return PasskeyAuthStatusSchema.parse({
        mode: runtime.mode,
        sharedScreen,
        configured: false,
        secureOrigin: false,
        requiresSetup: runtime.mode === 'private',
        authenticated: false,
        actor: null,
      });
    }
    const status = options.companionAuth.status(
      sharedScreen ? null : optionalCompanionCredential(request.headers),
    );
    return PasskeyAuthStatusSchema.parse({
      ...status,
      ...(options.phoneConnections ? { accessMethod: 'phone' } : {}),
      sharedScreen,
      ...(sharedScreen ? { authenticated: false, actor: null } : {}),
    });
  });

  const phoneService = () => {
    if (!options.phoneConnections)
      throw new RepositoryError('INTEGRATION_UNAVAILABLE', 'Phone connections are not configured.');
    return options.phoneConnections;
  };
  const pendingProof = (request: FastifyRequest): string | null => {
    if (typeof request.headers.cookie !== 'string') return null;
    const value = request.headers.cookie
      .split(';')
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${PHONE_PENDING_COOKIE}=`))
      ?.slice(PHONE_PENDING_COOKIE.length + 1);
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  };
  const phoneParams = z.object({ householdId: OpaqueIdSchema, id: OpaqueIdSchema });
  server.post('/api/v1/auth/phones/owner-claims', async (request, reply) => {
    const body = parse(OwnerPhoneClaimSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const result = await phoneService().ownerClaim(
        body,
        request.ip,
        browserRequests.get(request)!.assertAllowed,
      );
      acceptAdultSession(request, companionAuth(options), result.token);
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', phoneService().cookie(result.token));
      return PasskeySessionSchema.parse(result.session);
    });
  });
  server.post('/api/v1/auth/phones/invitation-claims', async (request, reply) => {
    const body = parse(PhoneInvitationClaimSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      if (options.companionAuth?.status(optionalCompanionCredential(request.headers)).authenticated)
        throw new RepositoryError(
          'CONFLICT',
          'This phone is already connected. Remove its connection before changing accounts.',
        );
      browserRequests.get(request)!.assertAllowed();
      const result = phoneService().claimInvitation(
        'code' in body ? body.code : body.invitationSecret,
        body.phoneName,
        request.ip,
        pendingProof(request),
        'code' in body,
      );
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', phoneService().cookie(result.pendingToken, true));
      return PhoneInvitationStateSchema.parse(result.state);
    });
  });
  server.post('/api/v1/auth/phones/recovery-claims', async (request, reply) => {
    const body = parse(PhoneRecoveryClaimSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const access = browserRequests.get(request)!;
      const current = optionalCompanionCredential(request.headers);
      const result = phoneService().recoverWithCard(
        body,
        request.ip,
        access.id,
        access.assertAllowed,
        options.companionAuth?.status(current).authenticated ? current : null,
      );
      acceptAdultSession(request, companionAuth(options), result.token);
      const correlation = reply.getHeader('Set-Cookie');
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', [
          ...(typeof correlation === 'string' ? [correlation] : []),
          phoneService().cookie(result.token),
        ]);
      return PasskeySessionSchema.parse(result.session);
    });
  });
  server.get('/api/v1/auth/phones/pending', async (request, reply) =>
    run(reply, async () => {
      reply.header('Cache-Control', 'no-store');
      return PhonePendingSchema.parse(phoneService().pending(pendingProof(request)));
    }),
  );
  server.post('/api/v1/auth/phones/exchanges', async (request, reply) =>
    run(reply, async () => {
      const result = phoneService().exchange(
        pendingProof(request),
        browserRequests.get(request)!.assertAllowed,
      );
      acceptAdultSession(request, companionAuth(options), result.token);
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', phoneService().cookie(result.token));
      return PasskeySessionSchema.parse(result.session);
    }),
  );
  server.post('/api/v1/auth/phones/confirmations', async (request, reply) =>
    run(reply, async () => {
      reply.header('Cache-Control', 'no-store');
      return PhoneConfirmationSchema.parse(
        phoneService().confirm(companionCredential(request.headers)),
      );
    }),
  );
  server.get('/api/v1/households/:householdId/phone-connections', async (request, reply) =>
    run(reply, async () => {
      const params = HouseholdParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return PhoneConnectionsSchema.parse(
        phoneService().list(params.householdId, companionCredential(request.headers)),
      );
    }),
  );
  server.post('/api/v1/households/:householdId/phone-invitations', async (request, reply) => {
    const body = parse(PhoneInvitationCreateSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      reply.header('Cache-Control', 'no-store');
      const params = HouseholdParamsSchema.parse(request.params);
      return PhoneInvitationRevealSchema.parse(
        phoneService().createInvitation(
          params.householdId,
          companionCredential(request.headers),
          body.memberId,
          body.requestId,
        ),
      );
    });
  });
  server.get('/api/v1/households/:householdId/phone-recovery', async (request, reply) =>
    run(reply, async () => {
      const params = HouseholdParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return PhoneRecoverySummarySchema.parse(
        phoneService().recoverySummary(params.householdId, companionCredential(request.headers)),
      );
    }),
  );
  server.post('/api/v1/households/:householdId/phone-recovery/policies', async (request, reply) => {
    const body = parse(PhoneRecoveryPolicyCommandSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const params = HouseholdParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return PhoneRecoveryCommandResultSchema.parse(
        phoneService().updateRecoveryPolicy(
          params.householdId,
          companionCredential(request.headers),
          body.requestId,
          body.trustedConnectionIds,
        ),
      );
    });
  });
  server.post('/api/v1/households/:householdId/phone-recovery/cards', async (request, reply) => {
    const body = parse(PhoneCommandSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const params = HouseholdParamsSchema.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return PhoneRecoveryCardRevealSchema.parse(
        phoneService().createRecoveryCard(
          params.householdId,
          companionCredential(request.headers),
          body.requestId,
        ),
      );
    });
  });
  server.post(
    '/api/v1/households/:householdId/phone-recovery/cards/:id/activations',
    async (request, reply) => {
      const body = parse(PhoneCommandSchema, request.body, reply);
      if (body === null) return reply;
      return run(reply, async () => {
        const params = phoneParams.parse(request.params);
        reply.header('Cache-Control', 'no-store');
        return PhoneRecoveryCommandResultSchema.parse(
          phoneService().activateRecoveryCard(
            params.householdId,
            companionCredential(request.headers),
            params.id,
            body.requestId,
          ),
        );
      });
    },
  );
  server.post(
    '/api/v1/households/:householdId/phone-recovery/invitations',
    async (request, reply) => {
      const body = parse(PhoneCommandSchema, request.body, reply);
      if (body === null) return reply;
      return run(reply, async () => {
        const params = HouseholdParamsSchema.parse(request.params);
        reply.header('Cache-Control', 'no-store');
        return PhoneInvitationRevealSchema.parse(
          phoneService().createOwnerRecoveryInvitation(
            params.householdId,
            companionCredential(request.headers),
            body.requestId,
          ),
        );
      });
    },
  );
  server.get('/api/v1/households/:householdId/phone-invitations/:id', async (request, reply) =>
    run(reply, async () => {
      const params = phoneParams.parse(request.params);
      reply.header('Cache-Control', 'no-store');
      return PhoneInvitationStateSchema.parse(
        phoneService().readInvitation(
          params.householdId,
          companionCredential(request.headers),
          params.id,
        ),
      );
    }),
  );
  for (const [action, cancel] of [
    ['approvals', false],
    ['cancellations', true],
  ] as const) {
    server.post(
      `/api/v1/households/:householdId/phone-invitations/:id/${action}`,
      async (request, reply) => {
        const body = parse(PhoneCommandSchema, request.body, reply);
        if (body === null) return reply;
        return run(reply, async () => {
          const params = phoneParams.parse(request.params);
          reply.header('Cache-Control', 'no-store');
          return PhoneInvitationStateSchema.parse(
            phoneService().approve(
              params.householdId,
              companionCredential(request.headers),
              params.id,
              body.requestId,
              cancel,
            ),
          );
        });
      },
    );
  }
  server.post(
    '/api/v1/households/:householdId/phone-connections/:id/revocations',
    async (request, reply) => {
      const body = parse(PhoneCommandSchema, request.body, reply);
      if (body === null) return reply;
      return run(reply, async () => {
        const params = phoneParams.parse(request.params);
        reply.header('Cache-Control', 'no-store');
        const result = phoneService().remove(
          params.householdId,
          companionCredential(request.headers),
          params.id,
          body.requestId,
        );
        if (result.current) reply.header('Set-Cookie', companionAuth(options).clearSessionCookie());
        return PhoneRemovalSchema.parse(result);
      });
    },
  );

  server.post('/api/v1/auth/first-use/registration-options', async (request, reply) => {
    const body = parse(FirstUsePasskeyOptionsRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const result = await companionAuth(options).firstUseRegistrationOptions(body, request.ip);
      const access = browserRequests.get(request)!;
      access.assertAllowed();
      browserAccess.bind(access.id, result.ceremonyId);
      return PasskeyCeremonyOptionsSchema.parse(result);
    });
  });

  server.post('/api/v1/auth/first-use/registration-verifications', async (request, reply) => {
    const body = parse(PasskeyCeremonyVerificationRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const auth = companionAuth(options);
      browserAccess.verify(request.headers, body.ceremonyId);
      const result = await auth.verifyFirstUseRegistration(
        body.ceremonyId,
        body.response,
        browserRequests.get(request)!.assertAllowed,
      );
      acceptAdultSession(request, auth, result.token);
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', auth.sessionCookie(result.token));
      return PasskeySessionSchema.parse(result.session);
    });
  });

  server.post('/api/v1/auth/authentication-options', async (request, reply) =>
    run(reply, async () => {
      const result = await companionAuth(options).authenticationOptions(request.ip);
      const access = browserRequests.get(request)!;
      access.assertAllowed();
      browserAccess.bind(access.id, result.ceremonyId);
      return PasskeyCeremonyOptionsSchema.parse(result);
    }),
  );

  server.post('/api/v1/auth/authentication-verifications', async (request, reply) => {
    const body = parse(PasskeyCeremonyVerificationRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const auth = companionAuth(options);
      browserAccess.verify(request.headers, body.ceremonyId);
      const result = await auth.verifyAuthentication(
        body.ceremonyId,
        body.response,
        browserRequests.get(request)!.assertAllowed,
      );
      acceptAdultSession(request, auth, result.token);
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', auth.sessionCookie(result.token));
      return PasskeySessionSchema.parse(result.session);
    });
  });

  server.get('/api/v1/auth/session', async (request, reply) =>
    run(reply, async () => {
      reply.header('Cache-Control', 'no-store');
      return PasskeySessionSchema.parse(
        companionAuth(options).session(companionCredential(request.headers)),
      );
    }),
  );

  server.post('/api/v1/auth/sign-outs', async (request, reply) => {
    return run(reply, async () => {
      const auth = companionAuth(options);
      const token = optionalCompanionCredential(request.headers);
      if (token !== null) auth.signOut(token);
      reply.header('Cache-Control', 'no-store').header('Set-Cookie', auth.clearSessionCookie());
      return PasskeySignOutResultSchema.parse({ signedOut: true });
    });
  });

  server.post('/api/v1/auth/recovery/registration-options', async (request, reply) => {
    const body = parse(RecoveryPasskeyOptionsRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const result = await companionAuth(options).recoveryRegistrationOptions(body, request.ip);
      const access = browserRequests.get(request)!;
      access.assertAllowed();
      browserAccess.bind(access.id, result.ceremonyId);
      return PasskeyCeremonyOptionsSchema.parse(result);
    });
  });

  server.post('/api/v1/auth/recovery/registration-verifications', async (request, reply) => {
    const body = parse(PasskeyCeremonyVerificationRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () => {
      const auth = companionAuth(options);
      browserAccess.verify(request.headers, body.ceremonyId);
      const result = await auth.verifyRecoveryRegistration(
        body.ceremonyId,
        body.response,
        browserRequests.get(request)!.assertAllowed,
      );
      acceptAdultSession(request, auth, result.token);
      reply
        .header('Cache-Control', 'no-store')
        .header('Set-Cookie', auth.sessionCookie(result.token));
      return PasskeySessionSchema.parse(result.session);
    });
  });

  server.get('/api/v1/health', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return {
      status: 'ok',
      database: options.adminRepository === undefined ? 'in-memory-test' : 'sqlite-ready',
      mode: runtime.mode,
      version: releaseVersion,
      now: runtime.clock.now().toISOString(),
    };
  });

  server.get('/api/v1/readiness', async (_request, reply) => {
    try {
      await options.readiness?.();
      return { status: 'ready', database: 'ready', mode: runtime.mode };
    } catch {
      return reply.status(503).send({
        status: 'not-ready',
        database: 'unavailable',
        mode: runtime.mode,
      });
    }
  });

  server.get('/api/v1/households/:householdId/admin', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      const overview = await adminRepository.getOverview(
        params.householdId,
        actorId(request.headers, options),
      );
      const enabled = modules.get(params.householdId).enabled;
      return AdminOverviewSchema.parse({
        ...overview,
        integrations: overview.integrations.filter(
          (item) => enabled[item.kind === 'calendar' ? 'calendar' : 'home'],
        ),
      });
    });
  });

  server.get('/api/v1/households/:householdId/modules', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      await adminRepository.getHousehold(params.householdId);
      return ModulesConfigurationSchema.parse(modules.get(params.householdId));
    });
  });
  server.put('/api/v1/households/:householdId/modules/:moduleId', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(
      HouseholdParamsSchema.extend({ moduleId: ModuleIdSchema }),
      request.params,
      reply,
    );
    const body = parse(UpdateModuleRequestSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const result = modules.update(params.householdId, params.moduleId, body, actor);
      homeAssistantBridge.cancelDisabledCommands(params.householdId);
      if (!result.replayed)
        realtime.publish(params.householdId, 'modules.changed', result.audit.targetId);
      return ModuleCommandResultSchema.parse(result);
    });
  });
  server.put('/api/v1/home-assistant/modules/:moduleId', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(z.object({ moduleId: ModuleIdSchema }), request.params, reply);
    const body = parse(UpdateModuleRequestSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const secret = automationSecret(request);
      const row = homeAssistantBridge.authenticate(secret);
      const result = homeAssistantBridge.setModule(secret, params.moduleId, body);
      if (!result.replayed)
        realtime.publish(row.householdId, 'modules.changed', result.audit.targetId);
      return ModuleCommandResultSchema.parse(result);
    });
  });

  server.get('/api/v1/households/:householdId/activity', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(ActivityQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () =>
      ActivityFeedSchema.parse({
        entries: await adminRepository.getActivity(
          params.householdId,
          actorId(request.headers, options),
          query.limit,
        ),
        generatedAt: runtime.clock.now().toISOString(),
        localOnly: true,
      }),
    );
  });

  server.get('/api/v1/households/:householdId/system-status', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      SystemStatusSchema.parse(
        await systemOperations.getStatus(params.householdId, actorId(request.headers, options)),
      ),
    );
  });

  server.post('/api/v1/households/:householdId/system-backups', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CommandRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () =>
      SystemBackupCommandResultSchema.parse(
        await systemOperations.createBackup(
          params.householdId,
          actorId(request.headers, options),
          body.requestId,
        ),
      ),
    );
  });

  server.get('/api/v1/households/:householdId/appliance-update', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      ApplianceUpdateStatusSchema.parse(
        await applianceUpdate.getStatus(params.householdId, actorId(request.headers, options)),
      ),
    );
  });

  server.post('/api/v1/households/:householdId/appliance-updates', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(InstallApplianceUpdateRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      assertRecentUpdateConfirmation(request.headers, options);
      return ApplianceUpdateCommandResultSchema.parse(
        await applianceUpdate.install(params.householdId, actorId(request.headers, options), body),
      );
    });
  });

  server.get('/api/v1/households/:householdId/today-configuration', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      await adminRepository.getOverview(params.householdId, actorId(request.headers, options));
      return TodayConfigurationSchema.parse(
        await todayContentRepository.getConfiguration(
          params.householdId,
          modules.get(params.householdId).enabled.notices,
        ),
      );
    });
  });

  server.put('/api/v1/households/:householdId/today-sections', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpdateTodaySectionsRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const saved = await todayContentRepository.getConfiguration(params.householdId, false);
      const sectionModules = {
        dinner: 'meals',
        listSummary: 'lists',
        notice: 'notices',
        photo: 'photos',
        dailyVerse: 'dailyVerse',
        reminders: 'reminders',
      } as const;
      for (const key of Object.keys(sectionModules) as Array<keyof typeof sectionModules>) {
        if (body[key] !== saved.sections[key])
          modules.assertEnabled(params.householdId, sectionModules[key]);
      }
      const result = TodayConfigurationCommandResultSchema.parse(
        await todayContentRepository.updateSections(
          params.householdId,
          body,
          actor,
          modules.get(params.householdId).enabled.notices,
        ),
      );
      realtime.publish(params.householdId, 'today.changed', params.householdId);
      return modules.get(params.householdId).enabled.notices
        ? result
        : {
            ...result,
            configuration: { ...result.configuration, notices: [], activeNoticeId: null },
          };
    });
  });

  server.post('/api/v1/households/:householdId/notices', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateHouseholdNoticeRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const result = TodayConfigurationCommandResultSchema.parse(
        await todayContentRepository.createNotice(params.householdId, body, actor),
      );
      realtime.publish(params.householdId, 'today.changed', result.audit.targetId);
      return result;
    });
  });

  server.patch('/api/v1/households/:householdId/notices/:noticeId', async (request, reply) => {
    const params = parse(NoticeParamsSchema, request.params, reply);
    const body = parse(UpdateHouseholdNoticeRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const result = TodayConfigurationCommandResultSchema.parse(
        await todayContentRepository.updateNotice(params.householdId, params.noticeId, body, actor),
      );
      realtime.publish(params.householdId, 'today.changed', params.noticeId);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/notices/:noticeId/archives',
    async (request, reply) => {
      const params = parse(NoticeParamsSchema, request.params, reply);
      const body = parse(ArchiveHouseholdNoticeRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const actor = commandActor(request.headers, options, adminRepository);
        await adminRepository.getOverview(params.householdId, actor.id);
        const result = TodayConfigurationCommandResultSchema.parse(
          await todayContentRepository.archiveNotice(
            params.householdId,
            params.noticeId,
            body.requestId,
            actor,
          ),
        );
        realtime.publish(params.householdId, 'today.changed', params.noticeId);
        return result;
      });
    },
  );

  server.get('/api/v1/households/:householdId/calendar-connection', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      const connection = await calendarConnectionRepository.get(
        params.householdId,
        actorId(request.headers, options),
      );
      return connection === null ? null : CalendarConnectionSettingsSchema.parse(connection);
    });
  });

  server.post(
    '/api/v1/households/:householdId/calendar-connection-selection-tests',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      if (params === null) return reply;
      return run(reply, async () =>
        CalendarConnectionTestResultSchema.parse(
          await calendarConnectionRepository.refreshSelection(
            params.householdId,
            actorId(request.headers, options),
          ),
        ),
      );
    },
  );

  server.post(
    '/api/v1/households/:householdId/calendar-connection-tests',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(CalendarConnectionTestRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        CalendarConnectionTestResultSchema.parse(
          await calendarConnectionRepository.test(
            params.householdId,
            actorId(request.headers, options),
            body,
          ),
        ),
      );
    },
  );

  server.put('/api/v1/households/:householdId/calendar-connection', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(SaveCalendarConnectionRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = CalendarConnectionCommandResultSchema.parse(
        await calendarConnectionRepository.save(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'calendar.changed', result.audit.targetId);
      return result;
    });
  });

  server.patch(
    '/api/v1/households/:householdId/calendar-connection/mappings',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(UpdateCalendarMappingsRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = CalendarConnectionCommandResultSchema.parse(
          await calendarConnectionRepository.updateMappings(
            params.householdId,
            actorId(request.headers, options),
            body,
          ),
        );
        realtime.publish(params.householdId, 'calendar.changed', result.audit.targetId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/calendar-connection/removals',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(RemoveCalendarConnectionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = CalendarConnectionCommandResultSchema.parse(
          await calendarConnectionRepository.remove(
            params.householdId,
            actorId(request.headers, options),
            body.requestId,
          ),
        );
        realtime.publish(params.householdId, 'calendar.changed', result.audit.targetId);
        return result;
      });
    },
  );

  server.get(
    '/api/v1/households/:householdId/home-assistant-connection',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      if (params === null) return reply;
      return run(reply, async () => {
        const connection = await homeAssistantConnectionRepository.get(
          params.householdId,
          actorId(request.headers, options),
        );
        return connection === null ? null : HomeAssistantConnectionSettingsSchema.parse(connection);
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/home-assistant-connection-tests',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(HomeAssistantConnectionTestRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        HomeAssistantConnectionTestResultSchema.parse(
          await homeAssistantConnectionRepository.test(
            params.householdId,
            actorId(request.headers, options),
            body,
          ),
        ),
      );
    },
  );

  server.put(
    '/api/v1/households/:householdId/home-assistant-connection',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(SaveHomeAssistantConnectionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = HomeAssistantConnectionCommandResultSchema.parse(
          await homeAssistantConnectionRepository.save(
            params.householdId,
            actorId(request.headers, options),
            body,
          ),
        );
        realtime.publish(params.householdId, 'home.changed', result.audit.targetId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/home-assistant-connection/removals',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(RemoveHomeAssistantConnectionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = HomeAssistantConnectionCommandResultSchema.parse(
          await homeAssistantConnectionRepository.remove(
            params.householdId,
            actorId(request.headers, options),
            body.requestId,
          ),
        );
        realtime.publish(params.householdId, 'home.changed', result.audit.targetId);
        return result;
      });
    },
  );

  server.patch('/api/v1/households/:householdId/settings', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpdateHouseholdRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const overview = AdminOverviewSchema.parse(
        await adminRepository.updateHousehold(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'household.changed', params.householdId);
      const enabled = modules.get(params.householdId).enabled;
      return {
        ...overview,
        integrations: overview.integrations.filter(
          (item) => enabled[item.kind === 'calendar' ? 'calendar' : 'home'],
        ),
      };
    });
  });

  server.get('/api/v1/households/:householdId/weather-location', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      const location = await weatherLocationRepository.get(
        params.householdId,
        actorId(request.headers, options),
      );
      return location === null ? null : WeatherLocationSchema.parse(location);
    });
  });

  server.post(
    '/api/v1/households/:householdId/weather-location-searches',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(WeatherLocationSearchRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        WeatherLocationSearchResultsSchema.parse(
          await weatherLocationRepository.search(
            params.householdId,
            actorId(request.headers, options),
            body.query,
          ),
        ),
      );
    },
  );

  server.post('/api/v1/households/:householdId/weather-location-tests', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(WeatherLocationTestRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () =>
      WeatherLocationTestResultSchema.parse(
        await weatherLocationRepository.test(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      ),
    );
  });

  server.put('/api/v1/households/:householdId/weather-location', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(SaveWeatherLocationRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = WeatherLocationCommandResultSchema.parse(
        await weatherLocationRepository.save(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'weather.changed', result.audit.targetId);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/adult-access', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      AdultAccessSummarySchema.parse(
        companionAuth(options).adultAccess(
          params.householdId,
          companionActor(request.headers, options),
        ),
      ),
    );
  });

  server.post(
    '/api/v1/households/:householdId/adult-access/passkey-registration-options',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(AdditionalPasskeyOptionsRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        PasskeyCeremonyOptionsSchema.parse(
          await companionAuth(options).additionalRegistrationOptions(
            params.householdId,
            companionActor(request.headers, options),
            body,
          ),
        ),
      );
    },
  );

  server.post(
    '/api/v1/households/:householdId/adult-access/passkey-registration-verifications',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(PasskeyCeremonyVerificationRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const auth = companionAuth(options);
        const result = await auth.verifyAdditionalRegistration(
          params.householdId,
          companionActor(request.headers, options),
          body.ceremonyId,
          body.response,
        );
        if (result.signedInToken !== undefined) {
          reply.header('Set-Cookie', auth.sessionCookie(result.signedInToken));
        }
        return PasskeyRegistrationResultSchema.parse(result);
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/adult-access/recovery-confirmation-options',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      if (params === null) return reply;
      return run(reply, async () =>
        PasskeyCeremonyOptionsSchema.parse(
          await companionAuth(options).recoveryConfirmationOptions(
            params.householdId,
            companionActor(request.headers, options),
          ),
        ),
      );
    },
  );

  server.post(
    '/api/v1/households/:householdId/adult-access/recovery-codes',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(RecoveryCodeConfirmationRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        RecoveryCodeRevealSchema.parse(
          await companionAuth(options).createRecoveryCode(
            params.householdId,
            companionActor(request.headers, options),
            body.ceremonyId,
            body.response,
          ),
        ),
      );
    },
  );

  server.post(
    '/api/v1/households/:householdId/adult-access/passkeys/:passkeyId/revocations',
    async (request, reply) => {
      const params = parse(PasskeyParamsSchema, request.params, reply);
      const body = parse(RevokePasskeyRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        PasskeyRevocationResultSchema.parse(
          companionAuth(options).revokePasskey(
            params.householdId,
            params.passkeyId,
            companionActor(request.headers, options),
            body.requestId,
          ),
        ),
      );
    },
  );

  server.post('/api/v1/households/:householdId/members', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateMemberRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const member = MemberSchema.parse(
        await adminRepository.createMember(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'household.changed', member.id);
      return member;
    });
  });

  server.patch('/api/v1/households/:householdId/members/:memberId', async (request, reply) => {
    const params = parse(MemberParamsSchema, request.params, reply);
    const body = parse(UpdateMemberRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const member = MemberSchema.parse(
        await adminRepository.updateMember(
          params.householdId,
          params.memberId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'household.changed', member.id);
      return member;
    });
  });

  server.get('/api/v1/households/:householdId/members/:memberId/avatar', async (request, reply) => {
    const params = parse(MemberParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      const asset = await adminRepository.getMemberAvatar(params.householdId, params.memberId);
      return reply
        .header('Cache-Control', 'private, no-store')
        .header('Content-Length', String(asset.bytes.byteLength))
        .header('X-Content-Type-Options', 'nosniff')
        .type(asset.mimeType)
        .send(Buffer.from(asset.bytes));
    });
  });

  server.put('/api/v1/households/:householdId/members/:memberId/avatar', async (request, reply) => {
    const params = parse(MemberParamsSchema, request.params, reply);
    const body = parse(UpdateMemberAvatarRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = MemberAvatarCommandResultSchema.parse(
        await adminRepository.updateMemberAvatar(
          params.householdId,
          params.memberId,
          actorId(request.headers, options),
          body,
        ),
      );
      realtime.publish(params.householdId, 'household.changed', result.member.id);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/members/:memberId/avatar-resets',
    async (request, reply) => {
      const params = parse(MemberParamsSchema, request.params, reply);
      const body = parse(ResetMemberAvatarRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = MemberAvatarCommandResultSchema.parse(
          await adminRepository.resetMemberAvatar(
            params.householdId,
            params.memberId,
            actorId(request.headers, options),
            body.requestId,
          ),
        );
        realtime.publish(params.householdId, 'household.changed', result.member.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/members/:memberId/archives',
    async (request, reply) => {
      const params = parse(MemberParamsSchema, request.params, reply);
      const body = parse(ArchiveMemberRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const member = MemberSchema.parse(
          await adminRepository.archiveMember(
            params.householdId,
            params.memberId,
            actorId(request.headers, options),
            body.requestId,
          ),
        );
        realtime.publish(params.householdId, 'household.changed', member.id);
        return member;
      });
    },
  );

  server.post('/api/v1/device-pairing-requests', async (request, reply) => {
    const body = parse(CreatePairingRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () =>
      PairingRequestSchema.parse(
        await adminRepository.createPairing(
          body.deviceName,
          body.requestId,
          undefined,
          undefined,
          request.ip,
        ),
      ),
    );
  });

  server.post('/api/v1/tv-pairing-sessions', async (request, reply) => {
    const body = parse(CreateTvPairingSessionRequestSchema, request.body, reply);
    if (body === null) return reply;
    return run(reply, async () =>
      TvPairingSessionSchema.parse({
        pairing: await adminRepository.createPairing(
          body.deviceName,
          body.requestId,
          credentialHash(body.pairingSecret),
          body.applicationVersion,
          request.ip,
        ),
      }),
    );
  });

  server.get('/api/v1/device-pairing-requests/:pairingId', async (request, reply) => {
    const params = parse(PairingParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      PairingRequestSchema.parse(await adminRepository.getPairing(params.pairingId)),
    );
  });

  server.post(
    '/api/v1/tv-pairing-sessions/:pairingId/credential-exchanges',
    async (request, reply) => {
      const params = parse(PairingParamsSchema, request.params, reply);
      const body = parse(ExchangeTvPairingRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const previousAdult = optionalCompanionCredential(request.headers);
        if (previousAdult !== null && options.companionAuth?.status(previousAdult).ownerPhone)
          throw new RepositoryError(
            'FORBIDDEN',
            'The owner phone cannot become a shared screen. Use a different browser for the screen.',
          );
        const session = TvDeviceSessionSchema.parse(
          await adminRepository.exchangeTvPairing(
            params.pairingId,
            body.pairingSecret,
            body.requestId,
          ),
        );
        browserAccess.pair(request.headers);
        if (previousAdult !== null) options.companionAuth?.invalidateBrowserSession(previousAdult);
        reply
          .header('Cache-Control', 'no-store')
          .header(
            'Set-Cookie',
            optionalCompanionCredential(request.headers) !== null &&
              options.companionAuth !== undefined
              ? [
                  deviceSessionCookie(body.pairingSecret, isPrivateMode(options)),
                  options.companionAuth.clearSessionCookie(),
                ]
              : deviceSessionCookie(body.pairingSecret, isPrivateMode(options)),
          );
        return session;
      });
    },
  );

  server.get('/api/v1/device-sessions/current', async (request, reply) => {
    return run(reply, async () =>
      TvDeviceSessionSchema.parse(
        await adminRepository.getTvDeviceSession(deviceCredential(request.headers)),
      ),
    );
  });

  server.post('/api/v1/home-assistant/pairing-requests', async (request, reply) => {
    const body = parse(BridgePairingStartSchema, request.body, reply);
    if (body === null) return reply;
    reply.header('Cache-Control', 'no-store');
    return run(reply, async () =>
      BridgePairingSchema.parse(homeAssistantPairings.start(body, request.ip)),
    );
  });
  server.post('/api/v1/home-assistant/pairing-requests/:id/exchanges', async (request, reply) => {
    const params = parse(z.object({ id: OpaqueIdSchema }), request.params, reply);
    const body = parse(BridgePairingExchangeSchema, request.body, reply);
    if (params === null || body === null) return reply;
    reply.header('Cache-Control', 'no-store');
    return run(reply, async () =>
      BridgePairingExchangeResultSchema.parse(
        await homeAssistantPairings.exchange(params.id, body.secret, request.ip),
      ),
    );
  });
  server.post(
    '/api/v1/households/:householdId/home-assistant-bridge/pairing-approvals',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(BridgePairingApprovalSchema, request.body, reply);
      if (params === null || body === null) return reply;
      reply.header('Cache-Control', 'private, no-store');
      return run(reply, async () => {
        const memberId = actorId(request.headers, options);
        assertControllerRequest(request.headers);
        options.phoneConnections?.assertOrigin(
          request.headers.origin,
          request.headers['sec-fetch-site'],
        );
        const reference = options.phoneConnections
          ? options.phoneConnections.approvalReference(
              params.householdId,
              companionCredential(request.headers),
            )
          : isPrivateMode(options)
            ? (() => {
                throw new RepositoryError('FORBIDDEN', 'Connect an adult phone first.');
              })()
            : {
                householdId: params.householdId,
                memberId,
                connectionId: 'demo',
                sessionHash: 'demo',
              };
        return BridgePairingApprovalResultSchema.parse(
          await homeAssistantPairings.approve(body, reference, request.ip),
        );
      });
    },
  );
  server.get('/api/v1/households/:householdId/home-assistant-bridge', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () =>
      BridgeConnectionSchema.nullable().parse(
        await homeAssistantBridge.get(params.householdId, actorId(request.headers, options)),
      ),
    );
  });
  server.post('/api/v1/households/:householdId/home-assistant-bridge', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(BridgeGrantRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () => {
      options.phoneConnections?.assertOrigin(
        request.headers.origin,
        request.headers['sec-fetch-site'],
      );
      return BridgeGrantResultSchema.parse(
        await homeAssistantBridge.grant(
          params.householdId,
          actorId(request.headers, options),
          body,
        ),
      );
    });
  });
  server.post(
    '/api/v1/households/:householdId/home-assistant-bridge/revocations',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema.strict(), request.body, reply);
      if (params === null || body === null) return reply;
      reply.header('Cache-Control', 'private, no-store');
      return run(reply, async () => {
        options.phoneConnections?.assertOrigin(
          request.headers.origin,
          request.headers['sec-fetch-site'],
        );
        const result = await homeAssistantBridge.revoke(
          params.householdId,
          actorId(request.headers, options),
          body.requestId,
          () => homeAssistantPairings.cancelForHousehold(params.householdId),
        );
        return result;
      });
    },
  );
  server.post('/api/v1/device-sessions/current/presentation', async (request, reply) => {
    const body = parse(ScreenPresentationRequestSchema, request.body, reply);
    if (body === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () =>
      ScreenPresentationResultSchema.parse(
        homeAssistantBridge.presentation(
          adminRepository.getTvDeviceSession(deviceCredential(request.headers)),
          body,
        ),
      ),
    );
  });
  server.get('/api/v1/home-assistant/state', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () => homeAssistantBridge.state(automationSecret(request)));
  });
  server.get('/api/v1/home-assistant/calendar', async (request, reply) => {
    const query = parse(BridgeCalendarQuerySchema, request.query, reply);
    if (query === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () =>
      homeAssistantBridge.calendar(automationSecret(request), query.start, query.end),
    );
  });
  server.post('/api/v1/home-assistant/chores/:occurrenceId/completion', async (request, reply) => {
    const params = parse(
      z.object({ occurrenceId: OpaqueIdSchema }).strict(),
      request.params,
      reply,
    );
    const body = parse(BridgeChoreCompletionRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () => {
      const secret = automationSecret(request);
      const householdId = homeAssistantBridge.authenticate(secret).householdId;
      const result = await homeAssistantBridge.setChoreCompletion(
        secret,
        params.occurrenceId,
        body,
      );
      realtime.publish(householdId, 'chore.changed', params.occurrenceId);
      realtime.publish(householdId, 'pocket-money.changed', params.occurrenceId);
      return result;
    });
  });
  server.post('/api/v1/home-assistant/screens/:deviceId/navigation', async (request, reply) => {
    const params = parse(z.object({ deviceId: OpaqueIdSchema }), request.params, reply);
    const body = parse(ScreenNavigationRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    reply.header('Cache-Control', 'private, no-store');
    return run(reply, async () =>
      ScreenNavigationResultSchema.parse(
        await homeAssistantBridge.navigate(
          automationSecret(request),
          params.deviceId,
          body.requestId,
          body.tab,
        ),
      ),
    );
  });

  server.get('/api/v1/households/:householdId/games/word-groups', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    return run(reply, async () => {
      await adminRepository.getHousehold(params.householdId);
      return GameCatalogueSchema.parse(await gamesArchive.catalogue());
    });
  });

  server.get(
    '/api/v1/households/:householdId/games/word-groups/:puzzleId',
    async (request, reply) => {
      const params = parse(
        HouseholdParamsSchema.extend({ puzzleId: OpaqueIdSchema }),
        request.params,
        reply,
      );
      if (params === null) return reply;
      reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
      return run(reply, async () => {
        await adminRepository.getHousehold(params.householdId);
        return WordGroupsPuzzleSchema.parse(await gamesArchive.puzzle(params.puzzleId));
      });
    },
  );

  server.get('/api/v1/households/:householdId/reminders', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(ReminderQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () =>
      ReminderOverviewSchema.parse(
        await reminderRepository.getOverview(params.householdId, query.includeCompleted),
      ),
    );
  });

  server.post('/api/v1/households/:householdId/reminders', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateReminderRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ReminderCommandResultSchema.parse(
        await reminderRepository.create(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'reminders.changed', result.reminder.id);
      return result;
    });
  });

  server.put('/api/v1/households/:householdId/reminders/:reminderId', async (request, reply) => {
    const params = parse(ReminderParamsSchema, request.params, reply);
    const body = parse(UpdateReminderRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ReminderCommandResultSchema.parse(
        await reminderRepository.update(
          params.householdId,
          params.reminderId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'reminders.changed', result.reminder.id);
      return result;
    });
  });

  server.put(
    '/api/v1/households/:householdId/reminders/:reminderId/completion',
    async (request, reply) => {
      const params = parse(ReminderParamsSchema, request.params, reply);
      const body = parse(SetReminderCompletionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ReminderCommandResultSchema.parse(
          await reminderRepository.setCompletion(
            params.householdId,
            params.reminderId,
            body,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'reminders.changed', result.reminder.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/reminders/:reminderId/deletions',
    async (request, reply) => {
      const params = parse(ReminderParamsSchema, request.params, reply);
      const body = parse(DeleteReminderRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ReminderDeletionResultSchema.parse(
          await reminderRepository.delete(
            params.householdId,
            params.reminderId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'reminders.changed', result.reminderId);
        return result;
      });
    },
  );

  server.post('/api/v1/households/:householdId/pairing-approvals', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(ApprovePairingRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () =>
      PairedDeviceSchema.parse(
        await adminRepository.approvePairing(
          params.householdId,
          actorId(request.headers, options),
          body.code,
          body.requestId,
        ),
      ),
    );
  });

  server.post(
    '/api/v1/households/:householdId/paired-devices/:deviceId/revocations',
    async (request, reply) => {
      const params = parse(DeviceParamsSchema, request.params, reply);
      const body = parse(RevokeDeviceRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () =>
        PairedDeviceSchema.parse(
          await adminRepository.revokeDevice(
            params.householdId,
            params.deviceId,
            actorId(request.headers, options),
            body.requestId,
          ),
        ),
      );
    },
  );

  server.get('/api/v1/households/:householdId/today', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(TodayQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () => readToday(params.householdId, query.date));
  });

  server.get('/api/v1/households/:householdId/daily-verse', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      const household = await adminRepository.getHousehold(params.householdId);
      const date = localDateInTimezone(runtime.clock.now().toISOString(), household.timezone);
      return DailyVerseSummarySchema.nullable().parse(verseCache.read(params.householdId, date));
    });
  });

  server.get('/api/v1/households/:householdId/indoor-climate', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(
      z.object({ period: IndoorPeriodSchema.default('day') }).strict(),
      request.query,
      reply,
    );
    if (!params || !query) return reply;
    return run(reply, async () => {
      const home = await adminRepository.getHousehold(params.householdId);
      return IndoorClimateSchema.parse(
        await indoorClimate.read(params.householdId, home.timezone, query.period),
      );
    });
  });
  server.get('/api/v1/households/:householdId/indoor-climate-settings', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      await adminRepository.getOverview(params.householdId, actorId(request.headers, options));
      return IndoorSettingsSchema.parse(indoorClimate.settings(params.householdId));
    });
  });
  server.post(
    '/api/v1/households/:householdId/indoor-climate-settings/tests',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(IndoorTestSchema, request.body, reply);
      if (!params || !body) return reply;
      return run(reply, async () =>
        IndoorDiscoverySchema.parse(
          await indoorClimate.discover(params.householdId, actorId(request.headers, options), body),
        ),
      );
    },
  );
  server.post(
    '/api/v1/households/:householdId/indoor-climate-settings/discoveries',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(z.object({}).strict(), request.body, reply);
      if (!params || !body) return reply;
      return run(reply, async () =>
        IndoorDiscoverySchema.parse(
          await indoorClimate.discover(params.householdId, actorId(request.headers, options)),
        ),
      );
    },
  );
  server.put('/api/v1/households/:householdId/indoor-climate-settings', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(SaveIndoorSettingsSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const result = IndoorSettingsResultSchema.parse(
        await indoorClimate.save(
          params.householdId,
          actorId(request.headers, options),
          body,
          () => {
            actorId(request.headers, options);
          },
        ),
      );
      realtime.publish(params.householdId, 'weather.changed', params.householdId);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/weather', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      const [forecast, location] = await Promise.all([
        repository.getWeather(params.householdId),
        Promise.resolve(weatherLocationRepository.getDisplayLabel(params.householdId)),
      ]);
      return WeatherForecastSchema.parse({
        ...forecast,
        locationLabel: location ?? forecast.locationLabel,
      });
    });
  });

  const fitnessExerciseParams = HouseholdParamsSchema.extend({ exerciseId: OpaqueIdSchema });
  const fitnessAssetParams = HouseholdParamsSchema.extend({ assetId: OpaqueIdSchema });
  const libraryResult = (home: string, result: unknown) => {
    const parsed = FitnessLibraryResultSchema.parse(result);
    if (!parsed.replayed) realtime.publish(home, 'fitness.changed', home);
    return parsed;
  };
  server.get('/api/v1/households/:householdId/fitness/exercises', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      await adminRepository.getHousehold(params.householdId);
      return FitnessLibrarySchema.parse({ exercises: fitnessLibrary.list(params.householdId) });
    });
  });
  server.put(
    '/api/v1/households/:householdId/fitness/exercises/:exerciseId',
    async (request, reply) => {
      reply.header('Cache-Control', 'private, no-store');
      const params = parse(fitnessExerciseParams, request.params, reply);
      const body = parse(SaveFitnessLibraryExerciseSchema, request.body, reply);
      if (!params || !body) return reply;
      return run(reply, async () => {
        const actor = commandActor(request.headers, options, adminRepository);
        const home = (
          await adminRepository.getOverview(params.householdId, actorId(request.headers, options))
        ).household;
        return libraryResult(
          home.id,
          fitnessLibrary.change(home, params.exerciseId, body, actor, 'save'),
        );
      });
    },
  );
  for (const action of ['remove-video', 'archive'] as const)
    server.post(
      `/api/v1/households/:householdId/fitness/exercises/:exerciseId/${action}`,
      async (request, reply) => {
        reply.header('Cache-Control', 'private, no-store');
        const params = parse(fitnessExerciseParams, request.params, reply);
        const body = parse(FitnessLibraryCommandSchema, request.body, reply);
        if (!params || !body) return reply;
        return run(reply, async () => {
          const actor = commandActor(request.headers, options, adminRepository);
          const home = (
            await adminRepository.getOverview(params.householdId, actorId(request.headers, options))
          ).household;
          return libraryResult(
            home.id,
            fitnessLibrary.change(home, params.exerciseId, body, actor, action),
          );
        });
      },
    );
  let fitnessUploads = 0;
  server.put(
    '/api/v1/households/:householdId/fitness/exercises/:exerciseId/demonstration',
    {
      bodyLimit: MAX_FITNESS_CLIP_BYTES,
      onRequest: async (request, reply) => {
        const params = parse(fitnessExerciseParams, request.params, reply);
        if (!params) return reply;
        await run(reply, async () => {
          assertControllerRequest(request.headers);
          const actor = commandActor(request.headers, options, adminRepository);
          if (actor.type !== 'member' || actor.source !== 'companion')
            throw new RepositoryError(
              'FORBIDDEN',
              'Only an adult controller can upload demonstrations.',
            );
          await adminRepository.getOverview(params.householdId, actorId(request.headers, options));
          modules.assertEnabled(params.householdId, 'fitness');
          if (fitnessUploads >= 2)
            throw new RepositoryError(
              'COMMAND_FAILED',
              'Another demonstration is uploading. Try again shortly.',
              true,
            );
          fitnessUploads++;
          let finished = false;
          const release = () => {
            if (!finished) {
              finished = true;
              fitnessUploads--;
            }
          };
          reply.raw.once('close', release);
          reply.raw.once('finish', release);
          request.raw.once('aborted', release);
          const uploadDeadline = setTimeout(() => {
            release();
            request.raw.destroy();
          }, 120_000);
          uploadDeadline.unref();
          reply.raw.once('close', () => clearTimeout(uploadDeadline));
          reply.raw.once('finish', () => clearTimeout(uploadDeadline));
        });
        if (reply.sent) return reply;
      },
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'private, no-store');
      const params = parse(fitnessExerciseParams, request.params, reply);
      const input = parse(
        FitnessLibraryCommandSchema,
        {
          requestId: request.headers['x-hearth-request-id'],
          expectedVersion: /^\d+$/.test(String(request.headers['x-hearth-exercise-version']))
            ? Number(request.headers['x-hearth-exercise-version'])
            : -1,
        },
        reply,
      );
      if (!params || !input) return reply;
      return run(reply, async () => {
        if (request.headers['content-type'] !== 'video/mp4' || !Buffer.isBuffer(request.body))
          throw new RepositoryError('VALIDATION_ERROR', 'Choose an H.264 MP4 demonstration.');
        const actor = commandActor(request.headers, options, adminRepository);
        const home = (
          await adminRepository.getOverview(params.householdId, actorId(request.headers, options))
        ).household;
        return libraryResult(
          home.id,
          fitnessLibrary.change(home, params.exerciseId, input, actor, 'upload', request.body),
        );
      });
    },
  );
  server.get(
    '/api/v1/households/:householdId/fitness/demonstrations/:assetId',
    async (request, reply) => {
      const params = parse(fitnessAssetParams, request.params, reply);
      if (!params) return reply;
      return run(reply, async () => {
        await adminRepository.getHousehold(params.householdId);
        const asset = fitnessLibrary.asset(params.householdId, params.assetId);
        const range = fitnessByteRange(request.headers.range, asset.byteLength);
        reply
          .header('Cache-Control', 'private, no-store')
          .header('Vary', 'Cookie, Authorization')
          .header('Accept-Ranges', 'bytes')
          .header('X-Content-Type-Options', 'nosniff')
          .type('video/mp4');
        if (range === 'invalid')
          return reply.code(416).header('Content-Range', `bytes */${asset.byteLength}`).send();
        const start = range?.start ?? 0,
          end = range?.end ?? asset.byteLength - 1;
        if (range)
          reply.code(206).header('Content-Range', `bytes ${start}-${end}/${asset.byteLength}`);
        reply.header('Content-Length', end - start + 1);
        // Bound stalled clients so a module-off operation cannot wait on an endless stream.
        const deadline = setTimeout(() => reply.raw.destroy(), 30_000);
        deadline.unref();
        reply.raw.once('close', () => clearTimeout(deadline));
        reply.raw.once('finish', () => clearTimeout(deadline));
        return reply.send(asset.read(start, end));
      });
    },
  );

  server.get('/api/v1/households/:householdId/fitness', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () =>
      FitnessOverviewSchema.parse(
        fitness.overview(await adminRepository.getHousehold(params.householdId)),
      ),
    );
  });
  server.get('/api/v1/households/:householdId/fitness/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      const overview = await adminRepository.getOverview(
        params.householdId,
        actorId(request.headers, options),
      );
      return FitnessSettingsSchema.parse(fitness.getSettings(overview.household));
    });
  });
  server.put('/api/v1/households/:householdId/fitness/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpdateFitnessSettingsSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const overview = await adminRepository.getOverview(
        params.householdId,
        actorId(request.headers, options),
      );
      const result = fitness.update(
        overview.household,
        body,
        commandActor(request.headers, options, adminRepository),
        (id) => fitnessLibrary.has(params.householdId, id),
      );
      if (!result.replayed)
        realtime.publish(params.householdId, 'fitness.changed', params.householdId);
      return result;
    });
  });
  server.put('/api/v1/households/:householdId/fitness/completion', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(SetFitnessCompletionSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const home = await adminRepository.getHousehold(params.householdId);
      const result = fitness.complete(
        home,
        body,
        commandActor(request.headers, options, adminRepository),
      );
      if (!result.replayed)
        realtime.publish(params.householdId, 'fitness.changed', params.householdId);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/morning-routine', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () =>
      MorningOverviewSchema.parse(
        morningRoutine.overview(await adminRepository.getHousehold(params.householdId)),
      ),
    );
  });
  server.get('/api/v1/households/:householdId/morning-routine/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      const overview = await adminRepository.getOverview(
        params.householdId,
        actorId(request.headers, options),
      );
      return MorningSettingsSchema.parse(morningRoutine.getSettings(overview.household));
    });
  });
  server.put('/api/v1/households/:householdId/morning-routine/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(MorningSettingsCommandSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const overview = await adminRepository.getOverview(
        params.householdId,
        actorId(request.headers, options),
      );
      const result = morningRoutine.update(
        overview.household,
        body,
        commandActor(request.headers, options, adminRepository),
      );
      if (!result.replayed)
        realtime.publish(params.householdId, 'morning-routine.changed', params.householdId);
      return result;
    });
  });
  server.put(
    '/api/v1/households/:householdId/morning-routine/completion',
    async (request, reply) => {
      reply.header('Cache-Control', 'private, no-store');
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(SetMorningCompletionSchema, request.body, reply);
      if (!params || !body) return reply;
      return run(reply, async () => {
        const home = await adminRepository.getHousehold(params.householdId);
        const result = morningRoutine.complete(
          home,
          body,
          commandActor(request.headers, options, adminRepository),
        );
        if (!result.replayed)
          realtime.publish(params.householdId, 'morning-routine.changed', params.householdId);
        return result;
      });
    },
  );

  server.get('/api/v1/households/:householdId/nba', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      const household = await adminRepository.getHousehold(params.householdId);
      return NbaOverviewSchema.parse(await nba.overview(params.householdId, household.timezone));
    });
  });
  server.get('/api/v1/households/:householdId/nba/games/:gameId', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(
      HouseholdParamsSchema.extend({ gameId: z.string().regex(/^\d{1,20}$/) }),
      request.params,
      reply,
    );
    if (!params) return reply;
    return run(reply, async () => {
      const household = await adminRepository.getHousehold(params.householdId);
      return nbaGames.detail(params.householdId, household.timezone, params.gameId);
    });
  });
  server.get('/api/v1/households/:householdId/nba/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (!params) return reply;
    return run(reply, async () => {
      await adminRepository.getOverview(params.householdId, actorId(request.headers, options));
      return NbaSettingsSchema.parse(nba.getSettings(params.householdId));
    });
  });
  server.get('/api/v1/households/:householdId/nba/media/:kind/:id', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store').header('Vary', 'Cookie, Authorization');
    const params = parse(
      HouseholdParamsSchema.extend({ kind: z.enum(['teams', 'players']), id: z.string() }),
      request.params,
      reply,
    );
    if (!params) return reply;
    return run(reply, async () => {
      const valid = (params.kind === 'teams' ? NbaTeamIdSchema : NbaPlayerIdSchema).safeParse(
        params.id,
      );
      if (!valid.success) throw new RepositoryError('NOT_FOUND', 'NBA image unavailable.');
      const household = await adminRepository.getHousehold(params.householdId);
      if (params.kind === 'players') {
        const overview = await nba.overview(params.householdId, household.timezone);
        if (!overview.data?.highlights.some((mark) => mark.playerId === params.id))
          throw new RepositoryError('NOT_FOUND', 'NBA image unavailable.');
      }
      const image = await nbaMedia.read(params.kind, params.id);
      if (!image) return reply.code(204).send();
      return reply.type('image/webp').header('X-Content-Type-Options', 'nosniff').send(image);
    });
  });
  server.put('/api/v1/households/:householdId/nba/settings', async (request, reply) => {
    reply.header('Cache-Control', 'private, no-store');
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpdateNbaSettingsSchema, request.body, reply);
    if (!params || !body) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const result = nba.update(params.householdId, body, actor);
      if (!result.replayed) realtime.publish(params.householdId, 'nba.changed', params.householdId);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/week', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(WeekQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () => {
      const [week, household] = await Promise.all([
        repository.getWeek(params.householdId, query.start),
        adminRepository.getHousehold(params.householdId),
      ]);
      const members = memberLookup(household.members);
      return WeekScheduleSchema.parse({
        ...week,
        days: modules.get(params.householdId).enabled.weather
          ? week.days
          : week.days.map((day) => ({ ...day, forecast: null })),
        calendars: week.calendars.map((calendar) => ({
          ...calendar,
          owner:
            calendar.owner === null ? null : (members.get(calendar.owner.id) ?? calendar.owner),
        })),
        events: week.events.map((event) => ({
          ...event,
          owner: event.owner === null ? null : (members.get(event.owner.id) ?? event.owner),
        })),
      });
    });
  });

  server.get('/api/v1/households/:householdId/month', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(MonthQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () => {
      const [month, household] = await Promise.all([
        repository.getMonth(params.householdId, query.month),
        adminRepository.getHousehold(params.householdId),
      ]);
      const members = memberLookup(household.members);
      return MonthScheduleSchema.parse({
        ...month,
        calendars: month.calendars.map((calendar) => ({
          ...calendar,
          owner:
            calendar.owner === null ? null : (members.get(calendar.owner.id) ?? calendar.owner),
        })),
        events: month.events.map((event) => ({
          ...event,
          owner: event.owner === null ? null : (members.get(event.owner.id) ?? event.owner),
        })),
      });
    });
  });

  server.get('/api/v1/households/:householdId/photos', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      PhotoGallerySchema.parse(await photoRepository.getGallery(params.householdId)),
    );
  });

  server.get('/api/v1/households/:householdId/photo-source', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () => {
      await adminRepository.getOverview(params.householdId, actorId(request.headers, options));
      return PhotoSourceIndexStatusSchema.parse(
        await photoRepository.getSourceStatus(params.householdId),
      );
    });
  });

  server.post('/api/v1/households/:householdId/photo-source/refreshes', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(RefreshPhotoSourceRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const actor = commandActor(request.headers, options, adminRepository);
      await adminRepository.getOverview(params.householdId, actor.id);
      const result = PhotoSourceRefreshResultSchema.parse(
        await photoRepository.refreshSource(params.householdId, body.requestId, actor),
      );
      realtime.publish(params.householdId, 'photos.changed', result.status.collection.id);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/photo-uploads',
    {
      bodyLimit: MAX_MANAGED_PHOTO_BYTES,
      onRequest: async (request, reply) => {
        // Reject before allocating the larger raw-image body. Global checks still run again.
        retireRetainedScreenSession(request, reply);
        const params = parse(HouseholdParamsSchema, request.params, reply);
        if (params === null) return reply;
        await run(reply, async () => {
          if (
            typeof request.headers.authorization === 'string' &&
            /^\s*HearthAutomation(?:\s|$)/i.test(request.headers.authorization)
          )
            throw new RepositoryError(
              'FORBIDDEN',
              'Home Assistant may use only its dedicated Hearth bridge endpoints.',
            );
          assertControllerRequest(request.headers);
          const actor = commandActor(request.headers, options, adminRepository);
          if (actor.type !== 'member' || actor.source !== 'companion')
            throw new RepositoryError(
              'FORBIDDEN',
              'Only an adult using the companion can add family photos.',
            );
          await adminRepository.getOverview(params.householdId, actor.id);
        });
        if (reply.sent) return reply;
      },
    },
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const headers = parse(PhotoUploadHeadersSchema, request.headers, reply);
      if (params === null || headers === null) return reply;
      const mimeType = headers['content-type'].split(';', 1)[0]!.trim().toLowerCase();
      if (!PHOTO_UPLOAD_MIME_TYPES.has(mimeType) || !Buffer.isBuffer(request.body)) {
        return reply.status(400).send(
          ApiErrorSchema.parse({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Choose a supported family photo up to 25 MB.',
              retryable: false,
              requestId: headers['x-hearth-request-id'],
            },
          }),
        );
      }
      return run(reply, async () => {
        const actor = commandActor(request.headers, options, adminRepository);
        await adminRepository.getOverview(params.householdId, actor.id);
        const result = PhotoUploadResultSchema.parse(
          await photoRepository.uploadPhoto(
            params.householdId,
            {
              bytes: request.body as Buffer,
              mimeType,
              capturedAt: headers['x-hearth-photo-captured-at'] ?? null,
            },
            headers['x-hearth-request-id'],
            actor,
          ),
        );
        realtime.publish(params.householdId, 'photos.changed', result.photo.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/photo-assets/:assetId/curation-actions',
    async (request, reply) => {
      const params = parse(PhotoCurationParamsSchema, request.params, reply);
      const body = parse(UpdatePhotoCurationRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const actor = commandActor(request.headers, options, adminRepository);
        await adminRepository.getOverview(params.householdId, actor.id);
        const result = PhotoCurationCommandResultSchema.parse(
          await photoRepository.updateCuration(
            params.householdId,
            params.assetId,
            body.action,
            body.requestId,
            actor,
          ),
        );
        realtime.publish(params.householdId, 'photos.changed', params.assetId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/photo-assets/:assetId/deletions',
    async (request, reply) => {
      const params = parse(PhotoCurationParamsSchema, request.params, reply);
      const body = parse(DeleteManagedPhotoRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const actor = commandActor(request.headers, options, adminRepository);
        await adminRepository.getOverview(params.householdId, actor.id);
        const result = PhotoDeletionCommandResultSchema.parse(
          await photoRepository.deleteManagedPhoto(
            params.householdId,
            params.assetId,
            body.requestId,
            actor,
          ),
        );
        realtime.publish(params.householdId, 'photos.changed', params.assetId);
        return result;
      });
    },
  );

  server.get(
    '/api/v1/households/:householdId/photo-assets/:assetId/:variant',
    async (request, reply) => {
      const params = parse(PhotoAssetParamsSchema, request.params, reply);
      if (params === null) return reply;
      return run(reply, async () => {
        const asset = await photoRepository.getDerivative(
          params.householdId,
          params.assetId,
          params.variant,
        );
        if (asset === null) {
          throw new RepositoryError('NOT_FOUND', 'That family photo could not be found.');
        }
        return reply
          .header('Cache-Control', 'private, no-store')
          .header('Content-Length', String(asset.bytes.byteLength))
          .header('X-Content-Type-Options', 'nosniff')
          .type(asset.mimeType)
          .send(Buffer.from(asset.bytes));
      });
    },
  );

  server.get('/api/v1/households/:householdId/chore-occurrences', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(TodayQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () => {
      const [chores, household] = await Promise.all([
        repository.getChores(params.householdId, query.date),
        adminRepository.getHousehold(params.householdId),
      ]);
      const occurrences = chores.groups.flatMap((group) => group.occurrences);
      return ChoreListSchema.parse({
        ...chores,
        groups: household.members.map((member) => ({
          member,
          occurrences: occurrences
            .filter((occurrence) => occurrence.assignee.id === member.id)
            .map((occurrence) => ({ ...occurrence, assignee: member })),
        })),
      });
    });
  });

  server.get('/api/v1/households/:householdId/home', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      HomeStatusSchema.parse(await homeRepository.getStatus(params.householdId)),
    );
  });

  server.post('/api/v1/households/:householdId/home/actions/:actionId', async (request, reply) => {
    const params = parse(HomeActionParamsSchema, request.params, reply);
    const body = parse(ExecuteHomeActionRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = HomeActionResultSchema.parse(
        await homeRepository.executeAction(
          params.householdId,
          params.actionId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'home.changed', params.actionId);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/assist/day-summary', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(AssistDaySummaryRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      assistActor(request.headers, options);
      const today = await readToday(params.householdId, body.date);
      return AssistDaySummaryResultSchema.parse({
        requestId: body.requestId,
        date: body.date,
        speech: buildAssistDaySummary(today),
      });
    });
  });

  server.post(
    '/api/v1/households/:householdId/assist/chore-completions',
    async (request, reply) => {
      const params = parse(HouseholdParamsSchema, request.params, reply);
      const body = parse(AssistChoreCompletionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const chores = await repository.getChores(params.householdId, body.date);
        let occurrence;
        try {
          occurrence = resolveAssistChore(chores, body.memberName, body.choreTitle);
        } catch (error) {
          if (error instanceof HomeDomainError) {
            throw new RepositoryError(error.code, error.message);
          }
          throw error;
        }
        const result = ChoreCommandResultSchema.parse(
          await repository.complete(
            params.householdId,
            occurrence.id,
            body.requestId,
            assistActor(request.headers, options),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', occurrence.id);
        realtime.publish(params.householdId, 'pocket-money.changed', occurrence.id);
        return AssistChoreCompletionResultSchema.parse({
          speech: `Done. I marked ${occurrence.title} complete for ${occurrence.assignee.displayName} today.`,
          command: result,
        });
      });
    },
  );

  server.get('/api/v1/households/:householdId/lists', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      HouseholdListsSchema.parse(await planningRepository.getLists(params.householdId)),
    );
  });

  server.get('/api/v1/households/:householdId/list-settings', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      HouseholdListSettingsSchema.parse(
        await planningRepository.getListSettings(
          params.householdId,
          commandActor(request.headers, options, adminRepository),
        ),
      ),
    );
  });

  server.post('/api/v1/households/:householdId/lists', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateHouseholdListRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.createList(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', result.audit.targetId);
      return result;
    });
  });

  server.put('/api/v1/households/:householdId/lists/:listId', async (request, reply) => {
    const params = parse(ListParamsSchema, request.params, reply);
    const body = parse(UpdateHouseholdListRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.updateList(
          params.householdId,
          params.listId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', params.listId);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/lists/:listId/archives', async (request, reply) => {
    const params = parse(ListParamsSchema, request.params, reply);
    const body = parse(CommandRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.archiveList(
          params.householdId,
          params.listId,
          body.requestId,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', params.listId);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/lists/:listId/restorations',
    async (request, reply) => {
      const params = parse(ListParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ListSettingsCommandResultSchema.parse(
          await planningRepository.restoreList(
            params.householdId,
            params.listId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'list.changed', params.listId);
        return result;
      });
    },
  );

  server.put('/api/v1/households/:householdId/list-order', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(ReorderHouseholdListsRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.reorderLists(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', params.householdId);
      return result;
    });
  });

  server.put('/api/v1/households/:householdId/list-items/:itemId', async (request, reply) => {
    const params = parse(ListItemParamsSchema, request.params, reply);
    const body = parse(UpdateListItemRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.updateListItem(
          params.householdId,
          params.itemId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', params.itemId);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/list-items/:itemId/archives',
    async (request, reply) => {
      const params = parse(ListItemParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ListSettingsCommandResultSchema.parse(
          await planningRepository.archiveListItem(
            params.householdId,
            params.itemId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'list.changed', params.itemId);
        return result;
      });
    },
  );

  server.put('/api/v1/households/:householdId/lists/:listId/item-order', async (request, reply) => {
    const params = parse(ListParamsSchema, request.params, reply);
    const body = parse(ReorderListItemsRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListSettingsCommandResultSchema.parse(
        await planningRepository.reorderListItems(
          params.householdId,
          params.listId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', params.listId);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/lists/:listId/checked-item-clears',
    async (request, reply) => {
      const params = parse(ListParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ListSettingsCommandResultSchema.parse(
          await planningRepository.clearCheckedListItems(
            params.householdId,
            params.listId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'list.changed', params.listId);
        return result;
      });
    },
  );

  server.post('/api/v1/households/:householdId/lists/:listId/items', async (request, reply) => {
    const params = parse(ListParamsSchema, request.params, reply);
    const body = parse(AddListItemRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ListItemCommandResultSchema.parse(
        await planningRepository.addListItem(
          params.householdId,
          params.listId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', result.item.id);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/assist/list-items', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(AssistAddListItemRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const lists = await planningRepository.getLists(params.householdId);
      let target;
      try {
        target = resolveHouseholdListTarget(lists.lists, body.listName);
      } catch (error) {
        if (error instanceof PlanningDomainError) {
          throw new RepositoryError(error.code, error.message);
        }
        throw error;
      }
      const result = ListItemCommandResultSchema.parse(
        await planningRepository.addListItem(
          params.householdId,
          target.id,
          { requestId: body.requestId, text: body.text, quantity: body.quantity },
          assistActor(request.headers, options),
        ),
      );
      realtime.publish(params.householdId, 'list.changed', result.item.id);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/list-items/:itemId/completions',
    async (request, reply) => {
      const params = parse(ListItemParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ListItemCommandResultSchema.parse(
          await planningRepository.completeListItem(
            params.householdId,
            params.itemId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'list.changed', params.itemId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/list-items/:itemId/completion-reversals',
    async (request, reply) => {
      const params = parse(ListItemParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ListItemCommandResultSchema.parse(
          await planningRepository.undoListItem(
            params.householdId,
            params.itemId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'list.changed', params.itemId);
        return result;
      });
    },
  );

  server.get('/api/v1/households/:householdId/meal-plan', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(WeekQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () =>
      MealPlanSchema.parse(await planningRepository.getMealPlan(params.householdId, query.start)),
    );
  });

  server.put('/api/v1/households/:householdId/meal-plan-entries', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpsertMealPlanRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = MealCommandResultSchema.parse(
        await planningRepository.upsertMealPlan(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.entry.id);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/saved-meals', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateSavedMealRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = SavedMealCommandResultSchema.parse(
        await planningRepository.createSavedMeal(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.savedMeal.id);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/saved-meal-library', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      SavedMealLibrarySchema.parse(
        await planningRepository.getSavedMealLibrary(
          params.householdId,
          commandActor(request.headers, options, adminRepository),
        ),
      ),
    );
  });

  server.put('/api/v1/households/:householdId/saved-meals/:mealId', async (request, reply) => {
    const params = parse(SavedMealParamsSchema, request.params, reply);
    const body = parse(UpdateSavedMealRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = SavedMealCommandResultSchema.parse(
        await planningRepository.updateSavedMeal(
          params.householdId,
          params.mealId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.savedMeal.id);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/saved-meals/:mealId/archives',
    async (request, reply) => {
      const params = parse(SavedMealParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = SavedMealCommandResultSchema.parse(
          await planningRepository.archiveSavedMeal(
            params.householdId,
            params.mealId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'meal.changed', result.savedMeal.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/saved-meals/:mealId/restorations',
    async (request, reply) => {
      const params = parse(SavedMealParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = SavedMealCommandResultSchema.parse(
          await planningRepository.restoreSavedMeal(
            params.householdId,
            params.mealId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'meal.changed', result.savedMeal.id);
        return result;
      });
    },
  );

  server.put('/api/v1/households/:householdId/meal-plan-weeks', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(UpdateMealPlanWeekRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = MealPlanWeekCommandResultSchema.parse(
        await planningRepository.updateMealPlanWeek(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.audit.targetId);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/meal-plan-week-clears', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(ClearMealPlanWeekRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = MealPlanWeekCommandResultSchema.parse(
        await planningRepository.clearMealPlanWeek(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.audit.targetId);
      return result;
    });
  });

  server.post('/api/v1/households/:householdId/meal-plan-week-copies', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CopyMealPlanWeekRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = MealPlanWeekCommandResultSchema.parse(
        await planningRepository.copyMealPlanWeek(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'meal.changed', result.audit.targetId);
      return result;
    });
  });

  server.get('/api/v1/households/:householdId/pocket-money', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const query = parse(PocketMoneyQuerySchema, request.query, reply);
    if (params === null || query === null) return reply;
    return run(reply, async () =>
      PocketMoneyOverviewSchema.parse(
        await pocketMoneyRepository.getOverview(params.householdId, query.weekStart, query.asOf),
      ),
    );
  });

  server.put(
    '/api/v1/households/:householdId/members/:memberId/pocket-money-settings',
    async (request, reply) => {
      const params = parse(MemberParamsSchema, request.params, reply);
      const body = parse(UpdatePocketMoneySettingsRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = PocketMoneySettingsCommandResultSchema.parse(
          await pocketMoneyRepository.updateSettings(
            params.householdId,
            params.memberId,
            body,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'pocket-money.changed', params.memberId);
        return result;
      });
    },
  );

  server.post('/api/v1/households/:householdId/pocket-money-payments', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(RecordPocketMoneyPaymentRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = PocketMoneyPaymentCommandResultSchema.parse(
        await pocketMoneyRepository.recordPayment(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'pocket-money.changed', body.memberId);
      return result;
    });
  });

  server.post(
    '/api/v1/households/:householdId/pocket-money-payments/:paymentId/voids',
    async (request, reply) => {
      const params = parse(PocketMoneyPaymentParamsSchema, request.params, reply);
      const body = parse(VoidPocketMoneyPaymentRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = PocketMoneyPaymentVoidCommandResultSchema.parse(
          await pocketMoneyRepository.voidPayment(
            params.householdId,
            params.paymentId,
            body,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'pocket-money.changed', result.payment.memberId);
        return result;
      });
    },
  );

  server.get('/api/v1/households/:householdId/chore-templates', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    return run(reply, async () =>
      ChoreTemplateListSchema.parse(
        await planningRepository.getChoreTemplates(
          params.householdId,
          commandActor(request.headers, options, adminRepository),
        ),
      ),
    );
  });

  server.post('/api/v1/households/:householdId/chore-templates', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(CreateChoreTemplateRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ChoreTemplateCommandResultSchema.parse(
        await planningRepository.createChoreTemplate(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'chore-template.changed', result.template.id);
      return result;
    });
  });

  server.put('/api/v1/households/:householdId/chore-template-order', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    const body = parse(ReorderChoreTemplatesRequestSchema, request.body, reply);
    if (params === null || body === null) return reply;
    return run(reply, async () => {
      const result = ChoreTemplateOrderCommandResultSchema.parse(
        await planningRepository.reorderChoreTemplates(
          params.householdId,
          body,
          commandActor(request.headers, options, adminRepository),
        ),
      );
      realtime.publish(params.householdId, 'chore-template.changed', params.householdId);
      return result;
    });
  });

  server.patch(
    '/api/v1/households/:householdId/chore-templates/:templateId',
    async (request, reply) => {
      const params = parse(ChoreTemplateParamsSchema, request.params, reply);
      const body = parse(UpdateChoreTemplateRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreTemplateCommandResultSchema.parse(
          await planningRepository.updateChoreTemplate(
            params.householdId,
            params.templateId,
            body,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore-template.changed', result.template.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-templates/:templateId/archivals',
    async (request, reply) => {
      const params = parse(ChoreTemplateParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreTemplateCommandResultSchema.parse(
          await planningRepository.archiveChoreTemplate(
            params.householdId,
            params.templateId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore-template.changed', result.template.id);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-templates/:templateId/restorations',
    async (request, reply) => {
      const params = parse(ChoreTemplateParamsSchema, request.params, reply);
      const body = parse(RestoreChoreTemplateRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreTemplateCommandResultSchema.parse(
          await planningRepository.restoreChoreTemplate(
            params.householdId,
            params.templateId,
            body,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore-template.changed', result.template.id);
        return result;
      });
    },
  );

  server.get('/api/v1/households/:householdId/events', async (request, reply) => {
    const params = parse(HouseholdParamsSchema, request.params, reply);
    if (params === null) return reply;
    reply.hijack();
    reply.raw.writeHead(200, {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write(': connected\n\n');
    let closed = false;
    const send = async (data: string) => {
      if (closed) return;
      if (
        runtime.mode === 'private' &&
        !(await hasPrivateHouseholdReadAccess(
          request.headers,
          params.householdId,
          options,
          adminRepository,
        ).catch(() => false))
      ) {
        close();
        reply.raw.end();
        return;
      }
      if (!closed) reply.raw.write(data);
    };
    const unsubscribe = realtime.subscribe(params.householdId, (event) => {
      const parsed = RealtimeEventSchema.parse(event);
      void send(`id: ${parsed.id}\nevent: ${parsed.kind}\ndata: ${JSON.stringify(parsed)}\n\n`);
    });
    const keepAlive = setInterval(() => void send(': keep-alive\n\n'), 20_000);
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(keepAlive);
      unsubscribe();
    };
    reply.raw.once('close', close);
    return reply;
  });

  server.get(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      if (params === null) return reply;
      return run(reply, async () =>
        ChoreOccurrenceDetailSchema.parse(
          await repository.getChoreOccurrenceDetail(
            params.householdId,
            params.occurrenceId,
            commandActor(request.headers, options, adminRepository),
          ),
        ),
      );
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId/completions',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      const body = parse(CommandRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreCommandResultSchema.parse(
          await repository.complete(
            params.householdId,
            params.occurrenceId,
            body.requestId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', params.occurrenceId);
        realtime.publish(params.householdId, 'pocket-money.changed', params.occurrenceId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId/completion-reversals',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      const body = parse(CompletionReversalRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreCommandResultSchema.parse(
          await repository.undo(
            params.householdId,
            params.occurrenceId,
            body.requestId,
            body.completionId,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', params.occurrenceId);
        realtime.publish(params.householdId, 'pocket-money.changed', params.occurrenceId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId/skips',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      const body = parse(ChoreExceptionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreSkipResultSchema.parse(
          await repository.skip(
            params.householdId,
            params.occurrenceId,
            body.requestId,
            body.reason,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', params.occurrenceId);
        realtime.publish(params.householdId, 'pocket-money.changed', params.occurrenceId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId/excuses',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      const body = parse(ChoreExceptionRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreOccurrenceChangeResultSchema.parse(
          await repository.excuse(
            params.householdId,
            params.occurrenceId,
            body.requestId,
            body.reason,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', params.occurrenceId);
        realtime.publish(params.householdId, 'pocket-money.changed', params.occurrenceId);
        return result;
      });
    },
  );

  server.post(
    '/api/v1/households/:householdId/chore-occurrences/:occurrenceId/reassignments',
    async (request, reply) => {
      const params = parse(ChoreParamsSchema, request.params, reply);
      const body = parse(ChoreReassignmentRequestSchema, request.body, reply);
      if (params === null || body === null) return reply;
      return run(reply, async () => {
        const result = ChoreOccurrenceChangeResultSchema.parse(
          await repository.reassign(
            params.householdId,
            params.occurrenceId,
            body.requestId,
            body.assigneeId,
            body.reason,
            commandActor(request.headers, options, adminRepository),
          ),
        );
        realtime.publish(params.householdId, 'chore.changed', params.occurrenceId);
        realtime.publish(params.householdId, 'pocket-money.changed', params.occurrenceId);
        return result;
      });
    },
  );

  if (demoMode) {
    server.post('/api/v1/demo/reset', async (_request, reply) => {
      modules.reset();
      nba.reset();
      fitness.reset();
      fitnessLibrary.reset();
      morningRoutine.reset();
      nbaGames.reset();
      homeAssistantPairings.reset();
      homeAssistantBridge.reset();
      planningRepository.reset();
      repository.reset();
      adminRepository.reset();
      homeRepository.reset();
      photoRepository.reset();
      pocketMoneyRepository.reset();
      reminderRepository.reset();
      calendarConnectionRepository.reset();
      homeAssistantConnectionRepository.reset();
      indoorClimate.reset();
      systemOperations.reset();
      todayContentRepository.reset();
      weatherLocationRepository.reset();
      return reply.send({ reset: true });
    });

    server.post('/api/v1/demo/scenario', async (request, reply) => {
      const body = parse(DemoScenarioRequestSchema, request.body, reply);
      if (body === null) return reply;
      repository.setScenario(body.scenario);
      planningRepository.setScenario(body.scenario);
      homeRepository.setScenario(body.scenario);
      photoRepository.setScenario(body.scenario);
      todayContentRepository.setScenario(body.scenario);
      return reply.send({ scenario: body.scenario });
    });
  }

  server.addHook('onClose', async () => {
    await photoRepository.close();
    planningRepository.close();
    adminRepository.close();
    pocketMoneyRepository.close();
    reminderRepository.close();
    calendarConnectionRepository.close();
    homeAssistantConnectionRepository.close();
    systemOperations.close();
    todayContentRepository.close();
    weatherLocationRepository.close();
  });

  return server;
}

function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
  reply: FastifyReply,
): z.infer<T> | null {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    void reply.status(400).send(
      ApiErrorSchema.parse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'That request was not understood.',
          retryable: false,
          requestId: null,
        },
      }),
    );
    return null;
  }
  return parsed.data;
}

async function run(reply: FastifyReply, operation: () => Promise<unknown>): Promise<unknown> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RepositoryError) {
      const status =
        error.code === 'VALIDATION_ERROR'
          ? 400
          : error.code === 'UNAUTHENTICATED'
            ? 401
            : error.code === 'NOT_FOUND'
              ? 404
              : error.code === 'FORBIDDEN' || error.code === 'MODULE_DISABLED'
                ? 403
                : [
                      'CONFLICT',
                      'CONFIRMATION_REQUIRED',
                      'AMBIGUOUS_TARGET',
                      'DUPLICATE_ITEM',
                      'STALE_SNAPSHOT',
                    ].includes(error.code)
                  ? 409
                  : 503;
      return reply.status(status).send(
        ApiErrorSchema.parse({
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
            requestId: null,
          },
        }),
      );
    }
    throw error;
  }
}

async function authorizePrivateHouseholdRead(
  headers: Record<string, string | string[] | undefined>,
  householdId: string,
  options: BuildServerOptions,
  adminRepository: AdminRepository,
): Promise<void> {
  const deviceCredential = optionalDeviceCredential(headers);
  if (deviceCredential !== null) {
    const session = adminRepository.getTvDeviceSession(deviceCredential);
    if (session.householdId !== householdId) {
      throw new RepositoryError('FORBIDDEN', 'This television belongs to a different Hearth home.');
    }
    if (!session.scopes.includes('household.read')) {
      throw new RepositoryError('FORBIDDEN', 'This television cannot view household information.');
    }
    return;
  }

  const companionCredential = optionalCompanionCredential(headers);
  if (isSharedScreenRequest(headers)) {
    throw new RepositoryError('UNAUTHENTICATED', 'Connect this shared screen from an adult phone.');
  }
  if (companionCredential === null || options.companionAuth === undefined) {
    throw new RepositoryError('UNAUTHENTICATED', 'Sign in or pair this television to continue.');
  }
  const session = options.companionAuth.session(companionCredential);
  if (session.householdId !== householdId) {
    throw new RepositoryError('FORBIDDEN', 'That sign-in belongs to a different Hearth home.');
  }
  const household = await adminRepository.getHousehold(householdId);
  const member = household.members.find((candidate) => candidate.id === session.memberId);
  if (member === undefined) {
    throw new RepositoryError('UNAUTHENTICATED', 'Sign in to continue.');
  }
  if (!member.capabilities.includes('household.view')) {
    throw new RepositoryError('FORBIDDEN', 'This household member cannot view Hearth.');
  }
}

async function hasPrivateHouseholdReadAccess(
  headers: Record<string, string | string[] | undefined>,
  householdId: string,
  options: BuildServerOptions,
  adminRepository: AdminRepository,
): Promise<boolean> {
  try {
    await authorizePrivateHouseholdRead(headers, householdId, options, adminRepository);
    return true;
  } catch (error) {
    if (
      error instanceof RepositoryError &&
      (error.code === 'UNAUTHENTICATED' || error.code === 'FORBIDDEN' || error.code === 'NOT_FOUND')
    ) {
      return false;
    }
    throw error;
  }
}

function actorId(
  headers: Record<string, string | string[] | undefined>,
  options: BuildServerOptions,
): string {
  assertControllerRequest(headers);
  if (isPrivateMode(options)) {
    return companionActor(headers, options).id;
  }
  const header = headers['x-hearth-demo-actor'];
  return typeof header === 'string' ? header : DEMO_ADMIN_ACTOR_ID;
}

function commandActor(
  headers: Record<string, string | string[] | undefined>,
  options: BuildServerOptions,
  adminRepository: AdminRepository,
): CommandActor {
  if (hasDeviceCredentialContext(headers)) {
    return adminRepository.authenticateDeviceCredential(deviceCredential(headers));
  }
  if (isPrivateMode(options)) {
    return companionActor(headers, options);
  }
  return isSharedScreenRequest(headers) ? DEMO_TV_ACTOR : demoCommandActor(headers);
}

function demoCommandActor(headers: Record<string, string | string[] | undefined>): CommandActor {
  const actorHeader = headers['x-hearth-demo-actor'];
  const sourceHeader = headers['x-hearth-demo-source'];
  if (typeof actorHeader !== 'string') return DEMO_TV_ACTOR;
  if (actorHeader.startsWith('member_')) {
    return {
      id: actorHeader,
      type: 'member',
      source: sourceHeader === 'voice' ? 'voice' : 'companion',
    };
  }
  if (actorHeader.startsWith('service_')) {
    return { id: actorHeader, type: 'service', source: 'automation' };
  }
  return { id: actorHeader, type: 'device', source: 'tv' };
}

function assistActor(
  headers: Record<string, string | string[] | undefined>,
  options: BuildServerOptions,
): CommandActor {
  if (isPrivateMode(options)) {
    throw new RepositoryError('UNAUTHENTICATED', 'Home Assistant is not connected to Hearth.');
  }
  const actorHeader = headers['x-hearth-demo-actor'];
  if (typeof actorHeader !== 'string') {
    return { id: 'service_home_assistant', type: 'service', source: 'voice' };
  }
  return { ...demoCommandActor(headers), source: 'voice' };
}

function isPrivateMode(options: BuildServerOptions): boolean {
  return options.runtime?.mode === 'private' || options.demoMode === false;
}

function deviceCredential(headers: Record<string, string | string[] | undefined>): string {
  const credential = optionalDeviceCredential(headers);
  if (credential === null) {
    throw new RepositoryError('UNAUTHENTICATED', 'This television is not paired with Hearth.');
  }
  return credential;
}

function optionalDeviceCredential(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const authorization = headers.authorization;
  if (typeof authorization === 'string' && /^\s*Bearer(?:\s|$)/i.test(authorization)) {
    const credential = authorization.trimStart().slice('Bearer'.length).trim();
    return credential.length > 0 ? credential : null;
  }
  const cookie = headers.cookie;
  if (typeof cookie !== 'string') return null;
  for (const part of cookie.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === HEARTH_DEVICE_COOKIE) {
      const value = valueParts.join('=');
      return value.length > 0 ? safeDecodeCookie(value) : null;
    }
  }
  return null;
}

function isSharedScreenRequest(headers: Record<string, string | string[] | undefined>): boolean {
  const userAgent = headers['user-agent'];
  return (
    hasDeviceCredentialContext(headers) ||
    (typeof userAgent === 'string' && isTelevisionUserAgent(userAgent))
  );
}

function hasDeviceCredentialContext(
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const authorization = headers.authorization;
  const cookie = headers.cookie;
  // Presence matters even for expired, revoked, empty or malformed display proofs.
  // A broken display credential must never fall back to a companion cookie.
  return (
    (typeof authorization === 'string' && /^\s*Bearer(?:\s|$)/i.test(authorization)) ||
    (typeof cookie === 'string' &&
      cookie.split(';').some((part) => part.trim().split('=')[0] === HEARTH_DEVICE_COOKIE))
  );
}

function assertControllerRequest(headers: Record<string, string | string[] | undefined>): void {
  if (isSharedScreenRequest(headers)) {
    throw new RepositoryError('FORBIDDEN', 'Use an adult phone or computer to manage Hearth.');
  }
}

function companionAuth(options: BuildServerOptions): CompanionAuthRepository {
  if (options.companionAuth === undefined) {
    throw new RepositoryError(
      'INTEGRATION_UNAVAILABLE',
      'Private companion authentication is not configured.',
    );
  }
  return options.companionAuth;
}

function companionActor(
  headers: Record<string, string | string[] | undefined>,
  options: BuildServerOptions,
): CommandActor {
  if (options.companionAuth === undefined) {
    throw new RepositoryError('UNAUTHENTICATED', 'Sign in to continue.');
  }
  return options.companionAuth.authenticate(companionCredential(headers));
}

function assertRecentUpdateConfirmation(
  headers: Record<string, string | string[] | undefined>,
  options: BuildServerOptions,
): void {
  if (!isPrivateMode(options)) return;
  const auth = options.companionAuth;
  if (auth?.assertRecentAuthentication === undefined) {
    throw new RepositoryError(
      'INTEGRATION_UNAVAILABLE',
      'Adult passkey confirmation is not available.',
    );
  }
  auth.assertRecentAuthentication(companionCredential(headers), 5 * 60 * 1000);
}

function companionCredential(headers: Record<string, string | string[] | undefined>): string {
  assertControllerRequest(headers);
  const token = optionalCompanionCredential(headers);
  if (token === null) throw new RepositoryError('UNAUTHENTICATED', 'Sign in to continue.');
  return token;
}

function optionalCompanionCredential(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const cookie = headers.cookie;
  if (typeof cookie !== 'string') return null;
  for (const part of cookie.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === HEARTH_COMPANION_COOKIE) {
      const value = valueParts.join('=');
      return value.length > 0 ? safeDecodeCookie(value) : null;
    }
  }
  return null;
}

function safeDecodeCookie(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function deviceSessionCookie(credential: string, secure: boolean): string {
  const secureAttribute = secure ? '; Secure' : '';
  return `${HEARTH_DEVICE_COOKIE}=${encodeURIComponent(credential)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DEVICE_SESSION_MAX_AGE_SECONDS}${secureAttribute}`;
}

function memberLookup(members: Member[]): Map<string, Member> {
  return new Map(members.map((member) => [member.id, member]));
}
