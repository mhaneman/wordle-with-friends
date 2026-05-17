import type { GuessRow, LetterState } from "../api/types";
import { Tile } from "./Tile";

const MAX_ROWS = 6;

interface GridProps {
  guesses: GuessRow[];
  currentWord: string;
  shake?: boolean;
  revealingRow?: number | null;
}

export function Grid({ guesses, currentWord, shake, revealingRow }: GridProps) {
  const rows: Array<{
    letters: string[];
    states?: LetterState[];
    isCurrent: boolean;
  }> = [];

  for (let i = 0; i < MAX_ROWS; i++) {
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

  return (
    <div className={`flex flex-col gap-1.5 ${shake ? "animate-shake" : ""}`}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5">
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
      ))}
    </div>
  );
}
