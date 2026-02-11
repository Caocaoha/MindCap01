import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Archetype } from '../database/types';

interface UserStoreState {
  level: number;
  currentCME: number; // Current Mind Energy (XP)
  archetype: Archetype;
  identity: {
    isCompleted: boolean;
  };
  // Actions
  addCME: (amount: number) => void;
  setLevel: (level: number) => void;
  setArchetype: (archetype: Archetype) => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      level: 1,
      currentCME: 0,
      archetype: 'NEWBIE',
      identity: { isCompleted: false },

      addCME: (amount) => set((state) => ({ currentCME: state.currentCME + amount })),
      setLevel: (level) => set({ level }),
      setArchetype: (archetype) => set({ archetype }),
    }),
    {
      name: 'mindcap-user-storage', // Tên key trong localStorage
    }
  )
);