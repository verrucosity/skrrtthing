import { LazyStore } from "@tauri-apps/plugin-store";
import { inTauri } from "./env";

/**
 * Persistence lives in two JSON files in the app data directory
 * (%APPDATA%/app.goaldock.desktop on Windows):
 *
 *   settings.json — credentials and preferences
 *   data.json     — counter, stats, week state, event log
 *
 * When running the frontend outside Tauri (`npm run dev` in a plain
 * browser) we fall back to localStorage so the UI stays workable.
 */

interface Backend {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
}

function tauriBackend(file: string): Backend {
  const store = new LazyStore(file, { defaults: {}, autoSave: false });
  return {
    async get<T>(key: string) {
      return (await store.get<T>(key)) ?? null;
    },
    async set(key, value) {
      await store.set(key, value);
      await store.save();
    },
  };
}

function localBackend(file: string): Backend {
  const prefix = `goaldock:${file}:`;
  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async set(key, value) {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    },
  };
}

function backend(file: string): Backend {
  return inTauri ? tauriBackend(file) : localBackend(file);
}

const settingsFile = backend("settings.json");
const dataFile = backend("data.json");

export const loadSettings = <T>() => settingsFile.get<T>("settings");
export const loadData = <T>() => dataFile.get<T>("state");
export const saveSettings = (value: unknown) => settingsFile.set("settings", value);

let pending: unknown = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Data changes arrive in bursts (gift bombs), so writes are debounced. */
export function saveData(value: unknown): void {
  pending = value;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void dataFile.set("state", pending);
  }, 300);
}

export function flushData(): void {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
  void dataFile.set("state", pending);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushData);
}
