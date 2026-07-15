import { openUrl } from "@tauri-apps/plugin-opener";

const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Open a link in the system browser (falls back to window.open outside Tauri). */
export function openExternal(url: string): void {
  if (inTauri) {
    void openUrl(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}
