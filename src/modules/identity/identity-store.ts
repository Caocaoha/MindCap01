// src/modules/identity/identity-store.ts
import { create } from 'zustand';
import { db } from '../../database/db';
import type { IMood } from '../../database/types';

interface IdentityState {
  isCheckinOpen: boolean;
  
  // Actions
  setCheckinOpen: (isOpen: boolean) => void;
  logMood: (score: number, label: string, note?: string) => Promise<void>;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  isCheckinOpen: false,

  setCheckinOpen: (isOpen) => set({ isCheckinOpen: isOpen }),

  logMood: async (score, label, note) => {
    const newMood: IMood = {
      score,
      label,
      note,
      createdAt: new Date()
    };

    // 1. Lưu vào DB
    await db.moods.add(newMood);

    // 2. (Tương lai) Trigger Evolution Loop để cộng điểm Level
    console.log(`[Identity] 🧠 Mood logged: ${label} (${score})`);
    
    // Đóng UI sau khi lưu
    set({ isCheckinOpen: false });
  }
}));