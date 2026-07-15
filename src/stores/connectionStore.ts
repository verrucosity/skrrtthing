import { create } from "zustand";
import type { ServiceState } from "../types";
import { TwitchEventSub } from "../services/twitch/eventsub";
import { missingScopes, validateToken } from "../services/twitch/api";
import { StreamlabsSocket } from "../services/streamlabs/socket";
import { useGoalStore } from "./goalStore";
import { useSettingsStore } from "./settingsStore";

interface ConnectionStore {
  twitch: ServiceState;
  streamlabs: ServiceState;
  connectTwitch(): Promise<void>;
  disconnectTwitch(): void;
  connectStreamlabs(): void;
  disconnectStreamlabs(): void;
}

export const useConnectionStore = create<ConnectionStore>((set) => {
  const goal = () => useGoalStore.getState();

  const twitchClient = new TwitchEventSub({
    onStatus: (status, error) =>
      set((s) => ({ twitch: { ...s.twitch, status, error } })),
    onEvent: (event) => {
      switch (event.type) {
        case "bits":
          goal().addBits(event.bits, { user: event.user, via: event.via });
          break;
        case "sub":
          goal().addSub(event.tier, {
            user: event.user,
            isResub: event.isResub,
            months: event.months,
          });
          break;
        case "gift":
          goal().addGiftSubs(event.tier, event.total, { user: event.user });
          break;
      }
    },
  });

  const streamlabsClient = new StreamlabsSocket({
    onStatus: (status, error) =>
      set((s) => ({ streamlabs: { ...s.streamlabs, status, error } })),
    onDonation: (donation) =>
      goal().addDonation(donation.cents, {
        user: donation.name,
        formatted: donation.formatted,
      }),
  });

  return {
    twitch: { status: "disconnected" },
    streamlabs: { status: "disconnected" },

    async connectTwitch() {
      const token = useSettingsStore.getState().twitchToken.trim();
      if (!token) {
        set({ twitch: { status: "error", error: "No access token set" } });
        return;
      }
      set({ twitch: { status: "connecting" } });
      try {
        const info = await validateToken(token);
        const missing = missingScopes(info);
        if (missing.length > 0) {
          set({
            twitch: {
              status: "error",
              error: `Token is missing scopes: ${missing.join(", ")}`,
            },
          });
          return;
        }
        set({ twitch: { status: "connecting", channel: info.login } });
        twitchClient.connect({
          token,
          clientId: info.client_id,
          broadcasterId: info.user_id,
          login: info.login,
        });
      } catch (err) {
        set({
          twitch: {
            status: "error",
            error: err instanceof Error ? err.message : "Could not reach Twitch",
          },
        });
      }
    },

    disconnectTwitch() {
      twitchClient.disconnect();
      set({ twitch: { status: "disconnected" } });
    },

    connectStreamlabs() {
      const token = useSettingsStore.getState().streamlabsToken.trim();
      if (!token) {
        set({ streamlabs: { status: "error", error: "No socket token set" } });
        return;
      }
      streamlabsClient.connect(token);
    },

    disconnectStreamlabs() {
      streamlabsClient.disconnect();
    },
  };
});
