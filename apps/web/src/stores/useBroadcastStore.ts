import { create } from "zustand";

interface BroadcastStore {
  draftMessage: string;
  target: "all" | "admins";
  setDraftMessage: (msg: string) => void;
  setTarget: (target: "all" | "admins") => void;
  clear: () => void;
}

export const useBroadcastStore = create<BroadcastStore>()((set) => ({
  draftMessage: "",
  target: "all",
  setDraftMessage: (msg) => set({ draftMessage: msg }),
  setTarget: (target) => set({ target }),
  clear: () => set({ draftMessage: "", target: "all" }),
}));
