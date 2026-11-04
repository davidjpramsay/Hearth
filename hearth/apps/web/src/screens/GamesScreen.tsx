import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { GameCatalogue, WordGroupsProgress, WordGroupsPuzzle } from '@hearth/shared';
import {
  newWordGroupsProgress,
  shuffleWordGroups,
  submitWordGroupsGuess,
  wordGroupsSummary,
} from '@hearth/core';
import { gamesApi } from '../api/games';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { EmptyState, FailureState, LoadingState } from '../components/Status';
import { useHearthRuntime } from '../runtime/context';
import {
  gameOutcome,
  readGameOutcomes,
  readGameProgress,
  readLastGamePuzzle,
  rememberGamePuzzle,
  saveGameProgress,
  type GameOutcome,
} from '../utils/gameProgress';
import './GamesScreen.css';

export function GamesScreen() {
  const runtime = useHearthRuntime();
  const home = `${runtime.mode}.${runtime.household!.id}`;
  return <GamesContent key={home} home={home} />;
}

function GamesContent({ home }: { home: string }) {
  const [params, setParams] = useSearchParams();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [outcomes, setOutcomes] = useState(() => readGameOutcomes(home));
  // Freeze the entry choice so saving a win does not switch the board underneath the player.
  const [entryOutcomes] = useState(outcomes);
  const [entryPuzzleId] = useState(() => readLastGamePuzzle(home));
  const catalogue = useQuery({
    queryKey: ['games', home, 'catalogue'],
    queryFn: ({ signal }) => gamesApi.catalogue(signal),
    staleTime: 60_000,
  });
  const requested = params.get('puzzle');
  const ordered = [...(catalogue.data?.puzzles ?? [])].sort((a, b) => a.number - b.number);
  const selected =
    requested === null
      ? (ordered.find((item) => item.id === entryPuzzleId) ??
        ordered.find((item) => entryOutcomes[item.id] !== 'completed') ??
        ordered[0])
      : ordered.find((item) => String(item.number) === requested);
  const puzzle = useQuery({
    queryKey: ['games', home, selected?.id],
    queryFn: ({ signal }) => gamesApi.puzzle(selected!.id, signal),
    enabled: selected !== undefined,
    staleTime: Infinity,
  });
  const loadedPuzzleId = puzzle.data?.id;
  useEffect(() => {
    // Persist only a successfully loaded board, including untouched archive choices and deep links.
    if (loadedPuzzleId !== undefined) rememberGamePuzzle(home, loadedPuzzleId);
  }, [home, loadedPuzzleId]);
  const position = ordered.findIndex((item) => item.id === selected?.id);
  function choose(number: number) {
    setArchiveOpen(false);
    setParams({ puzzle: String(number) });
  }
  return (
    <div className="screen games-screen">
      <ScreenHeader title="Connections" meta="Word groups" />
      {catalogue.isPending ? (
        <LoadingState />
      ) : catalogue.data === undefined ? (
        <FailureState onRetry={() => void catalogue.refetch()} />
      ) : catalogue.data.puzzles.length === 0 ? (
        <EmptyState
          title="No puzzles yet"
          description={
            catalogue.data.status === 'unconfigured'
              ? 'Add a household puzzle archive to play.'
              : 'The puzzle archive is unavailable. Try again later.'
          }
        />
      ) : (
        <>
          <div
            className="games-toolbar"
            data-focus-loading={
              selected !== undefined && puzzle.data === undefined ? 'true' : undefined
            }
          >
            <button
              className="button focusable"
              data-focus-id="games-earlier"
              aria-label="Earlier puzzle"
              disabled={position <= 0}
              onClick={() => choose(ordered[position - 1]!.number)}
            >
              <Icon name="chevron-left" />
            </button>
            <span>
              {selected === undefined
                ? 'Choose a puzzle'
                : `#${selected.number} · ${puzzleDate(selected.date)}`}
            </span>
            <button
              className="button focusable"
              data-focus-id="games-later"
              aria-label="Later puzzle"
              disabled={position < 0 || position >= ordered.length - 1}
              onClick={() => choose(ordered[position + 1]!.number)}
            >
              <Icon name="chevron-right" />
            </button>
            <button
              className="button focusable games-archive-button"
              data-focus-id="games-archive"
              onClick={() => setArchiveOpen(true)}
            >
              Archive
            </button>
          </div>
          {catalogue.data.status === 'stale' || catalogue.isError ? (
            <p role="status">Using the saved archive.</p>
          ) : null}
          {selected === undefined ? (
            <p role="status">That puzzle is not in this archive. Choose another from Archive.</p>
          ) : puzzle.data !== undefined ? (
            <WordGroupsBoard
              key={`${home}.${puzzle.data.id}`}
              home={home}
              puzzle={puzzle.data}
              onProgress={(id, outcome) =>
                setOutcomes((current) => ({
                  ...current,
                  [id]: current[id] === 'completed' ? 'completed' : outcome,
                }))
              }
              onNext={
                position >= 0 && position < ordered.length - 1
                  ? () => choose(ordered[position + 1]!.number)
                  : null
              }
            />
          ) : puzzle.isPending ? (
            <LoadingState />
          ) : (
            <FailureState onRetry={() => void puzzle.refetch()} />
          )}
          <p className="games-source">
            {catalogue.data.source === 'original-demo' ? 'Original demo puzzles. ' : null}
            Progress stays on this device.
          </p>
          {archiveOpen ? (
            <PuzzleArchive
              puzzles={ordered}
              outcomes={outcomes}
              selected={selected?.id}
              onSelect={choose}
              onClose={() => setArchiveOpen(false)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function WordGroupsBoard({
  home,
  puzzle,
  onProgress,
  onNext,
}: {
  home: string;
  puzzle: WordGroupsPuzzle;
  onProgress: (id: string, outcome: GameOutcome) => void;
  onNext: (() => void) | null;
}) {
  const [progress, setProgress] = useState(() => readGameProgress(home, puzzle));
  const [selection, setSelection] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [storageFailed, setStorageFailed] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const summary = wordGroupsSummary(puzzle, progress.attempts);
  const shownGroups = summary.finished
    ? [
        ...summary.solved,
        ...puzzle.groups
          .map((_, index) => index)
          .filter((index) => !summary.solved.includes(index)),
      ]
    : summary.solved;
  const remaining = progress.order.filter(
    (index) =>
      !summary.solved.some((group) => puzzle.groups[group]!.words.includes(puzzle.board[index]!)),
  );
  function save(next: WordGroupsProgress) {
    setProgress(next);
    setStorageFailed(!saveGameProgress(home, puzzle, next));
    onProgress(puzzle.id, gameOutcome(puzzle, next));
  }
  function submit() {
    const result = submitWordGroupsGuess(puzzle, progress, selection);
    if (result.progress !== progress) save(result.progress);
    setFeedback(
      {
        correct: 'Group found.',
        'one-away': 'One away. Try a different word.',
        incorrect: 'Not a group. Try again.',
        repeat: 'Already guessed. No mistake used.',
        invalid: 'Choose four words.',
        finished: 'This puzzle is finished.',
      }[result.feedback],
    );
    if (
      result.feedback === 'correct' ||
      wordGroupsSummary(puzzle, result.progress.attempts).finished
    ) {
      setSelection([]);
      window.requestAnimationFrame(() =>
        boardRef.current
          ?.querySelector<HTMLButtonElement>('.games-next-puzzle, .games-word, .games-replay')
          ?.focus(),
      );
    }
  }
  function restart() {
    save(newWordGroupsProgress());
    setSelection([]);
    setFeedback('');
    setRestartOpen(false);
    window.requestAnimationFrame(() =>
      boardRef.current?.querySelector<HTMLButtonElement>('.games-word')?.focus(),
    );
  }
  return (
    <div className="games-play" ref={boardRef}>
      <p className="games-instructions">Find four words that belong together.</p>
      <div className="games-status" role="status" aria-live="polite" aria-atomic="true">
        {summary.finished
          ? summary.won
            ? 'All four groups found!'
            : 'No mistakes left. Here are the groups.'
          : feedback || `${selection.length} of 4 selected`}
      </div>
      <div className="games-board" aria-label="Word grouping puzzle">
        {shownGroups.map((index) => {
          const group = puzzle.groups[index]!;
          return (
            <section
              className={`games-group games-group--${group.difficulty}`}
              key={index}
              aria-label={`${group.category}${summary.solved.includes(index) ? ', found' : ', revealed'}`}
            >
              <strong>{group.category}</strong>
              <span>{group.words.join(' · ')}</span>
            </section>
          );
        })}
        {!summary.finished ? (
          <div className="games-words">
            {remaining.map((index, position) => (
              <button
                type="button"
                key={index}
                className="games-word focusable"
                data-focus-id={`games-word-${index}`}
                data-focus-entry={position === 0 ? 'true' : undefined}
                aria-pressed={selection.includes(index)}
                onClick={() => {
                  setFeedback('');
                  setSelection((current) =>
                    current.includes(index)
                      ? current.filter((word) => word !== index)
                      : current.length < 4
                        ? [...current, index]
                        : current,
                  );
                }}
              >
                {puzzle.board[index]}
                {selection.includes(index) ? (
                  <span className="games-selected-mark" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className="games-mistakes"
        aria-label={`${Math.max(0, 4 - summary.mistakes)} mistakes remaining`}
      >
        <span>Mistakes left</span>
        <span aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <i className={index < 4 - summary.mistakes ? 'available' : ''} key={index} />
          ))}
        </span>
      </div>
      <div className="games-actions">
        {summary.finished ? (
          <>
            {summary.won && onNext !== null ? (
              <button
                className="button button--primary focusable games-next-puzzle"
                data-focus-id="games-next-puzzle"
                data-focus-entry="true"
                onClick={onNext}
              >
                Next puzzle
              </button>
            ) : null}
            <button
              className="button focusable games-replay"
              data-focus-id="games-replay"
              data-focus-entry={summary.won && onNext !== null ? undefined : 'true'}
              onClick={restart}
            >
              Play again
            </button>
          </>
        ) : (
          <>
            <button
              className="button focusable"
              data-focus-id="games-shuffle"
              onClick={() => save({ ...progress, order: shuffleWordGroups(progress.order) })}
            >
              Shuffle
            </button>
            <button
              className="button focusable"
              data-focus-id="games-deselect"
              disabled={selection.length === 0}
              onClick={() => {
                setSelection([]);
                setFeedback('');
              }}
            >
              Deselect
            </button>
            <button
              className="button button--primary focusable"
              data-focus-id="games-submit"
              disabled={selection.length !== 4}
              onClick={submit}
            >
              Submit
            </button>
          </>
        )}
      </div>
      {storageFailed ? <p role="status">Progress can’t be saved on this device.</p> : null}
      {!summary.finished && progress.attempts.length > 0 ? (
        <button
          className="games-restart focusable"
          data-focus-id="games-restart"
          onClick={() => setRestartOpen(true)}
        >
          Start over
        </button>
      ) : null}
      {restartOpen ? (
        <GameDialog title="Start this puzzle over?" onClose={() => setRestartOpen(false)}>
          <p>This clears your guesses for this puzzle on this device.</p>
          <button
            className="button button--primary focusable"
            data-focus-id="games-restart-confirm"
            onClick={restart}
          >
            Start over
          </button>
        </GameDialog>
      ) : null}
    </div>
  );
}

function PuzzleArchive({
  puzzles,
  selected,
  outcomes,
  onSelect,
  onClose,
}: {
  puzzles: GameCatalogue['puzzles'];
  selected: string | undefined;
  outcomes: Record<string, GameOutcome>;
  onSelect: (number: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const query = search.trim().replace(/^#/, '').toLowerCase();
  const numberQuery = /^\d+$/.test(query);
  const filtered = puzzles.filter(
    (puzzle) =>
      !query ||
      (numberQuery
        ? puzzle.number === Number(query)
        : `${puzzle.date} ${puzzleDate(puzzle.date)}`.toLowerCase().includes(query)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 40));
  return (
    <GameDialog title="Puzzle archive" onClose={onClose}>
      <label className="games-search">
        Find puzzle
        <input
          type="search"
          value={search}
          data-focus-id="games-search"
          placeholder="Number or date"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
      </label>
      <p>
        {puzzles.length.toLocaleString('en-AU')} puzzles ·{' '}
        {puzzles.filter((puzzle) => outcomes[puzzle.id] === 'completed').length} completed ·{' '}
        {puzzleDate(puzzles[0]!.date)}–{puzzleDate(puzzles.at(-1)!.date)}
      </p>
      <div className="games-archive-list">
        {filtered.slice(page * 40, (page + 1) * 40).map((puzzle) => (
          <button
            className="focusable"
            key={puzzle.id}
            aria-current={selected === puzzle.id ? 'true' : undefined}
            data-focus-id={`games-choose-${puzzle.number}`}
            onClick={() => onSelect(puzzle.number)}
          >
            <strong>#{puzzle.number}</strong>
            <span>{puzzleDate(puzzle.date)}</span>
            {outcomes[puzzle.id] !== undefined ? (
              <small className="games-archive-outcome" data-game-outcome={outcomes[puzzle.id]}>
                {outcomes[puzzle.id] === 'completed'
                  ? 'Completed'
                  : outcomes[puzzle.id] === 'revealed'
                    ? 'Revealed'
                    : 'In progress'}
              </small>
            ) : null}
          </button>
        ))}
        {filtered.length === 0 ? <p>No matching puzzle.</p> : null}
      </div>
      <div className="games-archive-pages">
        <button
          className="button focusable"
          data-focus-id="games-previous-page"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          {page + 1} / {pages}
        </span>
        <button
          className="button focusable"
          data-focus-id="games-next-page"
          disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </GameDialog>
  );
}

function GameDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    return () => {
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, []);
  return (
    <div
      className="event-detail games-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="games-dialog-title"
    >
      <div className="event-detail__panel games-dialog__panel">
        <header>
          <h2 id="games-dialog-title">{title}</h2>
          <button
            className="button focusable"
            data-back-dismiss="true"
            data-focus-id="games-dialog-close"
            ref={close}
            onClick={onClose}
          >
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

const puzzleDateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
function puzzleDate(date: string) {
  return puzzleDateFormatter.format(new Date(`${date}T12:00:00Z`));
}
