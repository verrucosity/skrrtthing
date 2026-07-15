import type { SubTier } from "../types";

/** Goals come in groups of 19: 19, 38, 57, 76... */
export const GOAL_STEP = 19;

export const BITS_PER_POINT = 600;
export const CENTS_PER_POINT = 600; // $6.00

export const SUB_POINTS: Record<SubTier, number> = {
  "1000": 1,
  "2000": 2,
  "3000": 6,
};

/** How many goals the counter has fully crossed. Also the number of stars. */
export function completedGoals(points: number): number {
  return Math.floor(points / GOAL_STEP);
}

/** The target advances by 19 every time it's reached, forever. */
export function currentTarget(points: number): number {
  return (completedGoals(points) + 1) * GOAL_STEP;
}

export function stars(points: number): string {
  return "*".repeat(completedGoals(points));
}

/** Progress through the current group of 19, for the progress bar. */
export function segmentProgress(points: number): { done: number; ratio: number } {
  const done = points - completedGoals(points) * GOAL_STEP;
  return { done, ratio: done / GOAL_STEP };
}

/**
 * Fold an amount into a running remainder and return whole points earned.
 * Used for bits (600 = +1) and donation cents (600 = +1) so small
 * contributions accumulate instead of being discarded.
 */
export function bankedPoints(
  remainder: number,
  amount: number,
  perPoint: number,
): { points: number; remainder: number } {
  const total = remainder + amount;
  return { points: Math.floor(total / perPoint), remainder: total % perPoint };
}
