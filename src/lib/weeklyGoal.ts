/**
 * Two separate goal systems that track independently:
 *
 * WEEKLY GOAL: 57, 114, 171, 228... (resets Sunday 8pm Pacific)
 * - Uses the full lifetime points
 * - Target increments by 57 each time
 *
 * SATURDAY GOAL: 19, 38, 57, 76... (resets Saturday 8pm Pacific)
 * - Activated only Saturday 8pm - Sunday 7:59pm Pacific
 * - Takes the weekly counter, subtracts passed goals, divides by 3
 * - Left: (current - 57 * completed) / 3, Right: always 19
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

/** Saturday counter left side: (current - 57 * goals) / 3, as a decimal string with 2 places */
export function saturdayLeft(points: number): string {
  const goals = completedWeeklyGoals(points);
  const value = (points - WEEKLY_STEP * goals) / SATURDAY_DIVISOR;
  return value.toFixed(2);
}

/** Saturday counter right side: always 19 */
export function saturdayRight(): number {
  return SATURDAY_STEP;
}

/** Progress through current weekly goal (0..57). */
export function weeklyProgress(points: number): { done: number; ratio: number } {
  const done = points - completedWeeklyGoals(points) * WEEKLY_STEP;
  return { done, ratio: done / WEEKLY_STEP };
}
