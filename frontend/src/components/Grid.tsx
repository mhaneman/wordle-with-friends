import type { GuessRow, LetterState } from "../api/types";
import { pointsIfWonOnGuess } from "../utils/points";
import { Tile } from "./Tile";

interface GridProps {
  guesses: GuessRow[];
  currentWord: string;
  maxGuesses: number;
  berserk?: boolean;
  status?: "in_progress" | "won" | "lost";
  shake?: boolean;
  revealingRow?: number | null;
}

export function Grid({
  guesses,
  currentWord,
  maxGuesses,
  berserk = false,
  status = "in_progress",
  shake,
  revealingRow,
}: GridProps) {
  const rows: Array<{
    letters: string[];
    states?: LetterState[];
    isCurrent: boolean;
  }> = [];

  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      rows.push({
        letters: guesses[i].word.split(""),
        states: guesses[i].states,
        isCurrent: false,
      });
    } else if (i === guesses.length) {
      const letters = currentWord.split("");
      while (letters.length < 5) letters.push("");
      rows.push({ letters, isCurrent: true });
    } else {
      rows.push({ letters: ["", "", "", "", ""], isCurrent: false });
    }
  }

  const tileStrip = (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-[62px] shrink-0" />
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${shake ? "animate-shake" : ""}`}>
      <div className="flex items-center gap-2">
        {tileStrip}
        <span
          className="w-7 shrink-0 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-500"
          title="Points if you win on that guess"
        >
          Pts
        </span>
      </div>
      {rows.map((row, rowIdx) => {
        const guessNum = rowIdx + 1;
        const isSubmitted = rowIdx < guesses.length;
        const isActiveRow = row.isCurrent && status === "in_progress";
        const isWinningRow =
          status === "won" && rowIdx === guesses.length - 1;
        const pointsValue = pointsIfWonOnGuess(guessNum, berserk);
        const showPoints = isSubmitted || isActiveRow;
        const pointsColor = isWinningRow
          ? "text-correct"
          : "text-neutral-600";

        return (
          <div key={rowIdx} className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {row.letters.map((letter, colIdx) => (
                <Tile
                  key={colIdx}
                  letter={letter}
                  state={row.states?.[colIdx]}
                  filled={row.isCurrent && !!letter}
                  reveal={revealingRow === rowIdx}
                  delay={colIdx * 100}
                />
              ))}
            </div>
            <span
              className={`w-7 shrink-0 text-center text-xs font-semibold tabular-nums ${
                showPoints ? pointsColor : "invisible"
              }`}
              aria-hidden={!showPoints}
              title={
                showPoints
                  ? `${pointsValue} points if you win on guess ${guessNum}`
                  : undefined
              }
            >
              {pointsValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
