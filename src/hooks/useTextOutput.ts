import { useEffect } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTextOutputStore } from "../stores/textOutputStore";
import { renderGoalText, writeTextFile } from "../lib/textOutput";

const REFRESH_MS = 5000;

async function sync(): Promise<void> {
  const { textOutputEnabled, textOutputPath, textOutputTemplate } =
    useSettingsStore.getState();
  const status = useTextOutputStore.getState();

  if (!textOutputEnabled || !textOutputPath.trim()) return;

  const text = renderGoalText(useGoalStore.getState().points, textOutputTemplate);
  try {
    await writeTextFile(textOutputPath.trim(), text);
    status.recordSuccess();
  } catch (err) {
    status.recordError(typeof err === "string" ? err : String(err));
  }
}

/**
 * Keeps the OBS text file in sync: writes immediately when the counter or
 * the output settings change, and refreshes every few seconds so the file
 * comes back even if something deletes it mid-stream.
 */
export function useTextOutput(): void {
  useEffect(() => {
    const unsubGoal = useGoalStore.subscribe((state, prev) => {
      if (state.points !== prev.points) void sync();
    });
    const unsubSettings = useSettingsStore.subscribe((state, prev) => {
      if (
        state.textOutputEnabled !== prev.textOutputEnabled ||
        state.textOutputPath !== prev.textOutputPath ||
        state.textOutputTemplate !== prev.textOutputTemplate
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
