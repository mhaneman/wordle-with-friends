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

export function Keyboard({ keyStates, onKey, inactive }: KeyboardProps) {
  const renderKey = (k: string, wide = false) => {
    const state = keyStates[k];
    const base =
      "rounded font-bold uppercase text-white flex items-center justify-center select-none";
    const color = state ? keyColors[state] : "bg-key";
    return (
      <button
        key={k}
        type="button"
        onClick={() => onKey(k)}
        className={`${base} ${color} ${wide ? "px-4 h-14 text-xs" : "w-10 h-14 text-sm"} active:brightness-90`}
      >
        {k === "enter" ? "Enter" : k === "back" ? "⌫" : k}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col gap-1.5 w-full max-w-lg mx-auto px-1${inactive ? " pointer-events-none" : ""}`}
    >
      <div className="flex justify-center gap-1">
        {ROWS[0].split("").map((k) => renderKey(k))}
      </div>
      <div className="flex justify-center gap-1 px-2">
        {ROWS[1].split("").map((k) => renderKey(k))}
      </div>
      <div className="flex justify-center gap-1">
        {renderKey("enter", true)}
        {ROWS[2].split("").map((k) => renderKey(k))}
        {renderKey("back", true)}
      </div>
    </div>
  );
}
