import { create } from 'zustand';

type TabType = 'saban' | 'mind' | 'journey';

interface UIStore {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  isInputMode: boolean;
  setInputMode: (isInput: boolean) => void;
  
  toggleInputMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'mind', // Mặc định vào màn hình chính
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  isInputMode: false,
  setInputMode: (isInput) => set({ isInputMode: isInput }),
  toggleInputMode: () => set((state) => ({ isInputMode: !state.isInputMode })),
}));