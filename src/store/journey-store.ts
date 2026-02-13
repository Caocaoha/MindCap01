import { create } from 'zustand';
import { db } from '../database/db';
import { ITask, IThought } from '../database/types';

/**
 * [STATE]: Quản lý trạng thái của các bản ghi hành trình và nhật ký [cite: 5, 11]
 * Kết nối trực tiếp với Velocity Loop để cập nhật UI ngay lập tức 
 */

interface JourneyState {
  items: (ITask | IThought)[];
  isLoading: boolean;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  addFastLaneItem: (item: ITask | IThought) => void;
  syncFromDatabase: () => Promise<void>;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  items: [],
  isLoading: false,

  /**
   * Tải dữ liệu ban đầu từ Dexie DB [cite: 1, 16]
   */
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [tasks, thoughts] = await Promise.all([
        db.tasks.toArray(),
        db.thoughts.toArray()
      ]);
      
      const combined = [...tasks, ...thoughts].sort((a, b) => b.createdAt - a.createdAt);
      set({ items: combined, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch journey data:", error);
      set({ isLoading: false });
    }
  },

  /**
   * Fast-lane: Cập nhật Store ngay khi người dùng nhập liệu 
   * Giúp giao diện hiển thị "Action Toast" hoặc "Undo Option" mà không chờ DB 
   */
  addFastLaneItem: (item) => {
    set((state) => ({
      items: [item, ...state.items].sort((a, b) => b.createdAt - a.createdAt)
    }));
  },

  /**
   * Shadow-lane: Đồng bộ lại Store sau khi các tiến trình ngầm (NLP/Echo) hoàn tất [cite: 16, 17]
   */
  syncFromDatabase: async () => {
    const [tasks, thoughts] = await Promise.all([
      db.tasks.toArray(),
      db.thoughts.toArray()
    ]);
    const combined = [...tasks, ...thoughts].sort((a, b) => b.createdAt - a.createdAt);
    set({ items: combined });
  }
}));