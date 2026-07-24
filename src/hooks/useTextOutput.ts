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

  // One file: shows the Saturday goal during its window (Sat 8pm - Sun
  // 7:59pm PT), and the weekly goal the rest of the time.
  if (settings.weeklyOutputEnabled && settings.weeklyOutputPath.trim()) {
    const text = isInSaturdayWindow()
      ? renderSaturdayText(state.saturday.points, settings.saturdayOutputTemplate)
      : renderWeeklyText(state.points, settings.weeklyOutputTemplate);
    try {
      await writeTextFile(settings.weeklyOutputPath.trim(), text);
    } catch (err) {
      status.recordWeeklyError(typeof err === "string" ? err : String(err));
    }
  }

  status.recordSuccess();
}

/**
 * Keeps the OBS text file in sync: writes immediately when the counter or
 * output settings change, and refreshes every few seconds. The file itself
 * switches content at the Saturday window boundary (Sat 8pm - Sun 7:59pm
 * PT) rather than writing to a second file.
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
