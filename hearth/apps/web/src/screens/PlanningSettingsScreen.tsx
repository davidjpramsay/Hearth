import { AdminPage } from '../components/AdminPage';
import type { IconName } from '../components/Icon';
import { SettingsMenu, SettingsMenuLink } from '../components/SettingsMenu';
import { useModulePathAvailable } from '../modules/context';

const planningAreas: Array<{
  title: string;
  path: string;
  icon: IconName;
  focusId: string;
}> = [
  {
    title: 'Morning Routine',
    path: '/admin/morning-routine',
    icon: 'sun',
    focusId: 'planning-morning',
  },
  {
    title: 'Afternoon Routine',
    path: '/admin/afternoon-routine',
    icon: 'sunset',
    focusId: 'planning-afternoon',
  },
  {
    title: 'Routines and chores',
    path: '/admin/routines',
    icon: 'chores',
    focusId: 'planning-routines',
  },
  {
    title: 'Chores this week',
    path: '/admin/chore-day',
    icon: 'chores',
    focusId: 'planning-chore-day',
  },
  {
    title: 'Meals',
    path: '/admin/meals',
    icon: 'meal',
    focusId: 'planning-meals',
  },
  {
    title: 'Pocket money',
    path: '/admin/pocket-money',
    icon: 'wallet',
    focusId: 'planning-pocket-money',
  },
  {
    title: 'Household lists',
    path: '/admin/lists',
    icon: 'list',
    focusId: 'planning-lists',
  },
];

export function PlanningSettingsScreen() {
  const available = useModulePathAvailable();
  return (
    <AdminPage title="Family planning">
      <SettingsMenu className="planning-area-list">
        {planningAreas
          .filter((area) => available(area.path))
          .map((area, index) => (
            <SettingsMenuLink
              className="planning-area-card"
              icon={area.icon}
              label={area.title}
              data-focus-entry={index === 0 ? 'true' : undefined}
              data-focus-id={area.focusId}
              key={area.title}
              to={area.path}
            />
          ))}
      </SettingsMenu>
    </AdminPage>
  );
}
