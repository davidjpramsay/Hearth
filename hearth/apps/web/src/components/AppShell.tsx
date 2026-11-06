import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useAppearance } from '../appearance/appearance';
import { HouseholdClockProvider } from '../hooks/useHouseholdClock';
import { usePhoneKeyboardOpen } from '../hooks/usePhoneKeyboardOpen';
import { useHearthRuntime } from '../runtime/context';
import { useSharedScreen } from '../runtime/sharedScreen';
import { HouseholdDateTime } from './HouseholdDateTime';
import { Icon, type IconName } from './Icon';
import { SettingsLink } from './SettingsNavigation';
import { useModulePathAvailable } from '../modules/context';

interface NavigationItem {
  focusKey?: string;
  label: string;
  path: string;
  icon: IconName;
  enabled: boolean;
}

interface AdminNavigationItem {
  label: string;
  path: string;
  icon: IconName;
  matches?: string[];
}

const baseNavigation: NavigationItem[] = [
  { label: 'Today', path: '/today', icon: 'today', enabled: true },
  { label: 'Fitness', path: '/fitness', icon: 'weights', enabled: true },
  { label: 'Morning', path: '/morning-routine', icon: 'sun', enabled: true },
  { label: 'Afternoon', path: '/afternoon-routine', icon: 'sunset', enabled: true },
  { label: 'Calendar', path: '/calendar/agenda', icon: 'calendar', enabled: true },
  { label: 'Weather', path: '/weather', icon: 'cloud-sun', enabled: true },
  { label: 'Reminders', path: '/reminders', icon: 'bell', enabled: true },
  { label: 'Chores', path: '/chores', icon: 'chores', enabled: true },
  { label: 'Lists', path: '/lists', icon: 'list', enabled: true },
  { label: 'Meals', path: '/meals', icon: 'meal', enabled: true },
  { label: 'Home', path: '/home', icon: 'home', enabled: true },
  { label: 'Photos', path: '/photos', icon: 'image', enabled: true },
  { label: 'Games', path: '/games', icon: 'games', enabled: true, focusKey: 'games' },
  { label: 'NBA', path: '/nba', icon: 'basketball', enabled: true },
];

const phoneNavigation = baseNavigation.filter((item) =>
  ['Today', 'Calendar', 'Weather', 'Chores'].includes(item.label),
);

