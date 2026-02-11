// src/store/settingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingState {
  isAutoWipeEnabled: boolean; // Tính năng xóa sau 10 lần sai
  toggleAutoWipe: () => void;
  hasSeenAudit: boolean;      // Đã xem báo cáo audit chưa
  setSeenAudit: () => void;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      isAutoWipeEnabled: false,
      hasSeenAudit: false,
      toggleAutoWipe: () => set((state) => ({ isAutoWipeEnabled: !state.isAutoWipeEnabled })),
      setSeenAudit: () => set({ hasSeenAudit: true }),
    }),
    {
      name: 'mindcap-settings', // Lưu vào localStorage
    }
  )
);