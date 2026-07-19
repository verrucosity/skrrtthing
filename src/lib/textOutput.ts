import { invoke } from "@tauri-apps/api/core";
import { weeklyTarget, saturdayLeft, saturdayTarget, weeklyStars } from "./weeklyGoal";
import { formatPoints, formatPointsFixed } from "./format";
import { inTauri } from "./env";

export const DEFAULT_WEEKLY_TEMPLATE = "{current} / {target}";
export const DEFAULT_SATURDAY_TEMPLATE = "{current} / {target} {stars}";

/**
 * Render the weekly goal text. `points` already carries fractional bits and
 * cents directly (see goalStore), so {current} always reflects every
 * contribution exactly, down to the cent/bit.
 *
 * Placeholders: {current}, {current_decimal}, {target}, {remaining}.
 */
export function renderWeeklyText(points: number, template: string): string {
  const target = weeklyTarget(points);
  return (template || DEFAULT_WEEKLY_TEMPLATE)
    .replaceAll("{current}", formatPoints(points))
    .replaceAll("{current_decimal}", formatPointsFixed(points))
    .replaceAll("{target}", String(target))
    .replaceAll("{remaining}", formatPoints(target - points))
    .trimEnd();
}

/**
 * Render the Saturday goal text (only active Sat 8pm - Sun 7:59pm PT).
 * Placeholders: {current}, {target}, {stars}.
 */
export function renderSaturdayText(points: number, template: string): string {
  const current = saturdayLeft(points);
  const target = saturdayTarget(points);
  const stars = weeklyStars(points);
  return (template || DEFAULT_SATURDAY_TEMPLATE)
    .replaceAll("{current}", current)
    .replaceAll("{target}", String(target))
    .replaceAll("{stars}", stars)
    .trimEnd();
}

/** Write via the Rust side. A no-op outside Tauri (browser dev mode). */
export async function writeTextFile(path: string, contents: string): Promise<void> {
  if (!inTauri) return;
  await invoke("write_text_file", { path, contents });
}
