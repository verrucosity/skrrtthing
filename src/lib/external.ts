import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { inTauri } from "./env";

/** Open a link in the system browser (falls back to window.open outside Tauri). */
export function openExternal(url: string): void {
  if (inTauri) {
    void openUrl(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

/**
 * Downloads the installer from `url` and launches it, then quits this app
 * so the installer can overwrite the running install in place. Outside
 * Tauri (browser dev mode) just opens the link instead, since there's no
 * Rust side to do the download.
 */
export async function downloadAndRunInstaller(url: string): Promise<void> {
  if (!inTauri) {
    openExternal(url);
    return;
  }
  await invoke("download_and_run_installer", { url });
}
