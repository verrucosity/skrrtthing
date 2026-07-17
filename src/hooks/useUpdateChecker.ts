import { useEffect } from "react";
import { useUpdateStore } from "../stores/updateStore";
import { getLatestRelease, isNewerVersion } from "../services/updates";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const APP_VERSION = "0.1.0";

/** Silent background check — errors are swallowed so a flaky connection doesn't nag the user. */
async function checkSilently(): Promise<void> {
  const { setChecking, setAvailable, setError } = useUpdateStore.getState();
  setChecking(true);
  try {
    const release = await getLatestRelease();
    if (release && isNewerVersion(APP_VERSION, release.tagName)) {
      setAvailable(release);
    } else {
      setError(null);
    }
  } catch {
    // ignore
  } finally {
    setChecking(false);
  }
}

/** Manual check from the Settings button — surfaces errors and "up to date" state. */
export async function checkForUpdatesVerbose(): Promise<void> {
  const { setChecking, setAvailable, setError } = useUpdateStore.getState();
  setChecking(true);
  try {
    const release = await getLatestRelease();
    if (!release) {
      setError("Could not reach GitHub");
      return;
    }
    if (isNewerVersion(APP_VERSION, release.tagName)) {
      setAvailable(release);
    } else {
      setError("You're already on the latest version");
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Update check failed");
  } finally {
    setChecking(false);
  }
}

/**
 * Checks GitHub for a newer release on launch, then every 5 minutes while
 * the app is running. Settings still exposes a manual "Check for Updates"
 * button that reuses the same store and surfaces errors to the user.
 */
export function useUpdateChecker(): void {
  useEffect(() => {
    void checkSilently();
    const timer = setInterval(() => void checkSilently(), CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
}
