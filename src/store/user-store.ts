// src/store/user-store.ts
import { create } from 'zustand';

interface UserState {
  currentLevel: number;
  currentXP: number;
  archetype: string;
  eaScore: number; // Effort Allocation Score
  
  // Actions
  updateUserStats: (level: number, xp: number, archetype: string) => void;
  addXP: (amount: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentLevel: 1,
  currentXP: 0,
  archetype: 'Newbie',
  eaScore: 0,

  updateUserStats: (level, xp, archetype) => set({ 
    currentLevel: level, 
    currentXP: xp, 
    archetype 
  }),

  addXP: (amount) => set((state) => ({ currentXP: state.currentXP + amount })),
}));