/**
 * Two goals that track differently:
 *
 * WEEKLY GOAL: 57, 114, 171, 228... forever, off the lifetime point total.
 * Its stats window resets Sunday 8pm Pacific, but the number itself never
 * goes back down.
 *
 * SATURDAY GOAL: 19, 38, 57, 76... The moment Saturday 8pm Pacific hits,
 * whatever the weekly "left number" is at that instant gets divided by 3
 * once, and that's where Saturday starts counting from. After that, every
 * new contribution during the window adds its full value on top, same as
 * normal, it doesn't get divided again. See goalStore's syncSaturdayWindow
 * for where that one-time snapshot actually happens.
 */

export const WEEKLY_STEP = 57;
export const SATURDAY_STEP = 19;
export const SATURDAY_DIVISOR = 3;

/** How many complete weekly goals have been passed. */
export function completedWeeklyGoals(points: number): number {
  return Math.floor(points / WEEKLY_STEP);
}

/** The weekly target (57, 114, 171, 228...). */
export function weeklyTarget(points: number): number {
  return (completedWeeklyGoals(points) + 1) * WEEKLY_STEP;
}

/** Stars for completed weekly goals, one per 57 point goal passed. */
export function weeklyStars(points: number): string {
  return "*".repeat(completedWeeklyGoals(points));
}

/** Progress through the current weekly goal (0..57). */
export function weeklyProgress(points: number): { done: number; ratio: number } {
  const done = points - completedWeeklyGoals(points) * WEEKLY_STEP;
  return { done, ratio: done / WEEKLY_STEP };
}

/** How many complete Saturday goals a given Saturday counter has passed. */
export function completedSaturdayGoals(saturdayPoints: number): number {
  return Math.floor(saturdayPoints / SATURDAY_STEP);
}

/** The Saturday target (19, 38, 57, 76...) based on its own running counter. */
export function saturdayTarget(saturdayPoints: number): number {
  return (completedSaturdayGoals(saturdayPoints) + 1) * SATURDAY_STEP;
}

/** Stars for completed Saturday goals, one per 19 point goal passed during the window. */
export function saturdayStars(saturdayPoints: number): string {
  return "*".repeat(completedSaturdayGoals(saturdayPoints));
}
