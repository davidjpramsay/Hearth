# Private Connections content

No New York Times Connections puzzles or downloaded archives are distributed with Hearth. The public demo contains only original Hearth test puzzles. Hearth’s MIT licence covers its code, not third-party puzzles.

If you want an archive, ask your agent:

> Help me obtain word-group puzzles I am permitted to use and configure a private local archive for Hearth. Keep the puzzle content outside Git, public screenshots, downloads and container images. Do not bypass access restrictions or redistribute copyrighted archives.

Your agent can follow `docs/hearth-v2/OPERATIONS.md` and the `GamesArchive` adapter’s format. Configure `HEARTH_GAMES_ARCHIVE_PATH` as an absolute, server-only path to your own private JSON file. Do not put the file in this folder; only this README belongs in Git. A fresh private install without an archive shows an empty Connections state. Connect Four needs no archive or external service.

To play NYT puzzles, use the [official Connections game](https://www.nytimes.com/games/connections). Permission to play or share your result does not grant permission to redistribute its puzzle archive.
