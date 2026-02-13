import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingState {
  lastOnlineTimestamp: number;
  updateOnlineTimestamp: () => void;
  isStorageAtRisk: () => boolean;
}

/**
 * [STATE]: Quản lý cấu hình và cơ chế sinh tồn dữ liệu 
 */
export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      lastOnlineTimestamp: Date.now(),

      updateOnlineTimestamp: () => set({ lastOnlineTimestamp: Date.now() }),

      /**
       * Kiểm tra nếu thời gian ngoại tuyến > 3 ngày 
       */
      isStorageAtRisk: () => {
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        return (Date.now() - get().lastOnlineTimestamp) > THREE_DAYS_MS;
      }
    }),
    {
      name: 'mind-cap-settings',
      storage: createJSONStorage(() => localStorage), // Lưu trữ bền vững
    }
  )
);