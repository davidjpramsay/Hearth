import { Link, Navigate, useLocation } from 'react-router-dom';
import { GAME_MODULE_LABELS, type GameModuleId } from '@hearth/shared';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGameModules } from '../modules/context';
import './GamesMenuScreen.css';

const choices: Array<{ id: GameModuleId; path: string; description: string }> = [
  { id: 'connections', path: '/games/connections', description: 'Find four groups of four words.' },
  {
    id: 'connectFour',
    path: '/games/connect-four',
    description: 'Two players. Four in a row. One more round?',
  },
  {
    id: 'wordGuess',
    path: '/games/word-guess',
    description: 'Find the five-letter word in six guesses.',
  },
];
export function GamesMenuScreen() {
  const { search } = useLocation();
  const enabled = useGameModules();
  if (new URLSearchParams(search).has('puzzle'))
    return (
      <Navigate
        replace
        to={{
          pathname: enabled.connections ? '/games/connections' : '/games',
          search: enabled.connections ? search : '',
        }}
      />
    );
  const available = choices.filter((game) => enabled[game.id]);
  return (
    <div className="screen games-menu-screen">
      <ScreenHeader title="Games" />
      <nav aria-label="Choose a game" className="games-choices">
        {available.map((game, index) => (
          <Link
            key={game.id}
            className="games-choice focusable"
            aria-label={GAME_MODULE_LABELS[game.id]}
            aria-describedby={`${game.id}-description`}
            to={game.path}
            state={{ fromGamesMenu: true }}
            data-focus-id={`games-${game.path.split('/').at(-1)}`}
            data-focus-entry={index === 0 ? 'true' : undefined}
            data-focus-left="nav-games"
          >
            <span className={`games-choice__icon games-choice__icon--${game.id}`}>
              {game.id === 'connectFour' ? (
                <span className="games-four-mark" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => (
                    <i key={n} />
                  ))}
                </span>
              ) : game.id === 'wordGuess' ? (
                <span className="games-word-mark" aria-hidden="true">
                  A
                </span>
              ) : (
                <Icon name="games" />
              )}
            </span>
            <span className="games-choice__copy">
              <strong>{GAME_MODULE_LABELS[game.id]}</strong>
              <span id={`${game.id}-description`}>{game.description}</span>
            </span>
            <Icon name="chevron-right" />
          </Link>
        ))}
      </nav>
      {available.length === 0 ? (
        <p className="games-empty">
          No games are turned on. An adult can choose games in More → Modules → Choose games.
        </p>
      ) : null}
    </div>
  );
}
