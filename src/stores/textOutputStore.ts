import { create } from "zustand";

/** Track write status for both weekly and Saturday OBS text files. */
interface TextOutputStore {
  weeklyLastWriteAt: string | null;
  weeklyError: string | null;
  saturdayLastWriteAt: string | null;
  saturdayError: string | null;
  recordSuccess(): void;
  recordWeeklyError(message: string): void;
  recordSaturdayError(message: string): void;
  clear(): void;
}

export const useTextOutputStore = create<TextOutputStore>((set) => ({
  weeklyLastWriteAt: null,
  weeklyError: null,
  saturdayLastWriteAt: null,
  saturdayError: null,

  recordSuccess: () =>
    set({
      weeklyLastWriteAt: new Date().toISOString(),
      weeklyError: null,
      saturdayLastWriteAt: new Date().toISOString(),
      saturdayError: null,
    }),

  recordWeeklyError: (message) => set({ weeklyError: message }),
  recordSaturdayError: (message) => set({ saturdayError: message }),

  clear: () =>
    set({
      weeklyLastWriteAt: null,
      weeklyError: null,
      saturdayLastWriteAt: null,
      saturdayError: null,
    }),
}));
