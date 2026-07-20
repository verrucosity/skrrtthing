import { useEffect } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTextOutputStore } from "../stores/textOutputStore";
import { renderWeeklyText, renderSaturdayText, writeTextFile } from "../lib/textOutput";
import { isInSaturdayWindow } from "../lib/weeklyWindow";

const REFRESH_MS = 5000;

async function sync(): Promise<void> {
  const state = useGoalStore.getState();
  const settings = useSettingsStore.getState();
  const status = useTextOutputStore.getState();

  // Write weekly file
  if (settings.weeklyOutputEnabled && settings.weeklyOutputPath.trim()) {
    const text = renderWeeklyText(state.points, settings.weeklyOutputTemplate);
    try {
      await writeTextFile(settings.weeklyOutputPath.trim(), text);
    } catch (err) {
      status.recordWeeklyError(typeof err === "string" ? err : String(err));
    }
  }

  // Write Saturday file only during the Saturday 8pm - Sunday 7:59pm PT window
  if (
    settings.saturdayOutputEnabled &&
    settings.saturdayOutputPath.trim() &&
    isInSaturdayWindow()
  ) {
    const text = renderSaturdayText(state.saturday.points, settings.saturdayOutputTemplate);
    try {
      await writeTextFile(settings.saturdayOutputPath.trim(), text);
    } catch (err) {
      status.recordSaturdayError(typeof err === "string" ? err : String(err));
    }
  }

  status.recordSuccess();
}

/**
 * Keeps the OBS text files in sync: writes immediately when the counter or
 * output settings change, and refreshes every few seconds. The Saturday file
 * only writes during its active window (Sat 8pm - Sun 7:59pm PT).
 */
export function useTextOutput(): void {
  useEffect(() => {
    const unsubGoal = useGoalStore.subscribe((state, prev) => {
      if (state.points !== prev.points || state.saturday !== prev.saturday) void sync();
    });
    const unsubSettings = useSettingsStore.subscribe((state, prev) => {
      if (
        state.weeklyOutputEnabled !== prev.weeklyOutputEnabled ||
        state.weeklyOutputPath !== prev.weeklyOutputPath ||
        state.weeklyOutputTemplate !== prev.weeklyOutputTemplate ||
        state.saturdayOutputEnabled !== prev.saturdayOutputEnabled ||
        state.saturdayOutputPath !== prev.saturdayOutputPath ||
        state.saturdayOutputTemplate !== prev.saturdayOutputTemplate
      ) {
        void sync();
      }
    });
    const timer = setInterval(() => void sync(), REFRESH_MS);
    void sync();

    return () => {
      unsubGoal();
      unsubSettings();
      clearInterval(timer);
    };
  }, []);
}