const adminNavigationGroups: Array<{ label: string; items: AdminNavigationItem[] }> = [
  {
    label: 'Content',
    items: [
      { label: 'Overview', path: '/admin', icon: 'leaf' },
      { label: 'Modules', path: '/admin/modules', icon: 'leaf' },
      { label: 'Today', path: '/admin/today', icon: 'today' },
      { label: 'Photos', path: '/admin/photos', icon: 'image' },
      { label: 'NBA teams', path: '/admin/nba', icon: 'basketball' },
      { label: 'Fitness', path: '/admin/fitness', icon: 'weights' },
      { label: 'Morning Routine', path: '/admin/morning-routine', icon: 'sun' },
      { label: 'Afternoon Routine', path: '/admin/afternoon-routine', icon: 'sunset' },
      {
        label: 'Planning',
        path: '/admin/planning',
        icon: 'wallet',
        matches: [
          '/admin/routines',
          '/admin/chore-day',
          '/admin/pocket-money',
          '/admin/lists',
          '/admin/meals',
        ],
      },
    ],
  },
  {
    label: 'Household',
    items: [
      { label: 'Details', path: '/admin/household', icon: 'home' },
      { label: 'People', path: '/admin/people', icon: 'users' },
    ],
  },
  {
    label: 'Devices',
    items: [
      {
        label: 'Connections',
        path: '/admin/connections',
        icon: 'link',
        matches: ['/admin/connections/'],
      },
      {
        label: 'Phones & screens',
        path: '/admin/televisions',
        icon: 'television',
        matches: ['/admin/access'],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Health', path: '/admin/system', icon: 'shield' },
      { label: 'Activity', path: '/admin/activity', icon: 'list' },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <HouseholdClockProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </HouseholdClockProvider>
  );
}

function AppShellLayout({ children }: { children: ReactNode }) {
  const available = useModulePathAvailable();
  const { pathname } = useLocation();
  const { preferences } = useAppearance();
  const runtime = useHearthRuntime();
  const sharedScreen = useSharedScreen();
  const railNavigation = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = railNavigation.current;
    if (nav === null) return;
    const keepDestinationVisible = () => {
      if (nav.clientHeight === 0) return;
      const focused = document.activeElement;
      const target =
        focused instanceof HTMLElement && nav.contains(focused)
          ? focused
          : nav.querySelector<HTMLElement>('.rail-item--active');
      if (target === null) return;
      const bounds = nav.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const scale = bounds.height / nav.clientHeight;
      const inset = 4 * scale;
      // Scroll this region only, never the shell/content or household clock.
      // Rectangles are physical pixels; scrollTop stays logical under 4K zoom.
      if (item.top < bounds.top + inset) {
        nav.scrollTop -= (bounds.top + inset - item.top) / scale;
      } else if (item.bottom > bounds.bottom - inset) {
        nav.scrollTop += (item.bottom - bounds.bottom + inset) / scale;
      }
    };
    keepDestinationVisible();
    nav.addEventListener('focusin', keepDestinationVisible);
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', keepDestinationVisible);
      return () => {
        nav.removeEventListener('focusin', keepDestinationVisible);
        window.removeEventListener('resize', keepDestinationVisible);
      };
    }
    const observer = new ResizeObserver(keepDestinationVisible);
    observer.observe(nav);
    return () => {
      nav.removeEventListener('focusin', keepDestinationVisible);
      observer.disconnect();
    };
  }, [pathname]);
  const navigation = baseNavigation.filter((item) => available(item.path));
  if (pathname === '/pair') {
    return (
      <main className="pair-shell" id="main-content">
        {children}
      </main>
    );
  }
  if (pathname.startsWith('/admin') && !sharedScreen) {
    return (
      <div className="companion-shell companion-shell--admin">
        <AdminDesktopNavigation pathname={pathname} />
        <div className="companion-main">
          <HouseholdDateTime placement="companion" />
          <main className="companion-content" id="main-content">
            {children}
          </main>
        </div>
        <PhoneNavigation />
      </div>
    );
  }
  return (
    <div className="app-shell">
      <aside className="tv-rail" aria-label="Primary navigation" data-focus-navigation="rail">
        <HouseholdDateTime placement="rail" />
        <nav className="tv-rail__nav" ref={railNavigation}>
          {navigation.map((item, index) => (
            <RailItem
              item={item}
              index={index}
              key={item.label}
              navigation={navigation}
              pathname={pathname}
            />
          ))}
        </nav>
        <div className="tv-rail__footer">
          <NavLink
            aria-label="Appearance settings"
            className="rail-appearance focusable"
            data-focus-down="nav-appearance"
            data-focus-id="nav-appearance"
            data-focus-left="nav-appearance"
            data-focus-right={`appearance-${preferences.theme}`}
            data-focus-up={`nav-${navigationKey(navigation.at(-1))}`}
            to="/appearance"
          >
            <Icon name="moon" />
            <span>Appearance</span>
          </NavLink>
          <div className="tv-rail__status">
            <span className="connection-dot" /> {runtime.household?.name}
          </div>
        </div>
      </aside>
      <HouseholdDateTime placement="mobile" />
      <main className="app-content" id="main-content">
        {children}
      </main>
      <PhoneNavigation />
    </div>
  );
}

function AdminDesktopNavigation({ pathname }: { pathname: string }) {
  const available = useModulePathAvailable();
  const groups = adminNavigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => available(item.path)) }))
    .filter((group) => group.items.length > 0);
  return (
    <aside className="admin-desktop-rail" aria-label="Administration" data-focus-navigation="rail">
      <NavLink className="admin-desktop-brand" to="/admin">
        <img alt="" src="/brand/hearth-mark.png" />
        <span>
          <strong>Hearth</strong>
          <small>Admin</small>
        </span>
      </NavLink>
      <nav className="admin-desktop-nav">
        {groups.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            {group.items.map((item) => {
              const active = isAdminNavigationActive(pathname, item);
              return (
                <SettingsLink
                  aria-current={active ? 'page' : undefined}
                  className={`admin-desktop-link${active ? ' admin-desktop-link--active' : ''}`}
                  key={item.path}
                  to={item.path}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </SettingsLink>
              );
            })}
          </section>
        ))}
      </nav>
      <NavLink className="admin-desktop-exit" to="/today">
        <Icon name="chevron-left" />
        <span>Family dashboard</span>
      </NavLink>
    </aside>
  );
}

