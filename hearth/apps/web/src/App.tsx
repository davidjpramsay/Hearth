import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

import { useAppearance } from './appearance/appearance';
import { AppShell } from './components/AppShell';
import { LoadingState } from './components/Status';
import { useRemoteNavigation } from './focus/useRemoteNavigation';
import { useScenario } from './hooks/useScenario';
import { useHostedReleaseRefresh } from './hooks/useHostedReleaseRefresh';
import { useRealtimeInvalidation } from './hooks/useRealtimeInvalidation';
import { useDraftNavigationGuard } from './hooks/useDraftNavigationGuard';
import { useScreenPresentation } from './hooks/useScreenPresentation';
import { TodayScreen } from './screens/TodayScreen';
import { useModulePathAvailable } from './modules/context';
import { normalizeModulePath } from '@hearth/shared';
const ConnectFourScreen = lazy(async () => ({
  default: (await import('./screens/ConnectFourScreen')).ConnectFourScreen,
}));
const GameModulesSettingsScreen = lazy(async () => ({
  default: (await import('./screens/GameModulesSettingsScreen')).GameModulesSettingsScreen,
}));
const ModulesSettingsScreen = lazy(async () => ({
  default: (await import('./screens/ModulesSettingsScreen')).ModulesSettingsScreen,
}));
const NbaScreen = lazy(async () => ({ default: (await import('./screens/NbaScreen')).NbaScreen }));
const CreditsScreen = lazy(async () => ({
  default: (await import('./screens/CreditsScreen')).CreditsScreen,
}));
const FitnessScreen = lazy(async () => ({
  default: (await import('./screens/FitnessScreen')).FitnessScreen,
}));
const FitnessLibraryScreen = lazy(async () => ({
  default: (await import('./screens/FitnessLibraryScreen')).FitnessLibraryScreen,
}));
const FitnessSettingsScreen = lazy(async () => ({
  default: (await import('./screens/FitnessSettingsScreen')).FitnessSettingsScreen,
}));
const MorningRoutineScreen = lazy(async () => ({
  default: (await import('./screens/MorningRoutineScreen')).MorningRoutineScreen,
}));
const MorningRoutineSettingsScreen = lazy(async () => ({
  default: (await import('./screens/MorningRoutineSettingsScreen')).MorningRoutineSettingsScreen,
}));
const NbaSettingsScreen = lazy(async () => ({
  default: (await import('./screens/NbaSettingsScreen')).NbaSettingsScreen,
}));
const IndoorSensorsSettingsScreen = lazy(async () => ({
  default: (await import('./screens/IndoorSensorsSettingsScreen')).IndoorSensorsSettingsScreen,
}));

const AdminAuthBoundary = lazy(async () => ({
  default: (await import('./auth/AdminAuthBoundary')).AdminAuthBoundary,
}));

const WeekScreen = lazy(async () => ({
  default: (await import('./screens/WeekScreen')).WeekScreen,
}));
const MonthScreen = lazy(async () => ({
  default: (await import('./screens/MonthScreen')).MonthScreen,
}));
const ChoresScreen = lazy(async () => ({
  default: (await import('./screens/ChoresScreen')).ChoresScreen,
}));
const ListsScreen = lazy(async () => ({
  default: (await import('./screens/ListsScreen')).ListsScreen,
}));
const MealsScreen = lazy(async () => ({
  default: (await import('./screens/MealsScreen')).MealsScreen,
}));
const HomeScreen = lazy(async () => ({
  default: (await import('./screens/HomeScreen')).HomeScreen,
}));
const PhotosScreen = lazy(async () => ({
  default: (await import('./screens/PhotosScreen')).PhotosScreen,
}));
const RemindersScreen = lazy(async () => ({
  default: (await import('./screens/RemindersScreen')).RemindersScreen,
}));
const WeatherScreen = lazy(async () => ({
  default: (await import('./screens/WeatherScreen')).WeatherScreen,
}));
const PairingScreen = lazy(async () => ({
  default: (await import('./screens/PairingScreen')).PairingScreen,
}));

