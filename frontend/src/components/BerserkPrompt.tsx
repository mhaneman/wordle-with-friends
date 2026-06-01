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
      <h2 className="text-lg font-bold text-amber-400 uppercase tracking-wide text-center">
        Go Berserk?
      </h2>

      <div className="mt-5 flex w-full gap-3">
        <button
          type="button"
          disabled={confirming}
          onClick={onNo}
          className="flex-1 py-2.5 rounded font-semibold text-sm text-neutral-300 border border-neutral-600 hover:bg-neutral-800 disabled:opacity-50"
        >
          No
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onYes}
          className="flex-1 py-2.5 rounded font-semibold text-sm uppercase tracking-wide bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {confirming ? "…" : "Yes"}
        </button>
      </div>
    </div>
  );
}
