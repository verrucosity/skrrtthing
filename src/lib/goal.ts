import type { SubTier } from "../types";

export const BITS_PER_POINT = 600;
export const CENTS_PER_POINT = 600; // $6.00

export const SUB_POINTS: Record<SubTier, number> = {
  "1000": 1,
  "2000": 2,
  "3000": 6,
};

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
