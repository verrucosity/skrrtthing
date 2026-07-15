import { createSubscription } from "./api";
import type {
  BitsUseEvent,
  EventSubMessage,
  GiftEvent,
  ResubEvent,
  SubscribeEvent,
  TwitchAuth,
  TwitchEvent,
} from "./types";
import type { ConnectionStatus } from "../../types";

const EVENTSUB_URL = "wss://eventsub.wss.twitch.tv/ws";

/** Topics we listen to. All are broadcaster-scoped, version 1. */
const TOPICS = [
  "channel.bits.use",
  "channel.subscribe",
  "channel.subscription.gift",
  "channel.subscription.message",
];

const POWER_UP_LABELS: Record<string, string> = {
  gigantify_an_emote: "Gigantify",
  celebration: "Celebration",
  message_effect: "Message Effect",
};

export interface EventSubCallbacks {
  onStatus(status: ConnectionStatus, error?: string): void;
  onEvent(event: TwitchEvent): void;
}

/**
 * EventSub over websocket: connect, receive a session id in the welcome
 * message, register subscriptions against it via Helix, then consume
 * notifications. Handles keepalive timeouts, Twitch-initiated reconnects
 * and dropped connections with backoff.
 */
export class TwitchEventSub {
  private ws: WebSocket | null = null;
  private auth: TwitchAuth | null = null;
  private keepaliveTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveMs = 40_000;
  private reconnectAttempts = 0;
  private intentionalClose = false;
  private seenMessageIds = new Set<string>();

  constructor(private callbacks: EventSubCallbacks) {}

  connect(auth: TwitchAuth): void {
    this.auth = auth;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this.callbacks.onStatus("connecting");
    this.open(EVENTSUB_URL);
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.teardown();
    this.callbacks.onStatus("disconnected");
  }

  private open(url: string, replacing?: WebSocket | null): void {
    const ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      let msg: EventSubMessage;
      try {
        msg = JSON.parse(raw.data as string) as EventSubMessage;
      } catch {
        return;
      }
      // Only the active (or soon-to-be-active) socket resets the watchdog.
      if (ws === this.ws || msg.metadata.message_type === "session_welcome") {
        this.handleMessage(msg, ws, replacing);
      }
    };
    ws.onclose = () => {
      if (ws !== this.ws) return; // an old socket we already replaced
      this.clearKeepalive();
      if (!this.intentionalClose) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // onclose fires afterwards and owns the reconnect.
    };
    if (!replacing) this.ws = ws;
  }

  private handleMessage(
    msg: EventSubMessage,
    ws: WebSocket,
    replacing?: WebSocket | null,
  ): void {
    this.armKeepalive();

    switch (msg.metadata.message_type) {
      case "session_welcome": {
        const session = msg.payload.session;
        if (!session) return;
        if (session.keepalive_timeout_seconds) {
          this.keepaliveMs = session.keepalive_timeout_seconds * 1000 + 10_000;
        }
        if (replacing) {
          // Twitch-initiated reconnect: the new socket is live, drop the old one.
          replacing.onclose = null;
          replacing.close();
          this.ws = ws;
          this.callbacks.onStatus("connected");
        } else {
          void this.subscribeAll(session.id);
        }
        break;
      }
      case "session_keepalive":
        break;
      case "session_reconnect": {
        const url = msg.payload.session?.reconnect_url;
        if (url) this.open(url, this.ws);
        break;
      }
      case "notification":
        this.handleNotification(msg);
        break;
      case "revocation": {
        const type = msg.payload.subscription?.type ?? "a subscription";
        this.fail(`Twitch revoked ${type} — reconnect with a fresh token`);
        break;
      }
    }
  }

  private async subscribeAll(sessionId: string): Promise<void> {
    if (!this.auth) return;
    const condition = { broadcaster_user_id: this.auth.broadcasterId };
    try {
      for (const type of TOPICS) {
        await createSubscription(this.auth, sessionId, type, "1", condition);
      }
      this.reconnectAttempts = 0;
      this.callbacks.onStatus("connected");
    } catch (err) {
      this.fail(err instanceof Error ? err.message : String(err));
    }
  }

  private handleNotification(msg: EventSubMessage): void {
    const id = msg.metadata.message_id;
    if (this.seenMessageIds.has(id)) return; // Twitch may redeliver
    this.seenMessageIds.add(id);
    if (this.seenMessageIds.size > 500) {
      const oldest = this.seenMessageIds.values().next().value;
      if (oldest) this.seenMessageIds.delete(oldest);
    }

    const event = msg.payload.event;
    if (!event) return;

    switch (msg.metadata.subscription_type) {
      case "channel.bits.use": {
        const e = event as unknown as BitsUseEvent;
        this.callbacks.onEvent({
          type: "bits",
          bits: e.bits,
          user: e.user_name ?? undefined,
          via: e.power_up ? (POWER_UP_LABELS[e.power_up.type] ?? "Power-up") : undefined,
        });
        break;
      }
      case "channel.subscribe": {
        const e = event as unknown as SubscribeEvent;
        if (e.is_gift) break; // counted by channel.subscription.gift
        this.callbacks.onEvent({ type: "sub", tier: e.tier, user: e.user_name, isResub: false });
        break;
      }
      case "channel.subscription.message": {
        const e = event as unknown as ResubEvent;
        this.callbacks.onEvent({
          type: "sub",
          tier: e.tier,
          user: e.user_name,
          isResub: true,
          months: e.cumulative_months,
        });
        break;
      }
      case "channel.subscription.gift": {
        const e = event as unknown as GiftEvent;
        this.callbacks.onEvent({
          type: "gift",
          tier: e.tier,
          total: e.total,
          user: e.is_anonymous ? "Anonymous" : (e.user_name ?? undefined),
        });
        break;
      }
    }
  }

  private armKeepalive(): void {
    this.clearKeepalive();
    this.keepaliveTimer = setTimeout(() => {
      // No keepalive within the window: the connection is dead.
      this.ws?.close();
    }, this.keepaliveMs);
  }

  private clearKeepalive(): void {
    if (this.keepaliveTimer) clearTimeout(this.keepaliveTimer);
    this.keepaliveTimer = null;
  }

  private scheduleReconnect(): void {
    if (!this.auth) return;
    if (this.reconnectAttempts >= 8) {
      this.fail("Lost connection to Twitch and reconnecting kept failing");
      return;
    }
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.callbacks.onStatus("connecting");
    setTimeout(() => {
      if (!this.intentionalClose) this.open(EVENTSUB_URL);
    }, delay);
  }

  private fail(message: string): void {
    this.teardown();
    this.callbacks.onStatus("error", message);
  }

  private teardown(): void {
    this.clearKeepalive();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
