import { create } from "zustand";

export type ScrapeLogStatusFilter = 'all' | 'success' | 'error' | 'partial'

interface ScrapeLogStore {
  selectedLogId: string | null;
  statusFilter: ScrapeLogStatusFilter;
  setSelectedLog: (id: string | null) => void;
  setStatusFilter: (status: ScrapeLogStatusFilter) => void;
}

export const useScrapeLogStore = create<ScrapeLogStore>()((set) => ({
  selectedLogId: null,
  statusFilter: "all",
  setSelectedLog: (id) => set({ selectedLogId: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
