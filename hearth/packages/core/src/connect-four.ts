/** Original local two-player implementation. Rows run top to bottom; columns are zero-based. */
export type ConnectFourPlayer = 1 | 2;
export type ConnectFourRound = { firstPlayer: ConnectFourPlayer; moves: number[] };
export type ConnectFourBoard = {
  cells: Array<ConnectFourPlayer | null>;
  player: ConnectFourPlayer;
  winner: ConnectFourPlayer | null;
  winningCells: number[];
  draw: boolean;
};
export const newConnectFourRound = (firstPlayer: ConnectFourPlayer = 1): ConnectFourRound => ({
  firstPlayer,
  moves: [],
});

export function connectFourBoard(round: ConnectFourRound): ConnectFourBoard {
  const board: ConnectFourBoard = {
    cells: Array<null>(42).fill(null),
    player: round.firstPlayer,
    winner: null,
    winningCells: [],
    draw: false,
  };
  for (const column of round.moves) {
    if (board.winner || board.draw) throw new Error('The round has already finished.');
    const index = connectFourLanding(board, column);
    if (index === null) throw new Error('Choose a column with space.');
    board.cells[index] = board.player;
    const row = Math.floor(index / 7);
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ] as const) {
      const line = [index];
      for (const sign of [-1, 1]) {
        let r = row + dr * sign;
        let c = column + dc * sign;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && board.cells[r * 7 + c] === board.player) {
          line.push(r * 7 + c);
          r += dr * sign;
          c += dc * sign;
        }
      }
      if (line.length >= 4) {
        board.winner = board.player;
        board.winningCells.push(...line);
      }
    }
    board.draw = board.winner === null && board.cells.every((cell) => cell !== null);
    if (!board.winner && !board.draw) board.player = board.player === 1 ? 2 : 1;
  }
  return board;
}

export function connectFourLanding(board: ConnectFourBoard, column: number): number | null {
  if (!Number.isInteger(column) || column < 0 || column > 6) return null;
  for (let row = 5; row >= 0; row--)
    if (board.cells[row * 7 + column] === null) return row * 7 + column;
  return null;
}
export function dropConnectFour(round: ConnectFourRound, column: number): ConnectFourRound {
  const next = { firstPlayer: round.firstPlayer, moves: [...round.moves, column] };
  connectFourBoard(next); // Replay validates gravity, turn order, capacity and finished rounds.
  return next;
}
export function restoreConnectFour(input: unknown): ConnectFourRound | null {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('firstPlayer' in input) ||
    !('moves' in input)
  )
    return null;
  if (
    (input.firstPlayer !== 1 && input.firstPlayer !== 2) ||
    !Array.isArray(input.moves) ||
    input.moves.length > 42 ||
    input.moves.some((c) => typeof c !== 'number')
  )
    return null;
  const round = { firstPlayer: input.firstPlayer, moves: [...input.moves] } as ConnectFourRound;
  try {
    connectFourBoard(round);
    return round;
  } catch {
    return null;
  }
}
