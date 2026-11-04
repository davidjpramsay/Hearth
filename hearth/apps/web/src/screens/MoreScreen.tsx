import './MoreScreen.css';

import type { IconName } from '../components/Icon';
import { SettingsMenu, SettingsMenuLink } from '../components/SettingsMenu';
import { useSharedScreen } from '../runtime/sharedScreen';
import { useModulePathAvailable, useModules } from '../modules/context';

interface MoreLink {
  title: string;
  icon: IconName;
  path: string;
}

const baseGroups: Array<{ title: string; links: MoreLink[] }> = [
  {
    title: 'Family',
    links: [
      { title: 'Fitness', icon: 'weights', path: '/fitness' },
      { title: 'Morning Routine', icon: 'sun', path: '/morning-routine' },
      { title: 'Reminders', icon: 'bell', path: '/reminders' },
      { title: 'Lists', icon: 'list', path: '/lists' },
      { title: 'Meals', icon: 'meal', path: '/meals' },
      { title: 'Home controls', icon: 'home', path: '/home' },
      {
        title: 'Photos',
        icon: 'image',
        path: '/photos',
      },
      { title: 'Connections', icon: 'games', path: '/games' },
      { title: 'NBA', icon: 'basketball', path: '/nba' },
    ],
  },
  {
    title: 'Manage Hearth',
    links: [
      { title: 'Modules', icon: 'leaf', path: '/admin/modules' },
      { title: 'NBA teams', icon: 'basketball', path: '/admin/nba' },
      { title: 'Fitness settings', icon: 'weights', path: '/admin/fitness' },
      { title: 'Morning Routine settings', icon: 'sun', path: '/admin/morning-routine' },
      {
        title: 'Manage photos',
        icon: 'image',
        path: '/admin/photos',
      },
      {
        title: 'Household details',
        icon: 'home',
        path: '/admin/household',
      },
      {
        title: 'People',
        icon: 'users',
        path: '/admin/people',
      },
      {
        title: 'Today screen & notices',
        icon: 'today',
        path: '/admin/today',
      },
      {
        title: 'Chores, routines & pocket money',
        icon: 'wallet',
        path: '/admin/planning',
      },
      {
        title: 'Connections',
        icon: 'link',
        path: '/admin/connections',
      },
      {
        title: 'Phones & screens',
        icon: 'television',
        path: '/admin/televisions',
      },
    ],
  },
  {
    title: 'This device',
    links: [
      {
        title: 'Appearance',
        icon: 'moon',
        path: '/appearance',
      },
    ],
  },
  {
    title: 'System',
    links: [
      {
        title: 'System health',
        icon: 'shield',
        path: '/admin/system',
      },
      {
        title: 'Recent activity',
        icon: 'list',
        path: '/admin/activity',
      },
      { title: 'Credits', icon: 'book-open', path: '/credits' },
    ],
  },
];

export function MoreScreen() {
  const modules = useModules();
  const available = useModulePathAvailable();
  const sharedScreen = useSharedScreen();
  const groups = baseGroups
    .map((group) => ({
      ...group,
      links: group.links
        .filter(
          (link) => available(link.path) && (!sharedScreen || !link.path.startsWith('/admin')),
        )
        .map((link) => ({
          ...link,
          title:
            link.path === '/admin/planning' && !modules.chores
              ? 'Family planning'
              : link.path === '/admin/today' && !modules.notices
                ? 'Today screen'
                : link.title,
        })),
    }))
    .filter((group) => group.links.length > 0);
  const flattened = groups.flatMap((group) => group.links);
  return (
    <div className="screen more-screen">
      <header className="more-screen__header">
        <h1>More</h1>
      </header>
      {groups.map((group) => (
        <section className="more-group" key={group.title}>
          <h2>{group.title}</h2>
          <SettingsMenu className="more-grid">
            {group.links.map((link) => {
              const index = flattened.findIndex((candidate) => candidate.path === link.path);
              const prior = flattened[index - 1];
              const next = flattened[index + 1];
              const focusId = moreFocusId(link);
              return (
                <SettingsMenuLink
                  className="more-card"
                  icon={link.icon}
                  iconClassName="more-card__icon"
                  label={link.title}
                  data-focus-entry={index === 0 ? 'true' : undefined}
                  data-focus-id={focusId}
                  data-focus-left="phone-tab-more"
                  data-focus-up={prior === undefined ? 'phone-tab-more' : moreFocusId(prior)}
                  data-focus-down={next === undefined ? focusId : moreFocusId(next)}
                  to={link.path}
                  key={link.title}
                />
              );
            })}
          </SettingsMenu>
        </section>
      ))}
    </div>
  );
}

function moreFocusId(link: MoreLink): string {
  return `more-${link.path.replaceAll('/', '-').replace(/^-/, '')}`;
}
