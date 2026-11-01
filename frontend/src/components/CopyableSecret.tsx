import { useState } from "react";

type CopyableSecretProps = {
  label: string;
  value: string;
};

export function CopyableSecret({ label, value }: CopyableSecretProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="text-left">
      <p className="text-muted text-xs uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex gap-2">
        <code className="flex-1 bg-canvas border border-line-strong rounded px-3 py-2 text-sm font-mono break-all">
          {revealed ? value : "•".repeat(Math.min(value.length, 14))}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="shrink-0 px-3 py-2 rounded border border-line-emphasis text-sm text-ink-muted hover:bg-surface-raised"
        >
          {revealed ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="shrink-0 px-3 py-2 rounded border border-line-emphasis text-sm text-ink-muted hover:bg-surface-raised"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
