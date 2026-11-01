import { useEffect, useRef } from "react";

type PeekPromptProps = {
  confirming: boolean;
  error: string;
  onPeek: () => void;
  onCancel: () => void;
};

export function PeekPrompt({
  confirming,
  error,
  onPeek,
  onCancel,
}: PeekPromptProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirming) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirming, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
      role="presentation"
      onClick={() => {
        if (!confirming) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-title"
        className="w-full max-w-sm rounded-lg border border-line bg-surface px-5 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="peek-title" className="text-lg font-bold text-center">
          Peek at the leaderboard?
        </h2>
        <p className="mt-3 text-sm text-muted text-center">
          If you continue, you will lose a point for peeking.
        </p>
        {error && (
          <p className="mt-3 text-danger text-sm text-center">{error}</p>
        )}
        <div className="mt-5 flex w-full gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded font-semibold text-sm text-ink-muted border border-line-emphasis hover:bg-surface-raised disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onPeek}
            className="flex-1 py-2.5 rounded font-semibold text-sm uppercase tracking-wide bg-warning-strong text-canvas hover:bg-warning disabled:opacity-50"
          >
            {confirming ? "…" : "Peek"}
          </button>
        </div>
      </div>
    </div>
  );
}
