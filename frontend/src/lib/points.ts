/** Matches backend game.PointsFromGuessCount for wins. */
export function regularWinPoints(guessCount: number): number {
  return 8 - guessCount;
}

export function berserkWinPoints(guessCount: number): number {
  return 10 - guessCount;
}

export const REGULAR_MAX_GUESSES = 6;
export const BERSERK_MAX_GUESSES = 4;
