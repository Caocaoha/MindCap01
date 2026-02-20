import { create } from 'zustand';
import { IUserProfile } from '../database/types';
import { db } from '../database/db';

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
  profile: IUserProfile | null; 
  loadProfile: () => Promise<void>;
  
  /**
   * [UPDATE]: Chấp nhận cả string (HH:mm) hoặc number.
   * Reset 'lastForgivenessRun' khi cập nhật để kích hoạt Engine ngay lập tức.
   */
  updateForgivenessHour: (hour: string | number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  // --- Khởi tạo giá trị mặc định (Bảo tồn nội dung người dùng cung cấp) ---
  currentLevel: 1,
  eaScore: 0,
  archetype: 'newbie',
  profile: null,

  /**
   * Tải thông tin hồ sơ người dùng
   * Truy van truc tiep tu Dexie de lay Forgiveness Hour va cac thong so thuc te.
   */
  loadProfile: async () => {
    try {
      const profiles = await db.userProfile.toArray();
      const userProfile = profiles[0]; // Mac dinh lay ban ghi dau tien

      if (userProfile) {
        set({ 
          profile: userProfile,
          currentLevel: userProfile.currentLevel,
          eaScore: userProfile.eaScore,
          archetype: userProfile.archetype
        });
      } else {
        // Neu chua co profile (lan dau chay), khoi tao mac dinh
        const initialProfile: IUserProfile = {
          currentLevel: 1,
          eaScore: 0,
          cpiScore: 0,
          totalScore: 0,
          archetype: 'newbie',
          lastReset: Date.now(),
          forgivenessHour: 19, // Mac dinh la 19h
          identityProgress: {
            currentQuestionIndex: 0,
            answers: {},
            draftAnswer: '',
            cooldownEndsAt: null,
            lastAuditAt: null,
            isManifestoUnlocked: false,
            lastStatus: 'newbie'
          }
        };
        set({ profile: initialProfile });
      }
    } catch (error) {
      console.error("UserStore: loadProfile failed", error);
    }
  },

  /**
   * [UPDATE]: Xu ly ghi de Gio Tha Thu.
   * Business Rule: Khi doi gio, phai xoa lastForgivenessRun de Engine co the chay lai ngay.
   */
  updateForgivenessHour: async (hour: string | number) => {
    try {
      const currentProfile = get().profile;
      if (!currentProfile) return;

      /**
       * Tao object moi voi gio moi va reset flag thuc thi.
       * lastForgivenessRun = '' se lam cho logic (lastRun !== today) o Engine luon dung.
       */
      const updatedProfile = { 
        ...currentProfile, 
        forgivenessHour: hour,
        lastForgivenessRun: '' 
      };
      
      // 1. Cap nhat vao Database (Dexie)
      if (currentProfile.id) {
        await db.userProfile.update(currentProfile.id, { 
          forgivenessHour: hour,
          lastForgivenessRun: '' // Bat buoc phai reset
        });
      } else {
        // Truong hop dac biet neu chua co ID (ban ghi dau tien)
        const id = await db.userProfile.put(updatedProfile);
        updatedProfile.id = id;
      }

      // 2. Dong bo lai vao Zustand Store de UI phan hoi tuc thi
      set({ profile: updatedProfile });
    } catch (error) {
      console.error("UserStore: updateForgivenessHour failed", error);
    }
  }
}));