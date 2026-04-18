import { create } from "zustand";

interface BotStatusStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useBotStatusStore = create<BotStatusStore>()((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
