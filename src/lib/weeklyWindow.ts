/**
 * Time windows are in Pacific time (PT):
 *
 * WEEKLY: Sunday 8:00 PM PT → Saturday 7:59 PM PT (resets Sunday 8 PM)
 * SATURDAY: Saturday 8:00 PM PT → Sunday 7:59 PM PT (resets Saturday 8 PM)
 */

function toPacificTime(utc: Date): Date {
  // Convert UTC to Pacific by subtracting 7 hours (PDT; adjust for PST as needed)
  return new Date(utc.getTime() - 7 * 60 * 60 * 1000);
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

/** Most recent Saturday 8 PM PT at or before `now`. */
export function saturdayStart(now: Date = new Date()): Date {
  const pt = toPacificTime(now);
  const day = pt.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = pt.getHours();

  const d = new Date(pt.getFullYear(), pt.getMonth(), pt.getDate());

  // If it's Saturday and >= 8 PM, start is today 8 PM
  if (day === 6 && hour >= 20) {
    d.setHours(20, 0, 0, 0);
  } else {
    // Go back to the most recent Saturday, then add 8 PM
    const daysSinceSaturday = (day + 1) % 7;
    d.setDate(d.getDate() - daysSinceSaturday);
    d.setHours(20, 0, 0, 0);
  }

  // Convert back to UTC
  return new Date(d.getTime() + 7 * 60 * 60 * 1000);
}

/** Next Saturday 8 PM PT. */
export function nextSaturdayStart(now: Date = new Date()): Date {
  const start = saturdayStart(now);
  start.setDate(start.getDate() + 7);
  return start;
}

/** Is it currently in the Saturday 8 PM - Sunday 7:59 PM PT window? */
export function isInSaturdayWindow(now: Date = new Date()): boolean {
  const pt = toPacificTime(now);
  const day = pt.getDay();
  const hour = pt.getHours();

  // Saturday >= 8 PM or Sunday < 8 PM
  return (day === 6 && hour >= 20) || (day === 0 && hour < 20);
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
