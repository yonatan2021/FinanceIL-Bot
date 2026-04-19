import { create } from "zustand";

interface AllowedUsersStore {
  addModalOpen: boolean;
  setAddModalOpen: (open: boolean) => void;
}

export const useAllowedUsersStore = create<AllowedUsersStore>()((set) => ({
  addModalOpen: false,
  setAddModalOpen: (open) => set({ addModalOpen: open }),
}));
