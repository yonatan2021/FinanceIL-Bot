import { create } from "zustand";

export type BotTab = 'overview' | 'scheduler' | 'logs' | 'activity' | 'users' | 'messages'

interface BotStatusStore {
  activeTab: BotTab;
  setActiveTab: (tab: BotTab) => void;
}

export const useBotStatusStore = create<BotStatusStore>()((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
