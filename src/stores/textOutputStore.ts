import { create } from "zustand";

/** Track write status for the OBS text file. */
interface TextOutputStore {
  weeklyLastWriteAt: string | null;
  weeklyError: string | null;
  recordSuccess(): void;
  recordWeeklyError(message: string): void;
  clear(): void;
}

export const useTextOutputStore = create<TextOutputStore>((set) => ({
  weeklyLastWriteAt: null,
  weeklyError: null,

  recordSuccess: () =>
    set({
      weeklyLastWriteAt: new Date().toISOString(),
      weeklyError: null,
    }),

  recordWeeklyError: (message) => set({ weeklyError: message }),

  clear: () =>
    set({
      weeklyLastWriteAt: null,
      weeklyError: null,
    }),
}));
