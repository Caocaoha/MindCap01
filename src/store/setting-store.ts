// src/store/setting-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingState {
  theme: 'light' | 'dark' | 'system';
  enableAutoDelete: boolean; // Tính năng tự hủy dữ liệu
  enableHaptic: boolean;     // Rung phản hồi

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleAutoDelete: () => void;
  toggleHaptic: () => void;
}

// Sử dụng persist middleware của Zustand để lưu setting vào localStorage
export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      theme: 'system',
      enableAutoDelete: false,
      enableHaptic: true,

      setTheme: (theme) => set({ theme }),
      toggleAutoDelete: () => set((state) => ({ enableAutoDelete: !state.enableAutoDelete })),
      toggleHaptic: () => set((state) => ({ enableHaptic: !state.enableHaptic })),
    }),
    {
      name: 'mind-cap-settings', // key trong localStorage
    }
  )
);