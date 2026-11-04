import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODULE_FLAGS,
  MODULE_IDS,
  ModuleFlagsSchema,
  UpdateModuleRequestSchema,
  moduleForPath,
} from './modules.js';
import { BridgeGrantRequestSchema, BridgePairingApprovalSchema } from './home-assistant-bridge.js';

describe('fixed household modules contract', () => {
  it('requires eleven explicit booleans and keeps all legacy features enabled by default', () => {
    expect(Object.keys(DEFAULT_MODULE_FLAGS)).toEqual([...MODULE_IDS]);
    expect(ModuleFlagsSchema.parse(DEFAULT_MODULE_FLAGS)).toEqual(DEFAULT_MODULE_FLAGS);
    expect(moduleForPath('/WEATHER/')).toBe('weather');
    expect(moduleForPath('/%72eminders')).toBe('reminders');
    expect(moduleForPath('/ADMIN/PHOTOS')).toBe('photos');
    expect(moduleForPath('/%61dmin/connections/calendar')).toBe('calendar');
    for (const id of MODULE_IDS) {
      expect(DEFAULT_MODULE_FLAGS[id]).toBe(!['nba', 'morningRoutine', 'fitness'].includes(id));
      expect(
        ModuleFlagsSchema.safeParse({ ...DEFAULT_MODULE_FLAGS, [id]: undefined }).success,
      ).toBe(['nba', 'morningRoutine', 'fitness'].includes(id));
      expect(ModuleFlagsSchema.safeParse({ ...DEFAULT_MODULE_FLAGS, [id]: 0 }).success).toBe(false);
    }
    expect(
      UpdateModuleRequestSchema.safeParse({
        requestId: 'request_test',
        enabled: false,
        householdId: 'household_other',
      }).success,
    ).toBe(false);
  });
  it.each([
    ['/calendar/week?date=2026-10-15', 'calendar'],
    ['/week', 'calendar'],
    ['/month', 'calendar'],
    ['/weather', 'weather'],
    ['/admin/connections/weather', 'weather'],
    ['/reminders', 'reminders'],
    ['/chores', 'chores'],
    ['/admin/routines', 'chores'],
    ['/admin/chore-day', 'chores'],
    ['/admin/pocket-money', 'chores'],
    ['/lists', 'lists'],
    ['/admin/lists', 'lists'],
    ['/admin/meals', 'meals'],
    ['/home', 'home'],
    ['/photos#fullscreen', 'photos'],
    ['/admin/photos', 'photos'],
    ['/games', 'games'],
    ['/morning-routine', 'morningRoutine'],
    ['/admin/morning-routine', 'morningRoutine'],
    ['/admin/connections/calendar', 'calendar'],
    ['/today', null],
    ['/more', null],
    ['/appearance', null],
    ['/admin/modules', null],
    ['/admin/people', null],
    ['/admin/connections/home-assistant', null],
    ['/admin/televisions', null],
  ])('maps routes without hiding core controls: %s', (path, module) => {
    expect(moduleForPath(path!)).toBe(module);
  });
  it('never upgrades an old grant or pending approval to module control', () => {
    const common = {
      requestId: 'request_test',
      screenIds: [],
      shareChores: true,
      shareCalendar: true,
      controlChores: true,
    };
    expect(
      BridgeGrantRequestSchema.parse({ ...common, secret: `ha_${'a'.repeat(43)}` }).controlModules,
    ).toBe(false);
    expect(BridgePairingApprovalSchema.parse({ ...common, code: 'ABCDEF' }).controlModules).toBe(
      false,
    );
    expect(
      BridgePairingApprovalSchema.parse({ ...common, code: 'ABCDEF', controlModules: true })
        .controlModules,
    ).toBe(true);
  });
});
