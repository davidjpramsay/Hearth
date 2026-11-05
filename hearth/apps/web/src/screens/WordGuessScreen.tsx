import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WordGuessCatalogueSchema, type WordGuessSnapshot } from '@hearth/shared';
import {
  appendWordGuess,
  newWordGuessRound,
  restoreWordGuessRound,
  scoreWordGuess,
  wordGuessStatus,
  type WordGuessMark,
  type WordGuessRound,
} from '@hearth/core';
import { getHearthRuntime, householdApiBase, householdId, request } from '../api/core';
import { ScreenHeader } from '../components/ScreenHeader';
import { FailureState, LoadingState } from '../components/Status';
import { Icon } from '../components/Icon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { focusById } from '../focus/focusGraph';
import './WordGuessScreen.css';
const keyboard = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const markLabels = {
  exact: 'correct spot',
  present: 'elsewhere in the word',
  absent: 'not in the word',
};
const symbols = { exact: '✓', present: '↔', absent: '−' };
function WordGuessHeader() {
  const location = useLocation(),
    navigate = useNavigate();
  return (
    <ScreenHeader
      title="Word Guess"
      meta="Five letters. Six chances."
      actions={
        <Link
          className="button focusable"
          to="/games"
          aria-label="Back to Games"
          data-page-back="true"
          data-focus-id="word-back"
          onClick={(e) => {
            e.preventDefault();
            if (location.state?.fromGamesMenu === true) navigate(-1);
            else navigate('/games', { replace: true });
          }}
        >
          <Icon name="chevron-left" />
          Games
        </Link>
      }
    />
  );
}
export function WordGuessScreen() {
  const runtime = getHearthRuntime();
  const home = `${runtime.mode}.${householdId(runtime)}`;
  const query = useQuery({
    queryKey: [householdId(runtime), 'word-guess'],
    queryFn: ({ signal }) =>
      request(`${householdApiBase()}/games/word-guess`, WordGuessCatalogueSchema, { signal }),
    retry: false,
  });
  if (!query.data)
    return query.isError ? <FailureState onRetry={() => void query.refetch()} /> : <LoadingState />;
  if (!query.data.snapshot)
    return (
      <section className="screen word-guess-screen">
        <WordGuessHeader />
        <div className="word-empty">
          <h2>
            {query.data.status === 'unconfigured'
              ? 'Your words are waiting'
              : 'Could not read the word list'}
          </h2>
          <p>
            {query.data.status === 'unconfigured'
              ? 'Ask an adult to add a private word list to Hearth.'
              : 'Your saved progress is kept. Try again when the word list is ready.'}
          </p>
          <button
            className="button focusable"
            data-focus-entry="true"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      </section>
    );
  return (
    <WordGuessGame
      key={`${home}.${query.data.snapshot.id}`}
      snapshot={query.data.snapshot}
      storageKey={`hearth.word-guess.v1.${home}`}
      stale={query.isError || query.data.status === 'stale'}
      refresh={() => void query.refetch()}
    />
  );
}
function WordGuessGame({
  snapshot,
  storageKey,
  stale,
  refresh,
}: {
  snapshot: WordGuessSnapshot;
  storageKey: string;
  stale: boolean;
  refresh: () => void;
}) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return {
        round:
          raw && raw.length <= 2048
            ? (restoreWordGuessRound(JSON.parse(raw), snapshot) ?? newWordGuessRound(snapshot))
            : newWordGuessRound(snapshot),
        failed: false,
      };
    } catch {
      return { round: newWordGuessRound(snapshot), failed: true };
    }
  });
  const [round, setRound] = useState(initial.round),
    [storageFailed, setStorageFailed] = useState(initial.failed),
    [message, setMessage] = useState(''),
    [confirm, setConfirm] = useState(false);
  const allowed = useMemo(() => new Set(snapshot.allowedGuesses), [snapshot]);
  const online = useOnlineStatus();
  const answer = snapshot.answers[round.index]!;
  const status = wordGuessStatus(answer, round.guesses),
    finished = status !== 'playing';
  const first = useRef<HTMLButtonElement>(null),
    submit = useRef<HTMLButtonElement>(null),
    next = useRef<HTMLButtonElement>(null);
  const known = new Map<string, WordGuessMark>();
  const ranks = { absent: 0, present: 1, exact: 2 };
  for (const guess of round.guesses)
    scoreWordGuess(answer, guess).forEach((mark, i) => {
      const letter = guess[i]!;
      if (!known.has(letter) || ranks[mark] > ranks[known.get(letter)!]) known.set(letter, mark);
    });
  function save(value: WordGuessRound) {
    setRound(value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }
  function add(letter: string) {
    if (!finished && round.draft.length < 5) {
      save({ ...round, draft: round.draft + letter });
      setMessage('');
    }
  }
  function erase() {
    if (!finished) {
      save({ ...round, draft: round.draft.slice(0, -1) });
      setMessage('');
    }
  }
  function guess() {
    if (finished) return;
    try {
      const guesses = appendWordGuess(answer, round.guesses, round.draft, allowed);
      save({ ...round, guesses, draft: '' });
      setMessage('');
      if (wordGuessStatus(answer, guesses) !== 'playing')
        requestAnimationFrame(() => next.current?.focus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Try another word.');
    }
  }
  function start(index: number) {
    save(newWordGuessRound(snapshot, index));
    setConfirm(false);
    setMessage('');
    requestAnimationFrame(() => first.current?.focus());
  }
  function physical(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || confirm || finished) return;
    if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      if (!event.repeat) add(event.key.toLowerCase());
      submit.current?.focus();
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      erase();
      submit.current?.focus();
    }
  }
  function moveLetter(event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || finished)
      return;
    const vertical = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    let target: string | undefined;
    if (vertical) {
      const adjacent = keyboard[row + vertical];
      if (adjacent) {
        // Staggered QWERTY rows can fall outside the shared spatial focus beam.
        // Follow the closest letter column rather than skipping straight to an action.
        const centered = column + (10 - keyboard[row]!.length) / 2;
        const nextColumn = Math.max(
          0,
          Math.min(adjacent.length - 1, Math.round(centered - (10 - adjacent.length) / 2)),
        );
        target = `word-key-${adjacent[nextColumn]}`;
      } else target = vertical < 0 ? 'word-back' : column < 3 ? 'word-delete' : 'word-submit';
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const nextColumn = column + (event.key === 'ArrowRight' ? 1 : -1);
      const letter = keyboard[row]![nextColumn];
      if (letter) target = `word-key-${letter}`;
      else if (event.key === 'ArrowRight') event.preventDefault();
      // Left at the keyboard edge remains the shared exit to the main menu.
    }
    if (target) {
      event.preventDefault();
      focusById(target);
    }
  }
  const feedback =
    status === 'won'
      ? `Nice work! ${answer.toUpperCase()} in ${round.guesses.length}.`
      : status === 'lost'
        ? `The word was ${answer.toUpperCase()}.`
        : message || `Guess ${round.guesses.length + 1} of 6`;
  return (
    <section className="screen word-guess-screen">
      <WordGuessHeader />
      {stale || !online ? (
        <p className="word-notice">
          {!online
            ? 'Offline — this loaded word list is still playable.'
            : 'Showing the last word list. Your round is kept.'}{' '}
          <button className="button focusable" onClick={refresh}>
            Refresh words
          </button>
        </p>
      ) : null}
      <div className="word-play">
        <div className="word-board-panel">
          <p className="word-number">
            Word {round.index + 1} <span>of {snapshot.answers.length}</span>
          </p>
          <ol className="word-board" aria-label="Your guesses">
            {Array.from({ length: 6 }, (_, row) => {
              const value = round.guesses[row] ?? (row === round.guesses.length ? round.draft : '');
              const marks = round.guesses[row] ? scoreWordGuess(answer, value) : null;
              const label = marks
                ? `Guess ${row + 1}: ${value.toUpperCase()}. ${[...value].map((letter, i) => `${letter.toUpperCase()}: ${markLabels[marks[i]!]}`).join('. ')}`
                : `Guess ${row + 1}: ${value.toUpperCase() || 'empty'}`;
              return (
                <li
                  key={row}
                  className={`word-row${!finished && row === round.guesses.length ? ' word-row--current' : ''}`}
                  aria-label={label}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`word-cell${marks ? ` word-cell--${marks[i]}` : ''}`}
                      aria-hidden="true"
                    >
                      {value[i]?.toUpperCase()}
                      <small>{marks ? symbols[marks[i]!] : null}</small>
                    </span>
                  ))}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="word-controls-panel">
          <p
            className={`word-feedback${finished ? ' word-feedback--finished' : ''}`}
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
          <div className="word-legend">
            <span>✓ Correct spot</span>
            <span>↔ Elsewhere</span>
            <span>− Not used</span>
          </div>
          <div className="word-keyboard" role="group" aria-label="Letter keyboard">
            {keyboard.map((row, i) => (
              <div className="word-key-row" key={row}>
                {[...row].map((letter, j) => (
                  <button
                    ref={i === 0 && j === 0 ? first : undefined}
                    key={letter}
                    className={`word-key focusable${known.has(letter) ? ` word-key--${known.get(letter)}` : ''}`}
                    onKeyDown={(event) => {
                      physical(event);
                      moveLetter(event, i, j);
                    }}
                    aria-label={`Add ${letter.toUpperCase()}${known.has(letter) ? `, ${markLabels[known.get(letter)!]}` : ''}`}
                    aria-disabled={finished || undefined}
                    data-focus-id={`word-key-${letter}`}
                    data-focus-entry={!finished && i === 0 && j === 0 ? 'true' : undefined}
                    onClick={() => add(letter)}
                  >
                    {letter.toUpperCase()}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="word-actions">
            <button
              className="button focusable"
              aria-disabled={finished || undefined}
              aria-label="Delete last letter"
              data-focus-id="word-delete"
              onKeyDown={physical}
              onClick={erase}
            >
              <Icon name="chevron-left" />
              Delete
            </button>
            <button
              ref={submit}
              className="button button--primary focusable"
              aria-disabled={finished || undefined}
              data-focus-id="word-submit"
              onKeyDown={physical}
              onClick={guess}
            >
              Guess
            </button>
          </div>
          <button
            ref={next}
            className="button focusable word-next"
            aria-label={finished ? 'Next word' : 'Restart word'}
            data-focus-id="word-next"
            onKeyDown={physical}
            data-focus-entry={finished ? 'true' : undefined}
            onClick={() =>
              finished
                ? start(round.index + 1)
                : round.guesses.length || round.draft
                  ? setConfirm(true)
                  : start(round.index)
            }
          >
            {finished ? 'Next word' : 'Restart'}
            <Icon name="chevron-right" />
          </button>
          {storageFailed ? (
            <p className="word-notice" role="status">
              This round cannot be saved on this device.
            </p>
          ) : null}
        </div>
      </div>
      {confirm ? (
        <RestartWord onClose={() => setConfirm(false)} onConfirm={() => start(round.index)} />
      ) : null}
    </section>
  );
}
function RestartWord({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="word-confirm"
      aria-labelledby="word-confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 id="word-confirm-title">Restart this word?</h2>
      <p>Your attempts for this word will be cleared.</p>
      <div className="word-actions">
        <button className="button focusable" data-back-dismiss="true" onClick={onClose}>
          Keep playing
        </button>
        <button className="button button--primary focusable" onClick={onConfirm}>
          Restart word
        </button>
      </div>
    </dialog>
  );
}
