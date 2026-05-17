import type { LetterState } from "../api/types";

const stateClasses: Record<LetterState | "empty" | "filled", string> = {
  empty: "border-neutral-600 text-white",
  filled: "border-neutral-500 text-white",
  correct: "bg-correct border-correct text-white",
  present: "bg-present border-present text-white",
  absent: "bg-absent border-absent text-white",
};

interface TileProps {
  letter?: string;
  state?: LetterState;
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
      className={`w-[62px] h-[62px] border-2 flex items-center justify-center text-2xl font-bold uppercase ${cls} ${reveal ? "tile-flip" : ""}`}
      style={reveal ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter}
    </div>
  );
}

