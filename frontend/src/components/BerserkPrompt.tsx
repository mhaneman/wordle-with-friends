type BerserkPromptProps = {
  confirming: boolean;
  onYes: () => void;
  onNo: () => void;
};

export function BerserkPrompt({
  confirming,
  onYes,
  onNo,
}: BerserkPromptProps) {
  return (
    <div className="w-full max-w-sm px-2 flex flex-col items-center">
      <h2 className="text-lg font-bold text-warning uppercase tracking-wide text-center">
        Go Berserk?
      </h2>

      <div className="mt-5 flex w-full gap-3">
        <button
          type="button"
          disabled={confirming}
          onClick={onNo}
          className="flex-1 py-2.5 rounded font-semibold text-sm text-ink-muted border border-line-emphasis hover:bg-surface-raised disabled:opacity-50"
        >
          No
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onYes}
          className="flex-1 py-2.5 rounded font-semibold text-sm uppercase tracking-wide bg-warning-strong text-canvas hover:bg-warning disabled:opacity-50"
        >
          {confirming ? "…" : "Yes"}
        </button>
      </div>
    </div>
  );
}
