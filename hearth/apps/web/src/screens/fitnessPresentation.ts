import type { FitnessWorkout } from '@hearth/shared';
import type { IconName } from '../components/Icon';
export function fitnessIcon(activity: FitnessWorkout['activity']): IconName {
  return activity === 'class' ? 'fitness-class' : activity;
}
export function fitnessDate(date: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
export function fitnessTarget(workout: FitnessWorkout) {
  return [
    workout.durationMinutes !== null ? `${workout.durationMinutes} min` : null,
    workout.distanceKm !== null ? `${workout.distanceKm} km` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
