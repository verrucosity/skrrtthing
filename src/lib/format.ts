export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Up to 2 decimal places, trailing zeros trimmed: 21 -> "21", 0.5 -> "0.5", 7.17 -> "7.17" */
export function formatPoints(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Always shows exactly 2 decimal places: 21 -> "21.00", 7.5 -> "7.50" */
export function formatPointsFixed(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${formatTime(iso)}`;
}

export function formatDate(isoDate: string): string {
  // isoDate is yyyy-mm-dd (local); parse manually to avoid UTC shifting.
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2d 14h" style countdown. */
export function formatUntil(target: Date, now: Date): string {
  let ms = target.getTime() - now.getTime();
  if (ms <= 0) return "now";
  const days = Math.floor(ms / 86_400_000);
  ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
