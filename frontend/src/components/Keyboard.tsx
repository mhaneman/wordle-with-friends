import type { LetterState } from "../api/types";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const keyColors: Record<LetterState, string> = {
  correct: "bg-correct",
  present: "bg-present",
  absent: "bg-absent",
};

interface KeyboardProps {
  keyStates: Record<string, LetterState>;
  onKey: (key: string) => void;
  /** Block input without dimming keys (avoids flash on submit). */
  inactive?: boolean;
}

const rowClass = "flex w-full gap-1 sm:gap-1.5";
/** ~½ key inset so ASDFGHJKL sits between QWERTYUIOP (scales with row width). */
const homeRowClass =
  `${rowClass} px-[calc((100%-2.25rem)/20)] sm:px-[calc((100%-3.375rem)/20)]`;
const keyClass =
  "rounded font-bold uppercase text-white flex items-center justify-center select-none transition-colors duration-75 min-w-0 h-14 sm:h-16 md:h-[4.25rem] text-[clamp(0.75rem,3.25vw,1rem)]";

export function Keyboard({ keyStates, onKey, inactive }: KeyboardProps) {
  const renderKey = (k: string, wide = false) => {
    const state = keyStates[k];
    const color = state ? keyColors[state] : "bg-key";
    const pressed = state
      ? "active:brightness-[0.72]"
      : "active:bg-neutral-600";
    return (
      <button
        key={k}
        type="button"
        onClick={() => onKey(k)}
        className={`${keyClass} ${color} ${pressed} ${wide ? "flex-[1.5]" : "flex-1"}`}
      >
        {k === "enter" ? "Enter" : k === "back" ? "⌫" : k}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col gap-1.5 sm:gap-2 w-full max-w-none md:max-w-lg mx-auto px-1.5 sm:px-2 md:px-0${inactive ? " pointer-events-none" : ""}`}
    >
      <div className={rowClass}>
        {ROWS[0].split("").map((k) => renderKey(k))}
      </div>
      <div className={homeRowClass}>
        {ROWS[1].split("").map((k) => renderKey(k))}
      </div>
      <div className={rowClass}>
        {renderKey("enter", true)}
        {ROWS[2].split("").map((k) => renderKey(k))}
        {renderKey("back", true)}
      </div>
    </div>
  );
}
