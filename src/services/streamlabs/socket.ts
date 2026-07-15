import io from "socket.io-client";
import type { ConnectionStatus } from "../../types";

const SOCKET_URL = "https://sockets.streamlabs.com";

export interface Donation {
  /** Amount in cents, parsed from Streamlabs' decimal string. */
  cents: number;
  name?: string;
  formatted?: string;
}

interface StreamlabsEvent {
  type: string;
  message?: Array<{
    donation_id?: number | string;
    name?: string;
    amount?: string | number;
    formatted_amount?: string;
  }>;
}

export interface StreamlabsCallbacks {
  onStatus(status: ConnectionStatus, error?: string): void;
  onDonation(donation: Donation): void;
}

/**
 * Streamlabs pushes alerts over socket.io. The socket token comes from
 * Streamlabs Dashboard → Settings → API Settings → API Tokens.
 */
export class StreamlabsSocket {
  private socket: SocketIOClient.Socket | null = null;
  private seenDonationIds = new Set<string>();

  constructor(private callbacks: StreamlabsCallbacks) {}

  connect(token: string): void {
    this.disconnectSocket();
    this.callbacks.onStatus("connecting");

    const socket = io(`${SOCKET_URL}?token=${encodeURIComponent(token)}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelayMax: 30_000,
    });
    this.socket = socket;

    socket.on("connect", () => this.callbacks.onStatus("connected"));
    socket.on("reconnecting", () => this.callbacks.onStatus("connecting"));
    socket.on("connect_error", () => {
      // socket.io keeps retrying; only surface the terminal failure below.
    });
    socket.on("reconnect_failed", () => {
      this.callbacks.onStatus("error", "Could not reach Streamlabs — check the socket token");
      this.disconnectSocket();
    });
    socket.on("event", (data: StreamlabsEvent) => this.handleEvent(data));
  }

  disconnect(): void {
    this.disconnectSocket();
    this.callbacks.onStatus("disconnected");
  }

  private handleEvent(data: StreamlabsEvent): void {
    if (data.type !== "donation" || !Array.isArray(data.message)) return;
    for (const d of data.message) {
      const id = d.donation_id != null ? String(d.donation_id) : null;
      if (id) {
        if (this.seenDonationIds.has(id)) continue;
        this.seenDonationIds.add(id);
        if (this.seenDonationIds.size > 200) {
          const oldest = this.seenDonationIds.values().next().value;
          if (oldest) this.seenDonationIds.delete(oldest);
        }
      }
      const amount = typeof d.amount === "string" ? parseFloat(d.amount) : (d.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      this.callbacks.onDonation({
        cents: Math.round(amount * 100),
        name: d.name,
        formatted: d.formatted_amount,
      });
    }
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
  }
}

/** One-shot connectivity check used by the Test button in Settings. */
export function testStreamlabsToken(token: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET_URL}?token=${encodeURIComponent(token)}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out connecting to Streamlabs"));
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.close();
      resolve();
    });
    socket.on("connect_error", () => {
      clearTimeout(timer);
      socket.close();
      reject(new Error("Streamlabs refused the connection — check the socket token"));
    });
  });
}
