/** Matches backend scoring (normal: 7 − n, berserk: 9 − n). */
export function pointsIfWonOnGuess(guessNum: number, berserk: boolean): number {
  return berserk ? 9 - guessNum : 7 - guessNum;
}
