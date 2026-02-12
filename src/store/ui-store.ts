import { create } from 'zustand';

interface UiState {
  isFocusSessionActive: boolean;
  isInputMode: boolean; // [NEW] Trạng thái đang nhập liệu
  
  // Actions
  setFocusSessionActive: (isActive: boolean) => void;
  setInputMode: (isInput: boolean) => void; // [NEW]
}

export const useUiStore = create<UiState>((set) => ({
  isFocusSessionActive: false,
  isInputMode: false, // Mặc định là false

  setFocusSessionActive: (isActive) => set({ isFocusSessionActive: isActive }),
  setInputMode: (isInput) => set({ isInputMode: isInput }),
}));