import type { GuessRow, LetterState } from "../api/types";
import { Tile } from "./Tile";

interface GridProps {
  guesses: GuessRow[];
  currentWord: string;
  maxGuesses: number;
  shake?: boolean;
  revealingRow?: number | null;
}

export function Grid({
  guesses,
  currentWord,
  maxGuesses,
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

  return (
    <div
      className={`game-grid flex flex-1 min-h-0 w-full flex-col justify-center ${shake ? "animate-shake" : ""}`}
    >
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="game-grid-row flex shrink-0 w-full">
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
