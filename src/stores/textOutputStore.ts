import { create } from "zustand";

/** Write status for the OBS text file, shown in Settings. */
interface TextOutputStore {
  lastWriteAt: string | null;
  error: string | null;
  recordSuccess(): void;
  recordError(message: string): void;
  clear(): void;
}

export const useTextOutputStore = create<TextOutputStore>((set) => ({
  lastWriteAt: null,
  error: null,
  recordSuccess: () => set({ lastWriteAt: new Date().toISOString(), error: null }),
  recordError: (message) => set({ error: message }),
  clear: () => set({ lastWriteAt: null, error: null }),
}));
