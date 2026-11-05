import { getHearthRuntime, householdId } from './core';

export const queryKeys = {
  get indoorClimate() {
    return [householdId(getHearthRuntime()), 'indoor-climate'] as const;
  },
  get indoorSettings() {
    return [householdId(getHearthRuntime()), 'indoor-climate-settings'] as const;
  },
  get dailyVerse() {
    const runtime = getHearthRuntime();
    return [householdId(runtime), 'daily-verse', runtime.localDate] as const;
  },
  get fitness() {
    return [householdId(getHearthRuntime()), 'fitness'] as const;
  },
  get fitnessLibrary() {
    return [householdId(getHearthRuntime()), 'fitness-library'] as const;
  },
  get fitnessSettings() {
    return [householdId(getHearthRuntime()), 'fitness-settings'] as const;
  },
  get afternoonRoutine() {
    return [householdId(getHearthRuntime()), 'afternoon-routine'] as const;
  },
  get afternoonSettings() {
    return [householdId(getHearthRuntime()), 'afternoon-routine-settings'] as const;
  },
  get morningRoutine() {
    return [householdId(getHearthRuntime()), 'morning-routine'] as const;
  },
  get morningSettings() {
    return [householdId(getHearthRuntime()), 'morning-routine-settings'] as const;
  },
  nbaGame: (gameId: string) => [...queryKeys.nba, 'game', gameId] as const,
  get nba() {
    const runtime = getHearthRuntime();
    return [householdId(runtime), 'nba', runtime.weekStart] as const;
  },
  get nbaSettings() {
    return [householdId(getHearthRuntime()), 'nba-settings'] as const;
  },
  get modules() {
    return [householdId(getHearthRuntime()), 'modules'] as const;
  },
  get today() {
    const runtime = getHearthRuntime();
    return [householdId(runtime), 'today', runtime.localDate] as const;
  },
  get weekRoot() {
    return [householdId(getHearthRuntime()), 'week'] as const;
  },
  get monthRoot() {
    return [householdId(getHearthRuntime()), 'month'] as const;
  },
  week: (start = getHearthRuntime().weekStart) =>
    [householdId(getHearthRuntime()), 'week', start] as const,
  month: (month = getHearthRuntime().currentMonth) =>
    [householdId(getHearthRuntime()), 'month', month] as const,
  get chores() {
    return queryKeys.choresForDate(getHearthRuntime().localDate);
  },
  choresForDate: (localDate: string) =>
    [householdId(getHearthRuntime()), 'chores', localDate] as const,
  get home() {
    return [householdId(getHearthRuntime()), 'home'] as const;
  },
  get photos() {
    return [householdId(getHearthRuntime()), 'photos'] as const;
  },
  get photoSource() {
    return [householdId(getHearthRuntime()), 'photo-source'] as const;
  },
  get admin() {
    return [householdId(getHearthRuntime()), 'admin'] as const;
  },
  get activity() {
    return [householdId(getHearthRuntime()), 'activity'] as const;
  },
  get adultAccess() {
    return [householdId(getHearthRuntime()), 'adult-access'] as const;
  },
  get todayConfiguration() {
    return [householdId(getHearthRuntime()), 'today-configuration'] as const;
  },
  get calendarConnection() {
    return [householdId(getHearthRuntime()), 'calendar-connection'] as const;
  },
  get weatherLocation() {
    return [householdId(getHearthRuntime()), 'weather-location'] as const;
  },
  get weather() {
    return [householdId(getHearthRuntime()), 'weather'] as const;
  },
  get homeAssistantConnection() {
    return [householdId(getHearthRuntime()), 'home-assistant-connection'] as const;
  },
  get reminders() {
    return [householdId(getHearthRuntime()), 'reminders'] as const;
  },
  reminderOverview: (includeCompleted = false) =>
    [...queryKeys.reminders, includeCompleted ? 'all' : 'open'] as const,
  get systemStatus() {
    return [householdId(getHearthRuntime()), 'system-status'] as const;
  },
  get applianceUpdate() {
    return [householdId(getHearthRuntime()), 'appliance-update'] as const;
  },
  get lists() {
    return [householdId(getHearthRuntime()), 'lists'] as const;
  },
  get listSettings() {
    return [householdId(getHearthRuntime()), 'list-settings'] as const;
  },
  meals: (startDate = getHearthRuntime().weekStart) =>
    [householdId(getHearthRuntime()), 'meals', startDate] as const,
  get savedMealLibrary() {
    return [householdId(getHearthRuntime()), 'saved-meal-library'] as const;
  },
  get pocketMoneyRoot() {
    return [householdId(getHearthRuntime()), 'pocket-money'] as const;
  },
  pocketMoney: (
    weekStart = getHearthRuntime().weekStart,
    asOfDate = getHearthRuntime().localDate,
  ) => [...queryKeys.pocketMoneyRoot, weekStart, asOfDate] as const,
  get choreTemplates() {
    return [householdId(getHearthRuntime()), 'chore-templates'] as const;
  },
  choreOccurrence: (occurrenceId: string) =>
    [householdId(getHearthRuntime()), 'chore-occurrence', occurrenceId] as const,
};
