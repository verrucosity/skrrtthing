/**
 * Two goals that track differently:
 *
 * WEEKLY GOAL: 57, 114, 171, 228... (climbing in 57-blocks within a single
 * week, resetting to 0 every Sunday 7pm Pacific along with everything
 * else). Driven by goalStore's week.points, not the lifetime total - the
 * lifetime total (points) still exists separately for the Statistics page,
 * it just doesn't drive the live goal widget anymore.
 *
 * SATURDAY GOAL: 19, 38, 57, 76... The moment Saturday 7pm Pacific hits,
 * whatever the weekly "left number" is at that instant gets divided by 3
 * once, and that's where Saturday starts counting from. After that, every
 * new contribution during the window adds its full value on top, same as
 * normal, it doesn't get divided again. See goalStore's syncSaturdayWindow
 * for where that one-time snapshot actually happens.
 *
 * The step (57 / 19) can be overridden from Settings (see
 * settingsStore's weeklyStepOverride / saturdayStepOverride) - every
 * function here takes the step as an optional last argument for that,
 * falling back to the normal default when not given.
 */

export const WEEKLY_STEP = 57;
export const SATURDAY_STEP = 19;
export const SATURDAY_DIVISOR = 3;

/** How many complete weekly goals have been passed. */
export function completedWeeklyGoals(points: number, step: number = WEEKLY_STEP): number {
  return Math.floor(points / step);
}

/** The weekly target (57, 114, 171, 228... or a custom step). */
export function weeklyTarget(points: number, step: number = WEEKLY_STEP): number {
  return (completedWeeklyGoals(points, step) + 1) * step;
}

/** Stars for completed weekly goals, one per step passed. */
export function weeklyStars(points: number, step: number = WEEKLY_STEP): string {
  return "*".repeat(completedWeeklyGoals(points, step));
}

/** Progress through the current weekly goal (0..step). */
export function weeklyProgress(
  points: number,
  step: number = WEEKLY_STEP,
): { done: number; ratio: number } {
  const done = points - completedWeeklyGoals(points, step) * step;
  return { done, ratio: done / step };
}

/** How many complete Saturday goals a given Saturday counter has passed. */
export function completedSaturdayGoals(saturdayPoints: number, step: number = SATURDAY_STEP): number {
  return Math.floor(saturdayPoints / step);
}

/** The Saturday target (19, 38, 57, 76... or a custom step) based on its own running counter. */
export function saturdayTarget(saturdayPoints: number, step: number = SATURDAY_STEP): number {
  return (completedSaturdayGoals(saturdayPoints, step) + 1) * step;
}

/** Stars for completed Saturday goals, one per step passed during the window. */
export function saturdayStars(saturdayPoints: number, step: number = SATURDAY_STEP): string {
  return "*".repeat(completedSaturdayGoals(saturdayPoints, step));
}
