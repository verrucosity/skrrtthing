import type { SubTier } from "../../types";

/** Result of https://id.twitch.tv/oauth2/validate */
export interface TokenInfo {
  client_id: string;
  login: string;
  user_id: string;
  scopes: string[];
  expires_in: number;
}

export interface TwitchAuth {
  token: string;
  clientId: string;
  broadcasterId: string;
  login: string;
}

/** EventSub websocket envelope. */
export interface EventSubMessage {
  metadata: {
    message_id: string;
    message_type:
      | "session_welcome"
      | "session_keepalive"
      | "session_reconnect"
      | "notification"
      | "revocation";
    subscription_type?: string;
  };
  payload: {
    session?: {
      id: string;
      keepalive_timeout_seconds: number | null;
      reconnect_url: string | null;
    };
    subscription?: { type: string; status: string };
    event?: Record<string, unknown>;
  };
}

/** channel.bits.use, covers cheers and every power-up (Gigantify, Celebration, effects). */
export interface BitsUseEvent {
  user_name: string | null;
  bits: number;
  type: "cheer" | "power_up";
  power_up: { type: string } | null;
}

/** channel.subscribe, new subs. `is_gift` recipients are counted via the gift event instead. */
export interface SubscribeEvent {
  user_name: string;
  tier: SubTier;
  is_gift: boolean;
}

/** channel.subscription.message, resubs announced in chat. */
export interface ResubEvent {
  user_name: string;
  tier: SubTier;
  cumulative_months: number;
}

/** channel.subscription.gift */
export interface GiftEvent {
  user_name: string | null;
  tier: SubTier;
  total: number;
  is_anonymous: boolean;
}

/** Normalized events handed to the rest of the app. */
export type TwitchEvent =
  | { type: "bits"; bits: number; user?: string; via?: string }
  | { type: "sub"; tier: SubTier; user?: string; isResub: boolean; months?: number }
  | { type: "gift"; tier: SubTier; total: number; user?: string };
