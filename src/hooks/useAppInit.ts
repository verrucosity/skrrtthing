import { useEffect, useRef, useState } from "react";
import { useGoalStore } from "../stores/goalStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useConnectionStore } from "../stores/connectionStore";

/**
 * One-time startup: hydrate persisted state, auto-connect if configured,
 * and keep checking for the Saturday rollover while the app runs.
 */
export function useAppInit(): boolean {
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      await Promise.all([
        useGoalStore.getState().hydrate(),
        useSettingsStore.getState().hydrate(),
      ]);

      const settings = useSettingsStore.getState();
      if (settings.autoConnect) {
        const conn = useConnectionStore.getState();
        if (settings.twitchToken) void conn.connectTwitch();
        if (settings.streamlabsToken) conn.connectStreamlabs();
      }
      setReady(true);
    })();

    const interval = setInterval(() => {
      useGoalStore.getState().rolloverIfNeeded();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return ready;
}
