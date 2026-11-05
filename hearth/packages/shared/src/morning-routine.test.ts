import { describe, expect, it } from 'vitest';
import {
  MorningConfigurationSchema,
  SetMorningCompletionSchema,
  defaultMorningProfiles,
  MorningProfilesSchema,
  MorningSettingsCommandSchema,
} from './morning-routine.js';
const configuration = {
  startTime: '07:00',
  endTime: '08:00',
  selectedMemberIds: ['member_child'],
  routines: [{ memberId: 'member_child', steps: [{ id: 'step_shoes', title: 'Shoes on' }] }],
};
describe('Morning Routine contracts', () => {
  it('accepts empty selections, bounded lists and suggested ordering', () => {
    expect(MorningConfigurationSchema.parse(configuration)).toEqual(configuration);
    expect(
      MorningConfigurationSchema.safeParse({ ...configuration, selectedMemberIds: [] }).success,
    ).toBe(true);
  });
  it.each([
    { startTime: '08:00' },
    { endTime: '06:00' },
    { startTime: '25:00' },
    { selectedMemberIds: ['member_child', 'member_child'] },
    { selectedMemberIds: ['member_other'] },
    {
      routines: [
        {
          memberId: 'member_child',
          steps: Array.from({ length: 13 }, (_, i) => ({ id: `step_${i}`, title: 'Too many' })),
        },
      ],
    },
    { routines: [{ memberId: 'member_child', steps: [{ id: 'step_bad', title: ' ' }] }] },
    {
      routines: [
        {
          memberId: 'member_child',
          steps: [
            { id: 'step_same', title: 'One' },
            { id: 'step_same', title: 'Two' },
          ],
        },
      ],
    },
  ])('rejects unsafe/ambiguous configuration %j', (override) =>
    expect(MorningConfigurationSchema.safeParse({ ...configuration, ...override }).success).toBe(
      false,
    ),
  );
  it('rejects unknown command fields and absent concurrency protection', () => {
    const input = {
      requestId: 'request_check',
      localDate: '2026-10-26',
      memberId: 'member_child',
      stepId: 'step_shoes',
      settingsRevision: 1,
      expectedVersion: 0,
      isCompleted: true,
    };
    expect(SetMorningCompletionSchema.safeParse(input).success).toBe(true);
    expect(
      SetMorningCompletionSchema.safeParse({ ...input, householdId: 'household_other' }).success,
    ).toBe(false);
    expect(
      SetMorningCompletionSchema.safeParse({ ...input, expectedVersion: undefined }).success,
    ).toBe(false);
  });
});

describe('two scheduled morning profiles', () => {
  it('preserves the school configuration, creates empty untimed weekends and isolates draft arrays', () => {
    const profiles = defaultMorningProfiles(configuration);
    expect(profiles.schoolDays.configuration).toEqual(configuration);
    expect(profiles.weekends).toMatchObject({
      days: ['sat', 'sun'],
      countdownEnabled: false,
      configuration: { routines: [{ memberId: 'member_child', steps: [] }] },
    });
    profiles.weekends.configuration.selectedMemberIds.push('member_other');
    expect(configuration.selectedMemberIds).toEqual(['member_child']);
    expect(profiles.schoolDays.configuration.selectedMemberIds).toEqual(['member_child']);
  });
  it('allows unassigned days but rejects overlap, duplicate or unknown days', () => {
    const profiles = defaultMorningProfiles(configuration);
    expect(
      MorningProfilesSchema.safeParse({
        ...profiles,
        schoolDays: { ...profiles.schoolDays, days: [] },
      }).success,
    ).toBe(true);
    expect(
      MorningProfilesSchema.safeParse({
        ...profiles,
        weekends: { ...profiles.weekends, days: ['mon'] },
      }).success,
    ).toBe(false);
    expect(
      MorningProfilesSchema.safeParse({
        ...profiles,
        schoolDays: { ...profiles.schoolDays, days: ['mon', 'mon'] },
      }).success,
    ).toBe(false);
    expect(
      MorningProfilesSchema.safeParse({
        ...profiles,
        schoolDays: { ...profiles.schoolDays, days: ['holiday'] },
      }).success,
    ).toBe(false);
  });
  it('keeps legacy command serialization unchanged for persisted exact-retry hashes', () => {
    const legacy = { requestId: 'request_legacy', expectedRevision: 1, configuration };
    expect(JSON.stringify(MorningSettingsCommandSchema.parse(legacy))).toBe(JSON.stringify(legacy));
    const input = {
      requestId: 'request_check',
      localDate: '2026-10-26',
      memberId: 'member_child',
      stepId: 'step_shoes',
      settingsRevision: 1,
      expectedVersion: 0,
      isCompleted: true,
    };
    expect(JSON.stringify(SetMorningCompletionSchema.parse(input))).toBe(JSON.stringify(input));
  });
});

it('keeps old command shape unchanged and bounds plain versus linked titles', () => {
  expect(MorningConfigurationSchema.parse(configuration)).toEqual(configuration);
  const long = {
    ...configuration,
    routines: [{ memberId: 'member_child', steps: [{ id: 'step_chore', title: 'a'.repeat(100) }] }],
  };
  expect(MorningConfigurationSchema.safeParse(long).success).toBe(false);
  expect(
    MorningConfigurationSchema.safeParse({
      ...long,
      routines: [
        {
          memberId: 'member_child',
          steps: [{ ...long.routines[0]!.steps[0]!, choreTemplateId: 'template_chore' }],
        },
      ],
    }).success,
  ).toBe(true);
});
