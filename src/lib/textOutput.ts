import { invoke } from "@tauri-apps/api/core";
import { currentTarget, stars } from "./goal";
import { inTauri } from "./env";

export const DEFAULT_TEMPLATE = "{current} / {target} {stars}";

/**
 * Render the goal line written to the OBS text file. Supported placeholders:
 * {current}, {target}, {stars}, {remaining}.
 */
export function renderGoalText(points: number, template: string): string {
  return (template || DEFAULT_TEMPLATE)
    .replaceAll("{current}", String(points))
    .replaceAll("{target}", String(currentTarget(points)))
    .replaceAll("{stars}", stars(points))
    .replaceAll("{remaining}", String(currentTarget(points) - points))
    .trimEnd();
}

/** Write via the Rust side. A no-op outside Tauri (browser dev mode). */
export async function writeTextFile(path: string, contents: string): Promise<void> {
  if (!inTauri) return;
  await invoke("write_text_file", { path, contents });
}
