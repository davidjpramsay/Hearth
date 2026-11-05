import { Link, useLocation, useNavigate, type LinkProps } from 'react-router-dom';

const settingsTitles: Record<string, string> = {
  '/more': 'More',
  '/credits': 'Credits',
  '/admin': 'Hearth settings',
  '/admin/household': 'Household',
  '/admin/people': 'People',
  '/admin/today': 'Today & notices',
  '/admin/photos': 'Manage photos',
  '/admin/planning': 'Family planning',
  '/admin/routines': 'Routines and chores',
  '/admin/fitness': 'Fitness',
  '/admin/morning-routine': 'Morning Routine',
  '/admin/afternoon-routine': 'Afternoon Routine',
  '/admin/chore-day': 'Chores this week',
  '/admin/pocket-money': 'Pocket money',
  '/admin/lists': 'Household lists',
  '/admin/meals': 'Meal planning',
  '/admin/connections': 'Connections',
  '/admin/connections/calendar': 'Calendar',
  '/admin/connections/home-assistant': 'Home Assistant',
  '/admin/televisions': 'Phones & screens',
  '/admin/access': 'Adult access',
  '/admin/system': 'System health',
  '/admin/activity': 'Recent activity',
  '/appearance': 'Appearance',
};

/** Remember only a known local settings opener, never arbitrary URLs or form data. */
export function SettingsLink(props: Omit<LinkProps, 'state' | 'replace'>) {
  const { pathname } = useLocation();
  const destination = typeof props.to === 'string' ? props.to.split(/[?#]/)[0] : props.to.pathname;
  const rememberOpener =
    Object.hasOwn(settingsTitles, pathname) &&
    destination !== undefined &&
    destination !== pathname &&
    destination !== '/more' &&
    Object.hasOwn(settingsTitles, destination);
  return <Link {...props} state={rememberOpener ? { settingsReturnTo: pathname } : undefined} />;
}

export function SettingsBackLink({
  fallbackTo,
  fallbackLabel,
  onClick,
  ...props
}: Omit<LinkProps, 'to' | 'state' | 'replace' | 'aria-label'> & {
  fallbackTo: string;
  fallbackLabel: string;
}) {
  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const opener = settingsOpener(state as unknown, pathname);
  return (
    <Link
      {...props}
      aria-label={opener === null ? fallbackLabel : `Back to ${settingsTitles[opener]}`}
      to={opener ?? fallbackTo}
      replace
      onClick={(event) => {
        onClick?.(event);
        if (
          opener === null ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          (props.target !== undefined && props.target !== '_self')
        )
          return;
        // Pop the actual entry, retaining its menu, query and focus memory. A
        // pushed Back link would otherwise leave a loop into the setting.
        event.preventDefault();
        void navigate(-1);
      }}
    />
  );
}

function settingsOpener(state: unknown, pathname: string): string | null {
  if (typeof state !== 'object' || state === null || !('settingsReturnTo' in state)) return null;
  const opener = state.settingsReturnTo;
  return typeof opener === 'string' && opener !== pathname && Object.hasOwn(settingsTitles, opener)
    ? opener
    : null;
}
