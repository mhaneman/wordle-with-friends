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
      className={`flex-1 min-w-0 aspect-square max-w-[3.875rem] max-h-[3.875rem] border-2 flex items-center justify-center text-[clamp(1.125rem,6vw,1.5rem)] font-bold uppercase ${cls} ${reveal ? "tile-flip" : ""}`}
      style={reveal ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter}
    </div>
  );
}

