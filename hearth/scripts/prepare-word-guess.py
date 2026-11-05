#!/usr/bin/env python3
"""Build private Word Guess data from already-acquired, permitted local text files. No network."""
import argparse
import json
import os
import re
import tempfile
from pathlib import Path


def words(path, maximum):
    if not path.is_file() or path.stat().st_size > 4 * 1024 * 1024:
        raise ValueError('Input exceeds 4 MiB.')
    with path.open('rb') as source:
        raw = source.read(4 * 1024 * 1024 + 1)
    if len(raw) > 4 * 1024 * 1024:
        raise ValueError('Input exceeds 4 MiB.')
    entries = list(dict.fromkeys(line.strip() for line in raw.decode('utf8').splitlines() if line.strip()))
    if not entries or len(entries) > maximum or any(not re.fullmatch('[a-z]{5}', word) for word in entries):
        raise ValueError('Use unique lowercase five-letter ASCII words within the documented bounds.')
    return entries


def prepare(answers, guesses, output):
    repository = Path(__file__).resolve().parents[2]
    output = output.absolute()
    resolved = output.resolve()
    if resolved == repository or repository in resolved.parents:
        raise ValueError('Keep word data outside the repository.')
    if output.exists() or output.is_symlink():
        raise ValueError('Output already exists; choose a new private file and replace deliberately.')
    answer_words = words(answers, 10000)
    guess_words = words(guesses, 30000)
    if not set(answer_words).issubset(guess_words):
        raise ValueError('Every answer must also be an allowed guess.')
    payload = json.dumps({'version': 1, 'answers': answer_words, 'allowedGuesses': sorted(guess_words)}, separators=(',', ':')).encode()
    if len(payload) > 1024 * 1024:
        raise ValueError('Output exceeds 1 MiB.')
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    handle, staging = tempfile.mkstemp(prefix='.hearth-words-', dir=output.parent)
    try:
        os.fchmod(handle, 0o600)
        with os.fdopen(handle, 'wb') as target:
            target.write(payload)
            target.flush()
            os.fsync(target.fileno())
        # Exclusive creation prevents silently replacing an operator's existing file.
        os.link(staging, output)
        os.unlink(staging)
    finally:
        if os.path.exists(staging):
            os.unlink(staging)
    return len(answer_words), len(guess_words)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['answers', 'guesses', 'output']:
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    try:
        answers, guesses = prepare(args.answers, args.guesses, args.output)
    except (ValueError, OSError) as error:
        parser.exit(1, 'STOP: ' + str(error) + '\n')
    print(f'Prepared private word data: {answers} answers; {guesses} allowed guesses. Keep its source notices with it.')


if __name__ == '__main__':
    main()
