import { Coins, Gift, Heart, Sliders, UserPlus } from "lucide-react";
import type { LogEntry } from "../../types";
import { formatDateTime, formatPoints } from "../../lib/format";

const icons = {
  bits: Coins,
  sub: UserPlus,
  "gift-sub": Gift,
  donation: Heart,
  manual: Sliders,
} as const;

export function LogRow({ entry, compact = false }: { entry: LogEntry; compact?: boolean }) {
  const Icon = icons[entry.kind];
  const sign = entry.points > 0 ? "+" : entry.points < 0 ? "" : "";
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised text-zinc-400">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{entry.label}</p>
        {!compact && entry.detail && (
          <p className="truncate text-xs text-zinc-500">{entry.detail}</p>
        )}
      </div>
      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
        {formatDateTime(entry.at)}
      </span>
      <span
        className={
          entry.points > 0
            ? "w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-accent-hover"
            : "w-14 shrink-0 text-right text-sm tabular-nums text-zinc-600"
        }
      >
        {sign}
        {formatPoints(entry.points)}
      </span>
    </div>
  );
}
