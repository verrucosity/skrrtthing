import type { TokenInfo } from "./types";

export const REQUIRED_SCOPES = ["bits:read", "channel:read:subscriptions"];

export class TwitchApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TwitchApiError";
  }
}

/** Validate a user access token and discover its client id, user id and scopes. */
export async function validateToken(token: string): Promise<TokenInfo> {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (res.status === 401) {
    throw new TwitchApiError("Token is invalid or has expired", 401);
  }
  if (!res.ok) {
    throw new TwitchApiError(`Token validation failed (HTTP ${res.status})`, res.status);
  }
  return (await res.json()) as TokenInfo;
}

export function missingScopes(info: TokenInfo): string[] {
  const have = new Set(info.scopes ?? []);
  return REQUIRED_SCOPES.filter((s) => !have.has(s));
}

export async function createSubscription(
  auth: { token: string; clientId: string },
  sessionId: string,
  type: string,
  version: string,
  condition: Record<string, string>,
): Promise<void> {
  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Client-Id": auth.clientId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      version,
      condition,
      transport: { method: "websocket", session_id: sessionId },
    }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // keep the status-code message
    }
    throw new TwitchApiError(`Could not subscribe to ${type}: ${detail}`, res.status);
  }
}
