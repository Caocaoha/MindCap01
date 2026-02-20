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
   * [NEW]: Cap nhat Gio Tha Thu vao Database va Store.
   * Dam bao trang thai ton tai vinh vien ngay ca khi chuyen Tab hoac Reset chat.
   */
  updateForgivenessHour: (hour: number) => Promise<void>;
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
   * [NEW]: Xu ly ghi de Gio Tha Thu.
   * Thuc hien cap nhat Atomic vao Database truoc khi dong bo Store.
   */
  updateForgivenessHour: async (hour: number) => {
    try {
      const currentProfile = get().profile;
      if (!currentProfile) return;

      const updatedProfile = { ...currentProfile, forgivenessHour: hour };
      
      // 1. Cap nhat vao Database (Dexie)
      if (currentProfile.id) {
        await db.userProfile.update(currentProfile.id, { forgivenessHour: hour });
      } else {
        // Truong hop dac biet neu chua co ID (ban ghi dau tien)
        const id = await db.userProfile.put(updatedProfile);
        updatedProfile.id = id;
      }

      // 2. Dong bo lai vao Zustand Store
      set({ profile: updatedProfile });
    } catch (error) {
      console.error("UserStore: updateForgivenessHour failed", error);
    }
  }
}));