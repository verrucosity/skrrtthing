/**
 * Time windows are in Pacific time (PT):
 *
 * WEEKLY: resets every Sunday 8:00 PM PT (display switches to the Saturday
 * goal at 7:50 PM PT on Saturdays, see below, even though the weekly
 * counter itself keeps accumulating underneath)
 * SATURDAY: Saturday 7:50 PM PT → Sunday 7:50 PM PT (resets Saturday 7:50 PM)
 */

const SATURDAY_WINDOW_HOUR = 19;
const SATURDAY_WINDOW_MINUTE = 50;

function toPacificTime(utc: Date): Date {
  // Convert UTC to Pacific by subtracting 7 hours (PDT; adjust for PST as needed)
  return new Date(utc.getTime() - 7 * 60 * 60 * 1000);
}

/** True once `hour:minute` is at or past the Saturday window's start time (7:50 PM). */
function isAtOrPastWindowStart(hour: number, minute: number): boolean {
  return hour > SATURDAY_WINDOW_HOUR || (hour === SATURDAY_WINDOW_HOUR && minute >= SATURDAY_WINDOW_MINUTE);
}

/** Most recent Sunday 8 PM PT at or before `now`. */
export function weeklyStart(now: Date = new Date()): Date {
  const pt = toPacificTime(now);
  const day = pt.getDay(); // 0 = Sunday
  const hour = pt.getHours();

  const d = new Date(pt.getFullYear(), pt.getMonth(), pt.getDate());

  // If it's Sunday and >= 8 PM, start is today 8 PM
  if (day === 0 && hour >= 20) {
    d.setHours(20, 0, 0, 0);
  } else {
    // Go back to the most recent Sunday, then add 8 PM
    const daysSinceSunday = day;
    d.setDate(d.getDate() - daysSinceSunday);
    d.setHours(20, 0, 0, 0);
  }

  // Convert back to UTC
  return new Date(d.getTime() + 7 * 60 * 60 * 1000);
}

/** Next Sunday 8 PM PT. */
export function nextWeeklyStart(now: Date = new Date()): Date {
  const start = weeklyStart(now);
  start.setDate(start.getDate() + 7);
  return start;
}

/** Most recent Saturday 7:50 PM PT at or before `now`. */
export function saturdayStart(now: Date = new Date()): Date {
  const pt = toPacificTime(now);
  const day = pt.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = pt.getHours();
  const minute = pt.getMinutes();

  const d = new Date(pt.getFullYear(), pt.getMonth(), pt.getDate());

  // If it's Saturday and at/past 7:50 PM, start is today 7:50 PM
  if (day === 6 && isAtOrPastWindowStart(hour, minute)) {
    d.setHours(SATURDAY_WINDOW_HOUR, SATURDAY_WINDOW_MINUTE, 0, 0);
  } else {
    // Go back to the most recent Saturday, then add 7:50 PM
    const daysSinceSaturday = (day + 1) % 7;
    d.setDate(d.getDate() - daysSinceSaturday);
    d.setHours(SATURDAY_WINDOW_HOUR, SATURDAY_WINDOW_MINUTE, 0, 0);
  }

  // Convert back to UTC
  return new Date(d.getTime() + 7 * 60 * 60 * 1000);
}

/** Next Saturday 7:50 PM PT. */
export function nextSaturdayStart(now: Date = new Date()): Date {
  const start = saturdayStart(now);
  start.setDate(start.getDate() + 7);
  return start;
}

/** Is it currently in the Saturday 7:50 PM - Sunday 7:50 PM PT window? */
export function isInSaturdayWindow(now: Date = new Date()): boolean {
  const pt = toPacificTime(now);
  const day = pt.getDay();
  const hour = pt.getHours();
  const minute = pt.getMinutes();

  // Saturday at/past 7:50 PM, or Sunday before 7:50 PM
  return (day === 6 && isAtOrPastWindowStart(hour, minute)) || (day === 0 && !isAtOrPastWindowStart(hour, minute));
}

/** Stable yyyy-mm-dd key (Pacific date) for the weekly window. */
export function weeklyKey(now: Date = new Date()): string {
  const start = weeklyStart(now);
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  return `${start.getUTCFullYear()}-${mm}-${dd}`;
}

/** Stable key for the Saturday window. */
export function saturdayKey(now: Date = new Date()): string {
  const start = saturdayStart(now);
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  return `${start.getUTCFullYear()}-${mm}-${dd}`;
}
