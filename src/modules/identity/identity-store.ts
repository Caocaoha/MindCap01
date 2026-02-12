import { create } from 'zustand';

interface IdentityState {
  currentMood: string | null;
  lastUpdate: number | null;
  setMood: (mood: string) => void;
  resetMood: () => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  currentMood: null,
  lastUpdate: null,
  setMood: (mood) => set({ currentMood: mood, lastUpdate: Date.now() }),
  resetMood: () => set({ currentMood: null, lastUpdate: null }),
}));