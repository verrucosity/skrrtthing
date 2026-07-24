import { create } from "zustand";
import type { Settings } from "../types";
import { loadSettings, saveSettings } from "../lib/storage";
import { DEFAULT_WEEKLY_TEMPLATE, DEFAULT_SATURDAY_TEMPLATE } from "../lib/textOutput";

const defaults: Settings = {
  onboardingComplete: false,
  twitchToken: "",
  streamlabsToken: "",
  autoConnect: true,
  weeklyOutputEnabled: false,
  weeklyOutputPath: "",
  weeklyOutputTemplate: DEFAULT_WEEKLY_TEMPLATE,
  saturdayOutputTemplate: DEFAULT_SATURDAY_TEMPLATE,
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
    const {
      onboardingComplete,
      twitchToken,
      streamlabsToken,
      autoConnect,
      weeklyOutputEnabled,
      weeklyOutputPath,
      weeklyOutputTemplate,
      saturdayOutputTemplate,
    } = get();
    void saveSettings({
      onboardingComplete,
      twitchToken,
      streamlabsToken,
      autoConnect,
      weeklyOutputEnabled,
      weeklyOutputPath,
      weeklyOutputTemplate,
      saturdayOutputTemplate,
    } satisfies Settings);
  },
}));
