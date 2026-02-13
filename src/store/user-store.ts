import { create } from 'zustand';
import { IUserProfile } from '../database/types';

/**
 * [STATE]: Quản lý trạng thái người dùng, cấp độ (EA) và thuộc tính (Archetype)
 * Đã hợp nhất các khai báo UserState để tránh lỗi TS2395.
 */
export interface UserState {
  // --- Các trường được yêu cầu bảo tồn (Đã đổi tên từ level/xp) ---
  currentLevel: number; 
  eaScore: number;      
  archetype: string;

  // --- Các trường bổ sung để tương thích với Profile & UI ---
  profile: any; // Hoặc định nghĩa cụ thể IUserProfile dựa trên database/types
  loadProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  // --- Khởi tạo giá trị mặc định (Bảo tồn nội dung người dùng cung cấp) ---
  currentLevel: 1,
  eaScore: 0,
  archetype: 'newbie',
  profile: null,

  /**
   * Tải thông tin hồ sơ người dùng
   * Chức năng này cần thiết để hiển thị UserLevelBadge trên Saban.
   */
  loadProfile: async () => {
    try {
      // Giả sử logic lấy dữ liệu profile từ IndexedDB sẽ được đặt tại đây
      // Tạm thời khởi tạo profile để tránh lỗi null khi UI render
      set({ 
        profile: { 
          name: "Lữ hành", 
          joinedAt: Date.now() 
        } 
      });
    } catch (error) {
      console.error("UserStore: loadProfile failed", error);
    }
  },
}));