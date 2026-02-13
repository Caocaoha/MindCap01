import { create } from 'zustand';
import { IUserProfile } from '../database/types';

interface UserState {
  currentLevel: number; // Đổi từ 'level'
  eaScore: number;      // Đổi từ 'xp'
  archetype: string;
  // ... các trường khác
}

export const useUserStore = create<UserState>((set) => ({
  currentLevel: 1,
  eaScore: 0,
  archetype: 'newbie',
  // ...
}));