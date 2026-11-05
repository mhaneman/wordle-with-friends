/** Win points before the no-peek bonus. Normal: 7 − n (1 guess = 6). Berserk adds 2. */
export function pointsIfWonOnGuess(guessNum: number, berserk: boolean): number {
  const points = 7 - guessNum;
  return berserk ? points + 2 : points;
}