const AgendaScreen = lazy(async () => ({
  default: (await import('./screens/AgendaScreen')).AgendaScreen,
}));
const MoreScreen = lazy(async () => ({
  default: (await import('./screens/MoreScreen')).MoreScreen,
}));
const GamesScreen = lazy(async () => ({
  default: (await import('./screens/GamesScreen')).GamesScreen,
}));
const GamesMenuScreen = lazy(async () => ({
  default: (await import('./screens/GamesMenuScreen')).GamesMenuScreen,
}));
const AdminScreen = lazy(async () => ({
  default: (await import('./screens/AdminScreen')).AdminScreen,
}));
const AppearanceSettingsScreen = lazy(async () => ({
  default: (await import('./screens/AppearanceSettingsScreen')).AppearanceSettingsScreen,
}));
const ConnectionsSettingsScreen = lazy(async () => ({
  default: (await import('./screens/ConnectionsSettingsScreen')).ConnectionsSettingsScreen,
}));
const GetStartedScreen = lazy(async () => ({
  default: (await import('./screens/GetStartedScreen')).GetStartedScreen,
}));
const CalendarConnectionSettingsScreen = lazy(async () => ({
  default: (await import('./screens/CalendarConnectionSettingsScreen'))
    .CalendarConnectionSettingsScreen,
}));
const HomeAssistantConnectionSettingsScreen = lazy(async () => ({
  default: (await import('./screens/HomeAssistantConnectionSettingsScreen'))
    .HomeAssistantConnectionSettingsScreen,
}));
const HouseholdSettingsScreen = lazy(async () => ({
  default: (await import('./screens/HouseholdSettingsScreen')).HouseholdSettingsScreen,
}));
const PlanningSettingsScreen = lazy(async () => ({
  default: (await import('./screens/PlanningSettingsScreen')).PlanningSettingsScreen,
}));
const ListsSettingsScreen = lazy(async () => ({
  default: (await import('./screens/ListsSettingsScreen')).ListsSettingsScreen,
}));
const MealsSettingsScreen = lazy(async () => ({
  default: (await import('./screens/MealsSettingsScreen')).MealsSettingsScreen,
}));
const PhotosSettingsScreen = lazy(async () => ({
  default: (await import('./screens/PhotosSettingsScreen')).PhotosSettingsScreen,
}));
const PeopleSettingsScreen = lazy(async () => ({
  default: (await import('./screens/PeopleSettingsScreen')).PeopleSettingsScreen,
}));
const AdultAccessScreen = lazy(async () => ({
  default: (await import('./screens/AdultAccessScreen')).AdultAccessScreen,
}));
const PocketMoneySettingsScreen = lazy(async () => ({
  default: (await import('./screens/PocketMoneySettingsScreen')).PocketMoneySettingsScreen,
}));
const RoutinesSettingsScreen = lazy(async () => ({
  default: (await import('./screens/RoutinesSettingsScreen')).RoutinesSettingsScreen,
}));
const ChoreDaySettingsScreen = lazy(async () => ({
  default: (await import('./screens/ChoreDaySettingsScreen')).ChoreDaySettingsScreen,
}));
const TelevisionsSettingsScreen = lazy(async () => ({
  default: (await import('./screens/TelevisionsSettingsScreen')).TelevisionsSettingsScreen,
}));
const TodaySettingsScreen = lazy(async () => ({
  default: (await import('./screens/TodaySettingsScreen')).TodaySettingsScreen,
}));
const SystemHealthScreen = lazy(async () => ({
  default: (await import('./screens/SystemHealthScreen')).SystemHealthScreen,
}));
const SystemActivityScreen = lazy(async () => ({
  default: (await import('./screens/SystemActivityScreen')).SystemActivityScreen,
}));

