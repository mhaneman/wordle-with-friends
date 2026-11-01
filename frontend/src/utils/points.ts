/** Matches backend scoring (normal: 8 − n, berserk: that plus 2). */
export function pointsIfWonOnGuess(guessNum: number, berserk: boolean): number {
  const points = 8 - guessNum;
  return berserk ? points + 2 : points;
}
