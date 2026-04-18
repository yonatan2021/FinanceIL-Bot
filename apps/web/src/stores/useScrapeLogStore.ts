import { create } from "zustand";

interface ScrapeLogStore {
  selectedLogId: string | null;
  statusFilter: string;
  setSelectedLog: (id: string | null) => void;
  setStatusFilter: (status: string) => void;
}

export const useScrapeLogStore = create<ScrapeLogStore>()((set) => ({
  selectedLogId: null,
  statusFilter: "all",
  setSelectedLog: (id) => set({ selectedLogId: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
