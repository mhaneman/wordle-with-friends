import { useEffect } from "react";
import {
  BERSERK_MAX_GUESSES,
  berserkWinPoints,
  REGULAR_MAX_GUESSES,
  regularWinPoints,
} from "../lib/points";

type BerserkDialogProps = {
  open: boolean;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const comparisonRows = Array.from(
  { length: REGULAR_MAX_GUESSES },
  (_, i) => i + 1,
).map((guesses) => ({
  guesses,
  regular: regularWinPoints(guesses),
  berserk:
    guesses <= BERSERK_MAX_GUESSES ? berserkWinPoints(guesses) : null,
}));

export function BerserkDialog({
  open,
  confirming,
  onClose,
  onConfirm,
}: BerserkDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirming) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirming, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        disabled={confirming}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="berserk-dialog-title"
        className="relative w-full max-w-sm rounded-lg border border-amber-500/40 bg-neutral-900 p-5 shadow-xl"
      >
        <h2
          id="berserk-dialog-title"
          className="text-lg font-bold text-amber-400 uppercase tracking-wide text-center"
        >
          Go Berserk?
        </h2>
        <p className="mt-2 text-sm text-neutral-300 text-center">
          You get {BERSERK_MAX_GUESSES} guesses instead of {REGULAR_MAX_GUESSES}.
          Solve the word and your score is in the Berserk column below. Use all{" "}
          {BERSERK_MAX_GUESSES} without solving it and you score 0.
        </p>

        <div className="mt-4 overflow-hidden rounded border border-neutral-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-semibold">Guesses</th>
                <th className="px-3 py-2 text-center font-semibold">Regular</th>
                <th className="px-3 py-2 text-center font-semibold text-amber-400">
                  Berserk
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ guesses, regular, berserk }) => (
                <tr
                  key={guesses}
                  className="border-t border-neutral-800 even:bg-neutral-800/30"
                >
                  <td className="px-3 py-2 text-neutral-200">{guesses}</td>
                  <td className="px-3 py-2 text-center text-neutral-300">
                    {regular}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-amber-400">
                    {berserk ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={confirming}
            onClick={onClose}
            className="flex-1 py-2.5 rounded font-semibold text-sm text-neutral-300 border border-neutral-600 hover:bg-neutral-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded font-semibold text-sm uppercase tracking-wide bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {confirming ? "…" : "Go Berserk"}
          </button>
        </div>
      </div>
    </div>
  );
}

