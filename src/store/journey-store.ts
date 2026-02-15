import { create } from 'zustand';
import { ITask } from '../database/types';
import { db } from '../database/db';

/**
 * [STORE]: Quản lý trạng thái hành trình v4.6.
 * Bổ sung 'spark' vào viewMode để hỗ trợ không gian ký ức độc lập.
 */
export interface JourneyState {
  // --- Task Management (Khôi phục cho Saban/Focus) ---
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  updateTask: (id: number, updates: Partial<ITask>) => void;
  incrementDoneCount: (id: number) => void;

  // --- Action Hub v3.6 ---
  viewMode: 'stats' | 'diary' | 'spark'; // Cập nhật: Thêm chế độ spark
  searchQuery: string;
  hiddenIds: number[];
  linkingItem: { id: number; type: 'task' | 'thought' } | null;
  
  setViewMode: (mode: 'stats' | 'diary' | 'spark') => void; // Cập nhật tham số
  setSearchQuery: (query: string) => void;
  setLinkingItem: (item: { id: number; type: 'task' | 'thought' } | null) => void;
  toggleHide: (id: number) => void;
  calculateOpacity: (lastUpdate: number, isBookmarked?: boolean) => number;
  isDiaryEntry: (item: any) => boolean;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  // Khởi tạo Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  // Cập nhật Task cả trong Store và Database
  updateTask: async (id, updates) => {
    await db.tasks.update(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  // Tăng số lượng thực hiện (Dùng cho Focus/Saban)
  incrementDoneCount: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newCount = (task.doneCount || 0) + 1;
    const isDone = newCount >= (task.targetCount || 1);
    
    const updates: Partial<ITask> = { 
      doneCount: newCount, 
      status: isDone ? 'done' : 'todo' 
    };
    
    await db.tasks.update(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  // States của Action Hub v3.6
  viewMode: 'diary',
  searchQuery: '',
  hiddenIds: [],
  linkingItem: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLinkingItem: (item) => set({ linkingItem: item }),
  
  toggleHide: (id) => set((state) => ({ 
    hiddenIds: [...state.hiddenIds, id] 
  })),

  /**
   * Tính toán độ mờ (Entropy)
   * Giữ nguyên giới hạn 0.1 của bạn để đảm bảo ký ức không biến mất hoàn toàn.
   */
  calculateOpacity: (lastUpdate, isBookmarked) => {
    if (isBookmarked) return 1; 
    const diffDays = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (diffDays / 40);
    return Math.max(0.1, Math.min(1, opacity));
  },

  /**
   * Logic lọc dữ liệu Diary
   * Loại trừ các việc đang active trong Saban.
   */
  isDiaryEntry: (item) => {
    if (item.status === 'active' && !item.isFocusMode) return false;
    return true;
  }
}));