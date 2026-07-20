import { invoke } from "@tauri-apps/api/core";
import { weeklyTarget, weeklyStars, saturdayTarget, saturdayStars } from "./weeklyGoal";
import { formatPoints, formatPointsFixed } from "./format";
import { inTauri } from "./env";

export const DEFAULT_WEEKLY_TEMPLATE = "{current} / {target} {stars}";
export const DEFAULT_SATURDAY_TEMPLATE = "{current} / {target} {stars}";

/**
 * Render the weekly goal text. `points` already carries fractional bits and
 * cents directly (see goalStore), so {current} always reflects every
 * contribution exactly, down to the cent/bit. A star gets added every time
 * the target crosses another 57.
 *
 * Placeholders: {current}, {current_decimal}, {target}, {remaining}, {stars}.
 */
export function renderWeeklyText(points: number, template: string): string {
  const target = weeklyTarget(points);
  return (template || DEFAULT_WEEKLY_TEMPLATE)
    .replaceAll("{current}", formatPoints(points))
    .replaceAll("{current_decimal}", formatPointsFixed(points))
    .replaceAll("{target}", String(target))
    .replaceAll("{remaining}", formatPoints(target - points))
    .replaceAll("{stars}", weeklyStars(points))
    .trimEnd();
}

/**
 * Render the Saturday goal text (only active Sat 8pm - Sun 7:59pm PT).
 * `saturdayPoints` is the independent Saturday counter from goalStore, not
 * derived live from the weekly total, so this stays exact even after the
 * one-time divide-by-3 snapshot. A star gets added every time Saturday's
 * own target crosses another 19, separate from weekly's stars.
 *
 * Placeholders: {current}, {target}, {stars}.
 */
export function renderSaturdayText(saturdayPoints: number, template: string): string {
  const target = saturdayTarget(saturdayPoints);
  return (template || DEFAULT_SATURDAY_TEMPLATE)
    .replaceAll("{current}", formatPoints(saturdayPoints))
    .replaceAll("{target}", String(target))
    .replaceAll("{stars}", saturdayStars(saturdayPoints))
    .trimEnd();
}

/** Write via the Rust side. A no-op outside Tauri (browser dev mode). */
export async function writeTextFile(path: string, contents: string): Promise<void> {
  if (!inTauri) return;
  await invoke("write_text_file", { path, contents });
}
