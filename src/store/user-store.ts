// src/store/user-store.ts
import { create } from 'zustand';
import { db } from '../database/db';
import type { IUserProfile } from '../database/types';
import { levelEngine } from '../services/cme/level-engine'; // Sẽ tạo ở bước sau

interface UserState {
  profile: IUserProfile;
  
  // Actions
  addXp: (amount: number, source: string) => Promise<void>;
  loadProfile: () => Promise<void>;
}

const DEFAULT_PROFILE: IUserProfile = {
  level: 1,
  currentXp: 0,
  archetype: 'newbie',
  eaScore: 0,
  lastAudit: new Date()
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: DEFAULT_PROFILE,

  loadProfile: async () => {
    // Lấy profile từ DB, nếu chưa có thì tạo mới
    const profiles = await db.userProfile.toArray();
    if (profiles.length > 0) {
      set({ profile: profiles[0] });
    } else {
      await db.userProfile.add(DEFAULT_PROFILE);
      set({ profile: DEFAULT_PROFILE });
    }
  },

  addXp: async (amount, source) => {
    const { profile } = get();
    let newXp = profile.currentXp + amount;
    let newLevel = profile.level;
    
    // Tính toán Level Up
    const nextLevelThreshold = levelEngine.getXpForNextLevel(newLevel);
    
    if (newXp >= nextLevelThreshold) {
      newLevel++;
      newXp = newXp - nextLevelThreshold; // Reset XP dư hoặc giữ lại tùy game logic
      // Ở đây ta giữ XP tích lũy tổng: newXp = newXp (cộng dồn)
      // Nhưng theo logic UI thanh bar, ta thường để currentXp chạy từ 0 -> Threshold
      // Để đơn giản cho MVP: currentXp là tích lũy trong level hiện tại.
      
      alert(`🎉 LEVEL UP! Bạn đã đạt cấp độ ${newLevel}!`);
    }

    const updatedProfile = { 
      ...profile, 
      level: newLevel, 
      currentXp: newXp 
    };

    set({ profile: updatedProfile });
    
    // Lưu DB (Giả sử ID user luôn là 1 hoặc lấy từ profile.id)
    if (profile.id) {
        await db.userProfile.update(profile.id, updatedProfile);
    }
    
    console.log(`[CME] 🌟 +${amount} XP from ${source}`);
  }
}));