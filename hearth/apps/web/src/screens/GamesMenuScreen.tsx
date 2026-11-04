import { Link, Navigate, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import './GamesMenuScreen.css';

export function GamesMenuScreen() {
  const { search } = useLocation();
  // Previously shared puzzle links keep opening their selected board.
  if (new URLSearchParams(search).has('puzzle'))
    return <Navigate replace to={{ pathname: '/games/connections', search }} />;
  return (
    <div className="screen games-menu-screen">
      <ScreenHeader title="Games" />
      <nav aria-label="Choose a game">
        <Link
          className="games-choice focusable"
          aria-label="Connections"
          aria-describedby="connections-description"
          to="/games/connections"
          state={{ fromGamesMenu: true }}
          data-focus-id="games-connections"
          data-focus-entry="true"
          data-focus-left="nav-games"
        >
          <span className="games-choice__icon">
            <Icon name="games" />
          </span>
          <span className="games-choice__copy">
            <strong>Connections</strong>
            <span id="connections-description">Find four groups of four words.</span>
          </span>
          <Icon name="chevron-right" />
        </Link>
      </nav>
    </div>
  );
}
