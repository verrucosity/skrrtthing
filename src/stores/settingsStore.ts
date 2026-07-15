import { create } from "zustand";
import type { Settings } from "../types";
import { loadSettings, saveSettings } from "../lib/storage";

const defaults: Settings = {
  twitchToken: "",
  streamlabsToken: "",
  autoConnect: true,
};

interface SettingsStore extends Settings {
  hydrated: boolean;
  hydrate(): Promise<void>;
  update(patch: Partial<Settings>): void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaults,
  hydrated: false,

  async hydrate() {
    const saved = await loadSettings<Partial<Settings>>();
    if (saved) set({ ...defaults, ...saved });
    set({ hydrated: true });
  },

  update(patch) {
    set(patch);
    const { twitchToken, streamlabsToken, autoConnect } = get();
    void saveSettings({ twitchToken, streamlabsToken, autoConnect });
  },
}));
