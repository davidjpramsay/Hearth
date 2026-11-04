import { useHouseholdDateTime } from '../hooks/useHouseholdClock';

export function HouseholdDateTime({ placement }: { placement: 'rail' | 'mobile' | 'companion' }) {
  const householdDateTime = useHouseholdDateTime();
  return (
    <div
      role={placement === 'rail' ? undefined : 'region'}
      aria-label={`${householdDateTime.date}, ${householdDateTime.time}`}
      className={`household-date-time household-date-time--${placement}`}
    >
      <time className="household-date-time__time" dateTime={householdDateTime.instant}>
        {householdDateTime.time}
      </time>
      <time className="household-date-time__date" dateTime={householdDateTime.instant}>
        {householdDateTime.date}
      </time>
    </div>
  );
}
