import { create } from "zustand";
import type { Release } from "../services/updates";

interface UpdateStore {
  available: Release | null;
  checking: boolean;
  error: string | null;
  setAvailable(release: Release | null): void;
  setChecking(checking: boolean): void;
  setError(error: string | null): void;
  clear(): void;
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  available: null,
  checking: false,
  error: null,
  setAvailable: (release) => set({ available: release, error: null }),
  setChecking: (checking) => set({ checking }),
  setError: (error) => set({ error }),
  clear: () => set({ available: null, checking: false, error: null }),
}));