export function App() {
  const location = useLocation();
  const { preferences } = useAppearance();
  const { scenario, preparing, error } = useScenario();
  useHostedReleaseRefresh();
  useDraftNavigationGuard();
  useRealtimeInvalidation();
  const confirmPresentedPath = useScreenPresentation();
  const initialFocus =
    location.pathname === '/appearance'
      ? `appearance-${preferences.theme}`
      : /^\/calendar\/(week|month|agenda)$/.test(location.pathname)
        ? `calendar-view-${location.pathname.split('/').at(-1)}`
        : 'screen-entry';
  useRemoteNavigation(initialFocus);
  return (
    <AppShell>
      {error === null ? null : (
        <div className="bootstrap-error" role="alert">
          {error}
        </div>
      )}
      <Suspense fallback={<LoadingState />}>
        <ModuleRouteBoundary>
          <Routes>
            <Route
              path="/today"
              element={<TodayScreen preparing={preparing} scenario={scenario} />}
            />
            <Route path="/calendar" element={<Navigate replace to="/calendar/agenda" />} />
            <Route
              path="/calendar/week"
              element={<WeekScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/calendar/month"
              element={<MonthScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/calendar/agenda"
              element={<AgendaScreen preparing={preparing} scenario={scenario} />}
            />
            <Route path="/week" element={<LegacyCalendarRedirect view="week" />} />
            <Route path="/month" element={<LegacyCalendarRedirect view="month" />} />
            <Route
              path="/weather"
              element={<WeatherScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/chores"
              element={<ChoresScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/lists"
              element={<ListsScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/meals"
              element={<MealsScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/photos"
              element={<PhotosScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/reminders"
              element={<RemindersScreen preparing={preparing} scenario={scenario} />}
            />
            <Route
              path="/home"
              element={<HomeScreen preparing={preparing} scenario={scenario} />}
            />
            <Route path="/more" element={<MoreScreen />} />
            <Route path="/credits" element={<CreditsScreen />} />
            <Route path="/games" element={<GamesMenuScreen />} />
            <Route path="/games/connections" element={<GamesScreen />} />
            <Route path="/games/connect-four" element={<ConnectFourScreen />} />
            <Route path="/nba" element={<NbaScreen />} />
            <Route path="/fitness" element={<FitnessScreen />} />
            <Route path="/morning-routine" element={<MorningRoutineScreen />} />
            <Route path="/appearance" element={<AppearanceSettingsScreen />} />
            <Route path="/admin/appearance" element={<Navigate replace to="/appearance" />} />
            <Route
              element={
                <AdminAuthBoundary>
                  <Outlet />
                </AdminAuthBoundary>
              }
            >
              <Route path="/admin" element={<AdminScreen />} />
              <Route path="/admin/get-started" element={<GetStartedScreen />} />
              <Route path="/admin/modules" element={<ModulesSettingsScreen />} />
              <Route path="/admin/modules/games" element={<GameModulesSettingsScreen />} />
              <Route path="/admin/nba" element={<NbaSettingsScreen />} />
              <Route
                path="/admin/connections/indoor-sensors"
                element={<IndoorSensorsSettingsScreen />}
              />
              <Route path="/admin/fitness" element={<FitnessSettingsScreen />} />
              <Route path="/admin/fitness/exercises" element={<FitnessLibraryScreen />} />
              <Route path="/admin/morning-routine" element={<MorningRoutineSettingsScreen />} />
              <Route path="/admin/household" element={<HouseholdSettingsScreen />} />
              <Route path="/admin/people" element={<PeopleSettingsScreen />} />
              <Route path="/admin/access" element={<AdultAccessScreen />} />
              <Route path="/admin/today" element={<TodaySettingsScreen />} />
              <Route path="/admin/televisions" element={<TelevisionsSettingsScreen />} />
              <Route path="/admin/connections" element={<ConnectionsSettingsScreen />} />
              <Route
                path="/admin/connections/calendar"
                element={<CalendarConnectionSettingsScreen />}
              />
              <Route
                path="/admin/connections/home-assistant"
                element={<HomeAssistantConnectionSettingsScreen />}
              />
              <Route path="/admin/planning" element={<PlanningSettingsScreen />} />
              <Route path="/admin/lists" element={<ListsSettingsScreen />} />
              <Route path="/admin/meals" element={<MealsSettingsScreen />} />
              <Route path="/admin/photos" element={<PhotosSettingsScreen />} />
              <Route path="/admin/routines" element={<RoutinesSettingsScreen />} />
              <Route path="/admin/chore-day" element={<ChoreDaySettingsScreen />} />
              <Route path="/admin/pocket-money" element={<PocketMoneySettingsScreen />} />
              <Route path="/admin/system" element={<SystemHealthScreen />} />
              <Route path="/admin/activity" element={<SystemActivityScreen />} />
              <Route
                path="/admin/rewards"
                element={<Navigate replace to="/admin/pocket-money" />}
              />
            </Route>
            <Route path="/pair" element={<PairingScreen />} />
            <Route path="*" element={<Navigate replace to="/today" />} />
          </Routes>
          <PresentedRouteObserver onPresented={confirmPresentedPath} />
        </ModuleRouteBoundary>
      </Suspense>
    </AppShell>
  );
}

function ModuleRouteBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const allowed = useModulePathAvailable();
  return allowed(pathname) ? (
    children
  ) : (
    <Navigate
      replace
      to={
        normalizeModulePath(pathname).startsWith('/admin/')
          ? '/admin/modules'
          : pathname.startsWith('/games/')
            ? '/games'
            : '/today'
      }
    />
  );
}

// Inside Suspense: a lazy route must commit before a navigation can be acknowledged.
function PresentedRouteObserver({ onPresented }: { onPresented: (path: string) => void }) {
  const location = useLocation();
  useEffect(() => {
    onPresented(location.pathname);
  }, [location.key, location.pathname, onPresented]);
  return null;
}

function LegacyCalendarRedirect({ view }: { view: 'week' | 'month' }) {
  const { search } = useLocation();
  return <Navigate replace to={{ pathname: `/calendar/${view}`, search }} />;
}
