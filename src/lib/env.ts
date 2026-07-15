/** True when running inside the Tauri webview (vs. `npm run dev` in a browser). */
export const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
