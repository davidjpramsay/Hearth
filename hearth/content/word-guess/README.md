# Private Word Guess words

Bring your own permitted word database. No NYT Wordle answers or downloaded dictionary is included
with Hearth. The small public demo is original test data. This folder contains only this README.

Ask your agent:

> Help me obtain an independently licensed English word list for Hearth Word Guess. Prepare a
> family-appropriate five-letter answer set and a broader allowed-guess dictionary, preserve its
> source/licence notices and install the validated JSON privately. Keep all downloaded words outside
> Git, public folders, release ZIPs and images. Do not copy NYT's answer list or bypass restrictions.

[English Speller Database / SCOWL](https://github.com/en-wl/wordlist) is one possible source. Check
its [current permission notice](https://github.com/en-wl/wordlist/blob/v2/Copyright), including any
Australian-English notice, and keep those notices beside your private word file. A free download
is not automatically permission to redistribute it or a guarantee of child suitability. Curate the
answer pool; a broad spelling dictionary can contain unfamiliar or adult words.

Prepare two local text files, one lowercase five-letter word per line. Every answer must occur in
the allowed guesses. Answers retain their order, so shuffle that private answer file first if wanted.
Then run from the source root:

```sh
python3 hearth/scripts/prepare-word-guess.py --answers /private/answers.txt \
  --guesses /private/guesses.txt --output /private/word-guess.json
```

The helper writes a bounded private JSON file outside the repository. Place it at
`game-archives/word-guess.json` beside Hearth's private database with service-readable private
permissions. Alternatively configure the server-only absolute `HEARTH_WORD_GUESS_PATH`. Do not put
it here. The server accepts `{version:1,answers:[...],allowedGuesses:[...]}`, at most 10,000 answers,
30,000 guesses and 1 MiB. See `docs/hearth-v2/WORD_GUESS_CONTRACT.md` and OPERATIONS for details.

A new private installation without words shows setup guidance. Existing screens/phones need no
extra account. Changing a word list starts a new round safely; turning the game off keeps its save.
For NYT's game, visit [official Wordle](https://www.nytimes.com/games/wordle/index.html).
