import { create } from 'zustand';

interface UIState {
  isTyping: boolean;
  setTyping: (status: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTyping: false,
  setTyping: (status) => set({ isTyping: status }),
}));