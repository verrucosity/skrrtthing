import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A read-only value with a one-click copy button — for file paths, URLs, etc. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-300">{label}</p>
      <div className="flex items-center gap-2 rounded-md border border-edge bg-ink px-3 py-2">
        <code className="flex-1 truncate text-sm text-zinc-200">{value}</code>
        <button
          onClick={() => void copy()}
          className="shrink-0 text-zinc-500 hover:text-zinc-200"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}
