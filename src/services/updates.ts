/**
 * GitHub releases API for checking app updates.
 * Fetches the latest release from the skrrtthing repo.
 */

export interface Release {
  tagName: string;
  name: string;
  body: string;
  downloadUrl: string;
}

const REPO = "verrucosity/skrrtthing";
const GITHUB_API = "https://api.github.com/repos";

/**
 * Fetches the latest published GitHub release. Throws a descriptive error
 * on failure so callers can tell "no release published" apart from
 * "network/GitHub unreachable" instead of collapsing both into null.
 */
export async function getLatestRelease(): Promise<Release> {
  let res: Response;
  try {
    res = await fetch(`${GITHUB_API}/${REPO}/releases/latest`);
  } catch {
    throw new Error("Couldn't reach GitHub, check your internet connection");
  }

  if (res.status === 404) {
    throw new Error("No release has been published yet");
  }
  if (!res.ok) {
    throw new Error(`GitHub returned an error (HTTP ${res.status})`);
  }

  const data = (await res.json()) as {
    tag_name: string;
    name: string;
    body: string;
    assets: Array<{ name: string; browser_download_url: string }>;
  };

  const msiAsset = data.assets.find((a) => a.name.endsWith(".msi"));
  if (!msiAsset) {
    throw new Error("Latest release has no .msi installer attached");
  }

  return {
    tagName: data.tag_name,
    name: data.name,
    body: data.body,
    downloadUrl: msiAsset.browser_download_url,
  };
}

/** Parse semantic version for comparison. Returns [major, minor, patch] or null. */
function parseVersion(v: string): [number, number, number] | null {
  const match = v.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/** Returns true if latestVersion > currentVersion. */
export function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  if (!current || !latest) return false;

  if (latest[0] !== current[0]) return latest[0] > current[0];
  if (latest[1] !== current[1]) return latest[1] > current[1];
  return latest[2] > current[2];
}
