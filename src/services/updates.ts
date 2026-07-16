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

export async function getLatestRelease(): Promise<Release | null> {
  try {
    const res = await fetch(`${GITHUB_API}/${REPO}/releases/latest`);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      tag_name: string;
      name: string;
      body: string;
      assets: Array<{ name: string; browser_download_url: string }>;
    };

    // Find the .msi installer
    const msiAsset = data.assets.find((a) => a.name.endsWith(".msi"));
    if (!msiAsset) return null;

    return {
      tagName: data.tag_name,
      name: data.name,
      body: data.body,
      downloadUrl: msiAsset.browser_download_url,
    };
  } catch {
    return null;
  }
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
