import { create } from 'zustand';

interface BotConfigStore {
  isSaving: boolean;
  setSaving: (v: boolean) => void;
}

export const useBotConfigStore = create<BotConfigStore>()((set) => ({
  isSaving: false,
  setSaving: (v) => set({ isSaving: v }),
}));
