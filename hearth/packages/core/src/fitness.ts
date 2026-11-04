import { FITNESS_DAYS, type FitnessPlanVersion, type FitnessProgress } from '@hearth/shared';
import { addLocalDays } from './calendar.js';

export function fitnessPlanForDate(plans: FitnessPlanVersion[], date: string) {
  return plans
    .filter((p) => p.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.revision - a.revision)[0];
}
export function fitnessWorkouts(plans: FitnessPlanVersion[], memberId: string, date: string) {
  const plan = fitnessPlanForDate(plans, date);
  if (!plan?.configuration.selectedMemberIds.includes(memberId)) return [];
  const day = FITNESS_DAYS[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7]!;
  const person = plan.configuration.plans.find((p) => p.memberId === memberId);
  return (
    person?.workouts.filter(
      (w) =>
        w.days.includes(day) &&
        (w.goalId == null || person.goals.some((g) => g.id === w.goalId && !g.achieved)),
    ) ?? []
  );
}
/** Checks only seven candidate days per effective period, not every day in years of history. */
function hasScheduledDay(
  plans: FitnessPlanVersion[],
  member: string,
  after: string,
  through: string,
) {
  if (after >= through) return false;
  const ordered = [...plans].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  for (let i = 0; i < ordered.length; i++) {
    const plan = ordered[i]!;
    const start = plan.effectiveFrom > after ? plan.effectiveFrom : addLocalDays(after, 1);
    const end = ordered[i + 1] ? addLocalDays(ordered[i + 1]!.effectiveFrom, -1) : through;
    for (let offset = 0; offset < 7; offset++) {
      const date = addLocalDays(start, offset);
      if (date > end || date > through) break;
      if (fitnessWorkouts([plan], member, date).length) return true;
    }
  }
  return false;
}
export function fitnessStreak(
  plans: FitnessPlanVersion[],
  progress: FitnessProgress[],
  member: string,
  today: string,
) {
  const days = new Map<string, Set<string>>();
  for (const row of progress)
    if (row.memberId === member && row.isCompleted && row.localDate <= today) {
      const ids = days.get(row.localDate) ?? new Set<string>();
      ids.add(row.workoutId);
      days.set(row.localDate, ids);
    }
  let current = 0,
    best = 0,
    previous: string | null = null;
  for (const date of [...days.keys()].sort()) {
    const workouts = fitnessWorkouts(plans, member, date);
    if (!workouts.length || !workouts.every((w) => days.get(date)!.has(w.id))) continue;
    current =
      previous !== null && !hasScheduledDay(plans, member, previous, addLocalDays(date, -1))
        ? current + 1
        : 1;
    best = Math.max(best, current);
    previous = date;
  }
  if (previous !== null && hasScheduledDay(plans, member, previous, addLocalDays(today, -1)))
    current = 0;
  return { current, best };
}
