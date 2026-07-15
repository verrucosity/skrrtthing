/**
 * Weeks reset every Saturday at 00:00 local time. The counter itself never
 * resets — only the weekly stats window rolls over.
 */

const SATURDAY = 6;

/** Most recent Saturday 00:00 at or before `now`. */
export function weekStart(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceSaturday = (d.getDay() - SATURDAY + 7) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d;
}

export function nextReset(now: Date): Date {
  const start = weekStart(now);
  start.setDate(start.getDate() + 7);
  return start;
}

/** Stable yyyy-mm-dd key (local time) used to detect rollover across restarts. */
export function weekKey(now: Date): string {
  const s = weekStart(now);
  const mm = String(s.getMonth() + 1).padStart(2, "0");
  const dd = String(s.getDate()).padStart(2, "0");
  return `${s.getFullYear()}-${mm}-${dd}`;
}
