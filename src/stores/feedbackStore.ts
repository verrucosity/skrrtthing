import { create } from "zustand";
import { loadFeedback, saveFeedback } from "../lib/storage";

export type TicketStatus = "sent" | "seen" | "in progress" | "fixed";

export interface Ticket {
  id: string;
  preview: string;
  at: string;
  status: TicketStatus;
}

const TICKET_LIMIT = 20;

interface FeedbackStore {
  tickets: Ticket[];
  hydrated: boolean;
  hydrate(): Promise<void>;
  addTicket(ticket: Ticket): void;
  applyStatuses(statuses: Record<string, TicketStatus>): void;
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  tickets: [],
  hydrated: false,

  async hydrate() {
    const saved = await loadFeedback<Ticket[]>();
    if (saved) set({ tickets: saved });
    set({ hydrated: true });
  },

  addTicket(ticket) {
    const tickets = [ticket, ...get().tickets].slice(0, TICKET_LIMIT);
    set({ tickets });
    void saveFeedback(tickets);
  },

  /** Merges statuses fetched from the shared status file, matched by id. */
  applyStatuses(statuses) {
    let changed = false;
    const tickets = get().tickets.map((t) => {
      const next = statuses[t.id];
      if (next && next !== t.status) {
        changed = true;
        return { ...t, status: next };
      }
      return t;
    });
    if (changed) {
      set({ tickets });
      void saveFeedback(tickets);
    }
  },
}));
