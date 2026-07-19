import { documentDir, join } from "@tauri-apps/api/path";
import { inTauri } from "./env";

/**
 * Suggested OBS output file paths under the user's Documents folder.
 * Falls back to a readable placeholder in browser dev mode, where the
 * path APIs aren't available and text output is a no-op anyway.
 */
export async function getSuggestedOutputPaths(): Promise<{
  weekly: string;
  saturday: string;
}> {
  if (!inTauri) {
    return {
      weekly: "C:\\Users\\you\\Documents\\skrrt-weekly.txt",
      saturday: "C:\\Users\\you\\Documents\\skrrt-saturday.txt",
    };
  }
  const dir = await documentDir();
  return {
    weekly: await join(dir, "skrrt-weekly.txt"),
    saturday: await join(dir, "skrrt-saturday.txt"),
  };
}
