import type { LetterState } from "../api/types";

const stateClasses: Record<LetterState | "empty" | "filled" | "answer", string> = {
  empty: "border-line-emphasis text-ink",
  filled: "border-line-filled text-ink",
  correct: "bg-correct border-correct text-ink",
  present: "bg-present border-present text-ink",
  absent: "bg-absent border-absent text-ink",
  answer: "bg-answer border-answer text-ink",
};

type TileState = LetterState | "answer";

interface TileProps {
  letter?: string;
  state?: TileState;
  filled?: boolean;
  reveal?: boolean;
  delay?: number;
}

export function Tile({ letter = "", state, filled, reveal, delay = 0 }: TileProps) {
  let cls = stateClasses.empty;
  if (state) cls = stateClasses[state];
  else if (filled && letter) cls = stateClasses.filled;

  return (
    <div
      className={`game-tile shrink-0 border-2 flex items-center justify-center font-bold uppercase ${cls} ${reveal ? "tile-flip" : ""}`}
      style={reveal ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter}
    </div>
  );
}

