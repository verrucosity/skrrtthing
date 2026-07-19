import { create } from "zustand";

/** Lets Settings (or anywhere) re-open the setup wizard on demand. */
interface WizardStore {
  open: boolean;
  show(): void;
  hide(): void;
}

export const useWizardStore = create<WizardStore>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
