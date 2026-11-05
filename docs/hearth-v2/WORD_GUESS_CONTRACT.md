# Word Guess — D-135

An original five-letter, six-attempt game under Games. It is not NYT Wordle and does not use its
branding, answer list or daily schedule. Play another word explicitly after finishing; keep the
current round through close/reopen. No competitive, money, health or HA game-control feature.

## Content boundary

Private homes supply their own permitted word data. Ship only a small original demo/test fixture.
Never distribute downloaded word lists, NYT puzzles or an archive in Git, public assets, downloads,
container images or screenshots. `hearth/content/word-guess/README.md` and the Connections README
explain independent acquisition, permissions, notices and private storage. No scraping or third-party
calls during play, startup, build or tests. A spelling dictionary is not a promise of child suitability;
answer selection belongs to the household, with broader allowed guesses kept separate.

Server-private UTF-8 JSON has `{version:1,answers:[...],allowedGuesses:[...]}`. Both arrays contain
unique lowercase ASCII five-letter words; every answer must also be an allowed guess. Bounds:
10,000 answers, 30,000 allowed guesses and 1 MiB. Keep required licence notices beside the private
file. The operator importer accepts existing local text files and writes a validated private file,
not a public/bundled database. Runtime file changes are atomic; a failed refresh retains a last-good
snapshot as stale. No symlink, directory/FIFO or changing/oversized input is accepted.

Default private path is `game-archives/word-guess.json` beside the database; an optional absolute
`HEARTH_WORD_GUESS_PATH` is server-only. It requires no new mount, networking, credential or live
configuration change. Missing data gives a calm setup state. Demo mode uses original fixtures only.

## Modules, transport and storage

Add `wordGuess` to existing game choices and `/games/word-guess` to existing guards. Games parent off
hides/gates every child; the separate adult switch also gates this route/read and evicts its query.
Turning off retains local progress and private data. Default is on, consistent with existing child
games; fresh installations without data show setup guidance. No new HA scope or child controls.

Migration 0039 extends the game-module ID constraint without changing existing flags, receipts or
household rows. Older exact response receipts may omit the new field; schema compatibility fills the
new game's default in memory without rewriting stored receipts or input hashes. Actor-scoped exact
retries, audit and adult/screen/household isolation remain unchanged.

Household GET `/api/v1/households/{householdId}/games/word-guess` returns status, source type and a
nullable validated snapshot `{id,answers,allowedGuesses}`. Authenticate and check parent/child
before file I/O under existing request leases. Private/no-store with Vary on household credentials.
The snapshot ID hashes the normalized contents, so changed data cannot reuse old progress against a
new answer. This is a local household game: the browser receives solutions, with no anti-cheat claim.
No gameplay write API, analytics, user tracking or provider credentials.

Versioned, bounded device storage is scoped by runtime and household. Store only snapshot ID,
word index, accepted guesses and partial input. Restore validates against this snapshot, recomputes
feedback and rejects invalid/post-win progress. Changed lists start a fresh round; other storage is
untouched. No offline queue/service worker. A loaded snapshot stays playable through a read outage;
module/auth revocation follows existing guards and cannot recall bytes already delivered.

## Interaction and proof

Duplicate letters consume matching answer letters once: exact positions first, then elsewhere.
Unrecognized, incomplete or repeated guesses do not consume an attempt. Correct, elsewhere and
absent feedback use text/symbol equivalents as well as colour. Reveal the answer after loss.

TV has a visible on-screen keyboard, ordinary arrows/OK/Back and a return path to/from the main rail.
Active entry is a letter key; finished entry is Next word. Back dismisses restart confirmation before
returning to Games; closing keeps the round. Hardware letters/backspace work within game content;
Enter can submit through the focused Guess control. Phone/tablet controls use the same state and
reflow without horizontal overflow. Dark/reduced-motion, loading, empty, stale/offline, failure and
blocked storage states are explicit. Restart confirms unfinished progress; Next word wraps only
after all words. No automatic advance clears a finished board.

Prove repeated-letter scoring, invalid inputs, win/loss/terminal restore, exact save/reopen, snapshot
change, dictionary bounds, file refresh/failure, auth/household/parent/child isolation, old receipts,
migration retention, TV/phone layouts and remote/menu/Back. Local, GitHub, private data installation,
deployment and physical TV/iPhone proof remain distinct.
