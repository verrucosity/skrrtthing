/**
 * Time windows are in Pacific time (PT):
 *
 * WEEKLY: resets every Sunday 8:00 PM PT (display switches to the Saturday
 * goal at 7:50 PM PT on Saturdays, see below, even though the weekly
 * counter itself keeps accumulating underneath)
 * SATURDAY: Saturday 7:50 PM PT → Sunday 7:50 PM PT (resets Saturday 7:50 PM)
 *
 * All of this is computed from the real Pacific timezone via Intl, not a
 * hardcoded UTC offset - that avoids two bugs a fixed offset has: it
 * silently breaks during DST transitions, and (the one that actually bit
 * us) reading the shifted timestamp back with local Date getters instead
 * of UTC getters means the result is only correct on a machine whose own
 * system timezone happens to be UTC. Every consumer here reads Pacific
 * wall-clock components straight from Intl instead.
 */

const PACIFIC_TZ = "America/Los_Angeles";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const SATURDAY_WINDOW_HOUR = 19;
const SATURDAY_WINDOW_MINUTE = 50;

interface PacificParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday
  hour: number; // 0-23
  minute: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

/** Reads the actual Pacific wall-clock date/time for a real UTC instant. */
function getPacificParts(utc: Date): PacificParts {
  const parts = partsFormatter.formatToParts(utc);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")],
    hour: Number(get("hour")) % 24, // midnight can format as "24" with hour12: false
    minute: Number(get("minute")),
  };
}

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  timeZoneName: "longOffset",
});

/** Pacific's current UTC offset in minutes (negative), accounting for DST. */
function getPacificOffsetMinutes(utc: Date): number {
  const part = offsetFormatter.formatToParts(utc).find((p) => p.type === "timeZoneName")!.value;
  const match = part.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return -7 * 60; // fallback: PDT
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** Converts Pacific wall-clock date/time components to the real UTC instant. */
function pacificToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offsetMinutes = getPacificOffsetMinutes(new Date(guess));
  return new Date(guess - offsetMinutes * 60 * 1000);
}

/** True once `hour:minute` is at or past the Saturday window's start time (7:50 PM). */
function isAtOrPastWindowStart(hour: number, minute: number): boolean {
  return hour > SATURDAY_WINDOW_HOUR || (hour === SATURDAY_WINDOW_HOUR && minute >= SATURDAY_WINDOW_MINUTE);
}

/** Most recent Sunday 8 PM PT at or before `now`. */
export function weeklyStart(now: Date = new Date()): Date {
  const pt = getPacificParts(now);
  // On Sunday itself: if it's already past 8pm, today is the reset day (0
  // days back). If it's still before 8pm, this week's reset hasn't
  // happened yet, so the most recent one was last Sunday (7 days back).
  const daysSinceSunday = pt.weekday === 0 ? (pt.hour >= 20 ? 0 : 7) : pt.weekday;
  const anchor = pacificToUtc(pt.year, pt.month, pt.day, 0, 0);
  const backOffMs = daysSinceSunday * 24 * 60 * 60 * 1000;
  const sundayMidnightUtc = new Date(anchor.getTime() - backOffMs);
  const sundayPt = getPacificParts(sundayMidnightUtc);
  return pacificToUtc(sundayPt.year, sundayPt.month, sundayPt.day, 20, 0);
}

/** Next Sunday 8 PM PT. */
export function nextWeeklyStart(now: Date = new Date()): Date {
  const start = weeklyStart(now);
  const sevenDaysLater = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pt = getPacificParts(sevenDaysLater);
  return pacificToUtc(pt.year, pt.month, pt.day, 20, 0);
}

/** Most recent Saturday 7:50 PM PT at or before `now`. */
export function saturdayStart(now: Date = new Date()): Date {
  const pt = getPacificParts(now);
  const isSaturdayInWindow = pt.weekday === 6 && isAtOrPastWindowStart(pt.hour, pt.minute);

  if (isSaturdayInWindow) {
    return pacificToUtc(pt.year, pt.month, pt.day, SATURDAY_WINDOW_HOUR, SATURDAY_WINDOW_MINUTE);
  }

  // On Saturday itself but before the window opens (7:50pm), the most
  // recent past window start was last Saturday (7 days back), not today.
  const daysSinceSaturday = pt.weekday === 6 ? 7 : (pt.weekday + 1) % 7;
  const backOffMs = daysSinceSaturday * 24 * 60 * 60 * 1000;
  const saturdayMidnightUtc = new Date(pacificToUtc(pt.year, pt.month, pt.day, 0, 0).getTime() - backOffMs);
  const satPt = getPacificParts(saturdayMidnightUtc);
  return pacificToUtc(satPt.year, satPt.month, satPt.day, SATURDAY_WINDOW_HOUR, SATURDAY_WINDOW_MINUTE);
}

/** Next Saturday 7:50 PM PT. */
export function nextSaturdayStart(now: Date = new Date()): Date {
  const start = saturdayStart(now);
  const sevenDaysLater = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pt = getPacificParts(sevenDaysLater);
  return pacificToUtc(pt.year, pt.month, pt.day, SATURDAY_WINDOW_HOUR, SATURDAY_WINDOW_MINUTE);
}

/** Is it currently in the Saturday 7:50 PM - Sunday 7:50 PM PT window? */
export function isInSaturdayWindow(now: Date = new Date()): boolean {
  const pt = getPacificParts(now);
  // Saturday at/past 7:50 PM, or Sunday before 7:50 PM
  return (
    (pt.weekday === 6 && isAtOrPastWindowStart(pt.hour, pt.minute)) ||
    (pt.weekday === 0 && !isAtOrPastWindowStart(pt.hour, pt.minute))
  );
}

/** Stable yyyy-mm-dd key (Pacific date) for the weekly window. */
export function weeklyKey(now: Date = new Date()): string {
  const pt = getPacificParts(weeklyStart(now));
  return `${pt.year}-${String(pt.month).padStart(2, "0")}-${String(pt.day).padStart(2, "0")}`;
}

/** Stable key for the Saturday window. */
export function saturdayKey(now: Date = new Date()): string {
  const pt = getPacificParts(saturdayStart(now));
  return `${pt.year}-${String(pt.month).padStart(2, "0")}-${String(pt.day).padStart(2, "0")}`;
}
