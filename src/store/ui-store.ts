// src/store/ui-store.ts
import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isFocusModeActive: boolean;
  isTyping: boolean;
  isInputFocused: boolean; // [NEW] Trạng thái Input nhảy lên Top

  // Actions
  toggleSidebar: () => void;
  setFocusMode: (isActive: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setInputFocused: (isFocused: boolean) => void; // [NEW]
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  isFocusModeActive: false,
  isTyping: false,
  isInputFocused: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setFocusMode: (isActive) => set({ isFocusModeActive: isActive }),
  setTyping: (isTyping) => set({ isTyping }),
  setInputFocused: (isFocused) => set({ isInputFocused: isFocused }),
}));