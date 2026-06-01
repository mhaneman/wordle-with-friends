import { useEffect, useRef, type ReactNode } from "react";
import type { GuessRow, LetterState } from "../api/types";
import { Tile } from "./Tile";

interface GridProps {
  guesses: GuessRow[];
  currentWord: string;
  maxGuesses: number;
  shake?: boolean;
  revealingRow?: number | null;
  answer?: string;
  children?: ReactNode;
}

export function Grid({
  guesses,
  currentWord,
  maxGuesses,
  shake,
  revealingRow,
  answer,
  children,
}: GridProps) {
  const rows: Array<{
    letters: string[];
    states?: LetterState[];
    isCurrent: boolean;
    isAnswer?: boolean;
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

  if (answer) {
    rows.push({
      letters: answer.split(""),
      isCurrent: false,
      isAnswer: true,
    });
  }

  const rowCount = rows.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateFooterHeight = () => {
      const footerHeight = footerRef.current?.offsetHeight ?? 0;
      grid.style.setProperty("--grid-footer-height", `${footerHeight}px`);
    };

    updateFooterHeight();
    const observer = new ResizeObserver(updateFooterHeight);
    observer.observe(grid);
    if (footerRef.current) observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={gridRef}
      className="game-grid flex flex-1 min-h-0 w-full flex-col justify-start"
      style={{ "--grid-rows": rowCount } as React.CSSProperties}
    >
      <div className="game-grid-stack flex w-full flex-col items-center shrink-0">
        <div className={`game-grid-rows w-full flex flex-col ${shake ? "animate-shake" : ""}`}>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="game-grid-row flex shrink-0 w-full">
              {row.letters.map((letter, colIdx) => (
                <Tile
                  key={colIdx}
                  letter={letter}
                  state={row.isAnswer ? "answer" : row.states?.[colIdx]}
                  filled={row.isCurrent && !!letter}
                  reveal={revealingRow === rowIdx}
                  delay={colIdx * 100}
                />
              ))}
            </div>
          ))}
        </div>
        {children ? (
          <div
            ref={footerRef}
            className="game-grid-footer shrink-0 w-full flex flex-col items-center"
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
