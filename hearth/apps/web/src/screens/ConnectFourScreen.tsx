import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  connectFourBoard,
  connectFourLanding,
  dropConnectFour,
  newConnectFourRound,
  restoreConnectFour,
  type ConnectFourRound,
} from '@hearth/core';
import { getHearthRuntime, householdId } from '../api/core';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import './ConnectFourScreen.css';

export function ConnectFourScreen() {
  const runtime = getHearthRuntime();
  const home = `${runtime.mode}.${householdId(runtime)}`;
  return <ConnectFourGame key={home} storageKey={`hearth.connect-four.v1.${home}`} />;
}
function ConnectFourGame({ storageKey }: { storageKey: string }) {
  const [round, setRound] = useState<ConnectFourRound>(() => {
    try {
      const value = localStorage.getItem(storageKey);
      return value && value.length <= 2048
        ? (restoreConnectFour(JSON.parse(value)) ?? newConnectFourRound())
        : newConnectFourRound();
    } catch {
      return newConnectFourRound();
    }
  });
  const [storageFailed, setStorageFailed] = useState(false);
  const [column, setColumn] = useState(3);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const board = connectFourBoard(round);
  const finished = board.winner !== null || board.draw;
  const lastColumn = round.moves.at(-1);
  const lastCell =
    lastColumn === undefined
      ? -1
      : board.cells.findIndex((cell, index) => cell !== null && index % 7 === lastColumn);
  const landing = finished ? null : connectFourLanding(board, column);
  const status = board.winner
    ? `Player ${board.winner} wins!`
    : board.draw
      ? 'A draw. Well played!'
      : `Player ${board.player}’s turn`;
  function save(next: ConnectFourRound) {
    setRound(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }
  function choose(change: number) {
    setColumn((current) => (current + change + 7) % 7);
    setError('');
  }
  function drop() {
    if (finished) return;
    try {
      save(dropConnectFour(round, column));
      setError('');
    } catch {
      setError('That column is full. Choose another.');
    }
  }
  function keys(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      choose(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  function restart() {
    save(newConnectFourRound(round.firstPlayer === 1 ? 2 : 1));
    setColumn(3);
    setError('');
    setConfirm(false);
  }
  return (
    <div className="screen connect-four-screen">
      <ScreenHeader
        title="Connect Four"
        meta="Two players · same screen"
        actions={
          <Link
            className="button focusable"
            to="/games"
            aria-label="Back to Games"
            data-page-back="true"
            data-focus-id="four-back"
            onClick={(event) => {
              event.preventDefault();
              if (location.state?.fromGamesMenu === true) navigate(-1);
              else navigate('/games', { replace: true });
            }}
          >
            <Icon name="chevron-left" />
            Games
          </Link>
        }
      />
      <div className={`four-game four-game--player-${board.player}`}>
        <div className="four-players" aria-hidden="true">
          {([1, 2] as const).map((player) => (
            <span
              key={player}
              className={`four-player four-player--${player} ${board.player === player ? 'four-player--active' : ''}`}
            >
              <b>{player}</b>
              <span>
                {board.winner === player
                  ? 'Winner!'
                  : !finished && board.player === player
                    ? `Player ${player}’s turn`
                    : `Player ${player}`}
              </span>
            </span>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {status}
          {error ? `. ${error}` : ''}{' '}
          {round.moves.length
            ? `${round.moves.length} counters played.`
            : 'Choose a column and drop a counter.'}
        </p>
        <div className="four-board-wrap">
          <div
            className="four-column-marker"
            style={{ '--column': column } as CSSProperties}
            aria-hidden="true"
          >
            <span>↓</span>
          </div>
          <div
            className="four-board"
            role="img"
            aria-label={`Connect Four board. ${status}. ${round.moves.length} counters played. Selected column ${column + 1}.`}
          >
            {board.cells.map((player, index) => (
              <span
                key={index}
                className={`four-cell ${player ? `four-cell--${player}` : ''} ${landing === index ? 'four-cell--preview' : ''} ${board.winningCells.includes(index) ? 'four-cell--winner' : ''} ${index === lastCell ? 'four-cell--last' : ''}`}
                aria-hidden="true"
              >
                {player ?? (landing === index ? board.player : '')}
              </span>
            ))}
          </div>
          <details className="four-board-description">
            <summary>Read board</summary>
            <ol>
              {Array.from({ length: 6 }, (_, row) => (
                <li key={row}>
                  Row {row + 1}:{' '}
                  {board.cells
                    .slice(row * 7, row * 7 + 7)
                    .map((player) => (player ? `Player ${player}` : 'empty'))
                    .join(', ')}
                </li>
              ))}
            </ol>
          </details>
        </div>
        <div className="four-controls">
          <button
            type="button"
            className="four-direction button focusable"
            aria-label="Previous column"
            data-focus-id="four-previous"
            data-focus-left="nav-games"
            onClick={() => choose(-1)}
          >
            <Icon name="chevron-left" />
          </button>
          <button
            type="button"
            className="four-drop focusable"
            data-focus-id="four-drop"
            data-focus-entry="true"
            data-focus-up="four-back"
            data-focus-down="four-new"
            aria-disabled={finished || undefined}
            onKeyDown={keys}
            onClick={drop}
          >
            {finished ? status : `Drop in column ${column + 1}`}
          </button>
          <button
            type="button"
            className="four-direction button focusable"
            aria-label="Next column"
            data-focus-id="four-next"
            onClick={() => choose(1)}
          >
            <Icon name="chevron-right" />
          </button>
        </div>
        <div className="four-footer">
          <button
            type="button"
            className="button focusable four-new"
            data-focus-id="four-new"
            data-focus-up="four-drop"
            onClick={() => (round.moves.length && !finished ? setConfirm(true) : restart())}
          >
            New round
          </button>
          <p>
            {error || (finished ? 'New round swaps who starts.' : '← → choose · OK drop · ↑ Games')}
          </p>
          {storageFailed ? <p role="status">This round can’t be saved on this device.</p> : null}
        </div>
      </div>
      {confirm ? <NewRoundDialog onClose={() => setConfirm(false)} onConfirm={restart} /> : null}
    </div>
  );
}

function NewRoundDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    close.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <div
      className="event-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="four-confirm-title"
    >
      <div className="event-detail__panel">
        <header>
          <h2 id="four-confirm-title">Start a new round?</h2>
          <button
            ref={close}
            className="button focusable"
            data-focus-id="four-cancel"
            data-back-dismiss="true"
            onClick={onClose}
          >
            Keep playing
          </button>
        </header>
        <p>This clears the current round on this screen.</p>
        <button
          className="button button--primary focusable"
          data-focus-id="four-confirm"
          onClick={onConfirm}
        >
          Start new round
        </button>
      </div>
    </div>
  );
}
