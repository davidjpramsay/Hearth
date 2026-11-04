import { describe, expect, it } from 'vitest';
import { DEFAULT_MODULE_FLAGS } from './modules.js';
import stateFixture from '../fixtures/home-assistant-bridge-v1/state.json' with { type: 'json' };
import {
  BridgeCalendarQuerySchema,
  BridgeChoreCompletionRequestSchema,
  BridgeGrantRequestSchema,
  BridgeStateSchema,
  LEGACY_BRIDGE_MODULE_IDS,
  SCREEN_TAB_PATHS,
  ScreenNavigationRequestSchema,
  ScreenPresentationRequestSchema,
  screenTabForPath,
} from './home-assistant-bridge.js';

describe('Home Assistant bridge v1 boundary', () => {
  it('validates the shared language-neutral HA interoperability fixture', () => {
    expect(BridgeStateSchema.parse(stateFixture)).toEqual({
      ...stateFixture,
      modules: DEFAULT_MODULE_FLAGS,
      permissions: {
        ...stateFixture.permissions,
        controlModules: false,
        moduleIds: LEGACY_BRIDGE_MODULE_IDS,
      },
    });
  });
  it('maps only explicit public routes, not admin, external URLs, fragments or path prefixes', () => {
    expect(screenTabForPath('/games/connections')).toBe('games');
    expect(screenTabForPath('/games/connections/unknown')).toBeNull();
    for (const [tab, path] of Object.entries(SCREEN_TAB_PATHS))
      expect(screenTabForPath(path)).toBe(tab);
    for (const value of [
      '/admin',
      '/admin/people',
      '/pair',
      'https://fixture.invalid',
      '/today?token=secret',
      '/photos/delete',
      '/calendar/week#admin',
    ]) {
      expect(screenTabForPath(value)).toBeNull();
      expect(
        ScreenNavigationRequestSchema.safeParse({ requestId: 'request_fixture', tab: value })
          .success,
      ).toBe(false);
    }
  });
  it('requires explicit privacy permissions, strong key and unique bounded screen IDs', () => {
    const grant = {
      requestId: 'request_fixture',
      secret: `ha_${'a'.repeat(43)}`,
      screenIds: ['device_fixture'],
      shareChores: false,
      shareCalendar: true,
    };
    expect(BridgeGrantRequestSchema.safeParse(grant).success).toBe(true);
    expect(BridgeGrantRequestSchema.parse(grant).controlChores).toBe(false);
    for (const invalid of [
      { ...grant, shareCalendar: undefined },
      { ...grant, secret: 'short' },
      { ...grant, screenIds: ['device_fixture', 'device_fixture'] },
      { ...grant, screenIds: Array.from({ length: 21 }, (_, i) => `device_${i}`) },
      { ...grant, adultToken: 'not allowed' },
      { ...grant, controlChores: true },
    ])
      expect(BridgeGrantRequestSchema.safeParse(invalid).success).toBe(false);
  });
  it('limits chore changes to explicit completion and concurrency-safe reopening', () => {
    const command = {
      requestId: 'request_fixture',
      localDate: '2026-10-15',
      isCompleted: true,
      completionId: null,
    };
    expect(BridgeChoreCompletionRequestSchema.safeParse(command).success).toBe(true);
    expect(
      BridgeChoreCompletionRequestSchema.safeParse({
        ...command,
        isCompleted: false,
        completionId: 'completion_fixture',
      }).success,
    ).toBe(true);
    for (const invalid of [
      { ...command, isCompleted: false },
      { ...command, completionId: 'completion_fixture' },
      { ...command, title: 'Rename' },
      { ...command, householdId: 'household_other' },
      { ...command, localDate: 'yesterday' },
    ])
      expect(BridgeChoreCompletionRequestSchema.safeParse(invalid).success).toBe(false);
  });
  it('never accepts caller-supplied TV/household identity in a presentation report', () => {
    const report = { instanceId: 'instance_fixture', tab: 'today', acknowledgedCommandId: null };
    expect(ScreenPresentationRequestSchema.safeParse(report).success).toBe(true);
    expect(
      ScreenPresentationRequestSchema.safeParse({ ...report, deviceId: 'device_other' }).success,
    ).toBe(false);
    expect(
      ScreenPresentationRequestSchema.safeParse({ ...report, householdId: 'household_other' })
        .success,
    ).toBe(false);
  });
  it('bounds timestamp ranges, including exclusive end and invalid offsets', () => {
    expect(
      BridgeCalendarQuerySchema.safeParse({
        start: '2026-10-01T00:00:00Z',
        end: '2026-11-01T00:00:00Z',
      }).success,
    ).toBe(true);
    for (const range of [
      { start: '2026-10-01T00:00:00Z', end: '2026-11-02T00:00:00Z' },
      { start: '2026-10-01T00:00:00Z', end: '2026-10-01T00:00:00Z' },
      { start: '2026-10-01', end: '2026-10-02' },
    ])
      expect(BridgeCalendarQuerySchema.safeParse(range).success).toBe(false);
  });
});
