import type { SubTier } from "../types";

export const BITS_PER_POINT = 600;
export const CENTS_PER_POINT = 600; // $6.00

export const SUB_POINTS: Record<SubTier, number> = {
  "1000": 1,
  "2000": 2,
  "3000": 6,
};

/**
 * Round to 2 decimal places. Every point value gets rounded through this
 * before being stored, so floating point error from repeated bits/600 or
 * cents/600 divisions never accumulates into a visible drift over time.
 */
export function roundPoints(n: number): number {
  return Math.round(n * 100) / 100;
}
