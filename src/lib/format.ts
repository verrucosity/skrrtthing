export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Rounds UP to 3 decimal places first (so display never understates the
 * real total), then drops the 3rd digit to show 2. The stored value itself
 * keeps its full precision (see roundPoints in goal.ts) - this only
 * affects what's shown on screen.
 */
function displayPoints(n: number): number {
  const roundedUpTo3 = Math.ceil(n * 1000) / 1000;
  return Math.floor(roundedUpTo3 * 100) / 100;
}

/** Up to 2 decimal places, trailing zeros trimmed: 21 -> "21", 0.5 -> "0.5", 7.17 -> "7.17" */
export function formatPoints(n: number): string {
  return displayPoints(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Always shows exactly 2 decimal places: 21 -> "21.00", 7.5 -> "7.50" */
export function formatPointsFixed(n: number): string {
  return displayPoints(n).toFixed(2);
}

/**
 * Shows the real stored value with up to 6 decimal places, trailing zeros
 * trimmed. This is the exact number behind the rounded-up display the
 * stream sees - for the streamer's own eyes in the app, not for OBS.
 */
export function formatPointsExact(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
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
