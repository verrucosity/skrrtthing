import type { SubTier } from "../types";

export const BITS_PER_POINT = 600;
export const CENTS_PER_POINT = 600; // $6.00

export const SUB_POINTS: Record<SubTier, number> = {
  "1000": 1,
  "2000": 2,
  "3000": 6,
};

/**
 * Clean up floating-point noise (like 0.1 + 0.2 = 0.30000000000000004)
 * without discarding real precision. Every point value passes through this
 * before being stored, so the full decimal from bits/600 or cents/600
 * divisions is kept intact - only display formatting (formatPoints,
 * formatPointsFixed in format.ts) rounds to 2 decimal places for showing.
 */
export function roundPoints(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
