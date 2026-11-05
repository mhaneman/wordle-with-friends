/** Matches backend game.PointsFromGuessCount for wins, before the no-peek bonus. */
export function regularWinPoints(guessCount: number): number {
  return 7 - guessCount;
}

export function berserkWinPoints(guessCount: number): number {
  return 9 - guessCount;
}

export const REGULAR_MAX_GUESSES = 6;
export const BERSERK_MAX_GUESSES = 4;