function isAdminNavigationActive(pathname: string, item: AdminNavigationItem): boolean {
  if (item.path === '/admin') return pathname === item.path;
  if (pathname === item.path) return true;
  return item.matches?.some((match) => pathname.startsWith(match)) ?? false;
}

function PhoneNavigation() {
  const available = useModulePathAvailable();
  const navigation = phoneNavigation.filter((item) => available(item.path));
  const { pathname } = useLocation();
  const keyboardOpen = usePhoneKeyboardOpen();
  const moreActive =
    pathname === '/more' ||
    pathname === '/credits' ||
    pathname === '/appearance' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/games/') ||
    [
      '/lists',
      '/meals',
      '/home',
      '/photos',
      '/reminders',
      '/games',
      '/nba',
      '/fitness',
      '/morning-routine',
      '/afternoon-routine',
    ].includes(pathname);
  return (
    <nav
      className="phone-tabs"
      style={{ gridTemplateColumns: `repeat(${navigation.length + 1}, minmax(0, 1fr))` }}
      aria-label="Primary navigation"
      data-focus-navigation="dock"
      hidden={keyboardOpen}
    >
      {navigation.map((item, index) => (
        <PhoneTab
          item={item}
          index={index}
          pathname={pathname}
          navigation={navigation}
          key={item.label}
        />
      ))}
      <NavLink
        className={`phone-tab${moreActive ? ' phone-tab--active' : ''}`}
        data-focus-id="phone-tab-more"
        data-focus-left={`phone-tab-${navigationKey(navigation.at(-1))}`}
        data-focus-right="phone-tab-more"
        to="/more"
      >
        <Icon name="more" />
        <span>More</span>
      </NavLink>
    </nav>
  );
}

// Keep focus restoration stable when a visible menu name changes.
function navigationKey(item: NavigationItem | undefined): string {
  return item?.focusKey ?? item?.label.toLowerCase() ?? 'today';
}

function RailItem({
  item,
  index,
  pathname,
  navigation,
}: {
  item: NavigationItem;
  index: number;
  pathname: string;
  navigation: NavigationItem[];
}) {
  const prior = navigation.slice(0, index).findLast((candidate) => candidate.enabled);
  const next = navigation.slice(index + 1).find((candidate) => candidate.enabled);
  const focusId = `nav-${navigationKey(item)}`;
  const className = `rail-item focusable${item.enabled ? '' : ' rail-item--future'}`;
  const attrs = {
    'data-focus-id': focusId,
    'data-focus-up': prior === undefined ? focusId : `nav-${navigationKey(prior)}`,
    'data-focus-down': next === undefined ? 'nav-appearance' : `nav-${navigationKey(next)}`,
    'data-focus-right': 'screen-entry',
  };
  if (!item.enabled) {
    return (
      <div
        aria-label={`${item.label}, planned for a later phase`}
        className="rail-item rail-item--future"
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
        <span className="rail-item__status">Later</span>
      </div>
    );
  }
  return (
    <NavLink
      {...attrs}
      className={({ isActive }) => {
        const sectionActive =
          isActive || (item.label === 'Calendar' && pathname.startsWith('/calendar/'));
        return `${className}${sectionActive ? ' rail-item--active' : ''}`;
      }}
      to={item.path}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function PhoneTab({
  item,
  index,
  pathname,
  navigation,
}: {
  item: NavigationItem;
  index: number;
  pathname: string;
  navigation: NavigationItem[];
}) {
  const sectionActive =
    pathname === item.path || (item.label === 'Calendar' && pathname.startsWith('/calendar/'));
  return (
    <NavLink
      className={`phone-tab${sectionActive ? ' phone-tab--active' : ''}`}
      data-focus-id={`phone-tab-${item.label.toLowerCase()}`}
      data-focus-left={
        index === 0 ? 'phone-tab-today' : `phone-tab-${navigation[index - 1]?.label.toLowerCase()}`
      }
      data-focus-right={
        index === navigation.length - 1
          ? 'phone-tab-more'
          : `phone-tab-${navigation[index + 1]?.label.toLowerCase()}`
      }
      to={item.path}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  );
}
