import { create } from 'zustand';
import { db } from '../database/db'; 
import { ITask } from '../database/types'; 

/**
 * [STATE]: Quản lý trạng thái và logic tính toán cho Tab Hành trình
 * Tuân thủ tuyệt đối Master Doc v3.1
 */
export interface JourneyState {
  // --- Các tính năng hiện có ---
  viewMode: 'stats' | 'diary';
  searchQuery: string;
  setViewMode: (mode: 'stats' | 'diary') => void;
  setSearchQuery: (query: string) => void;
  calculateOpacity: (lastUpdate: number, isBookmarked?: boolean) => number;
  isDiaryEntry: (item: any) => boolean;

  // --- Tính năng Task mới (Atomic) ---
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  updateTask: (id: number, updates: Partial<ITask>) => Promise<void>;
  incrementDoneCount: (id: number) => Promise<void>; 
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  // --- Khởi tạo ---
  viewMode: 'stats',
  searchQuery: '',
  tasks: [],

  // --- Logic hiện có (Bảo toàn 100%) ---
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  /**
   * Tính toán độ mờ Entropy ($Opacity = 1 - (Days/40)$)
   */
  calculateOpacity: (lastUpdate, isBookmarked) => {
    if (isBookmarked) return 1; // Entropy Shield cho Hạt giống
    
    const diffDays = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (diffDays / 40); // 40 ngày tan rã theo journey-constants.ts
    
    return Math.max(0, Math.min(1, opacity));
  },

  /**
   * Bộ lọc Diary: Loại bỏ các task 'backlog' không nằm trong tiêu điểm
   */
  isDiaryEntry: (item) => {
    // Nếu là task, chỉ giữ lại những gì đã hoàn thành (done) hoặc đang focus
    if (item.status === 'backlog' && !item.isFocusMode) {
      return false;
    }
    return true;
  },

  // --- Logic mới: Quản lý Task chuẩn Master Doc v3.1 ---

  setTasks: (tasks) => set({ tasks }),

  /**
   * Cập nhật Task (Fast-lane + Shadow-sync)
   */
  updateTask: async (id, updates) => {
    const allTasks = get().tasks;
    const updatedAt = Date.now(); // Chuẩn number timestamp

    // 1. Fast-lane: Cập nhật UI ngay lập tức
    set({
      tasks: allTasks.map(t => t.id === id ? { ...t, ...updates, updatedAt } : t)
    });

    // 2. Shadow-lane: Ghi vào Dexie DB ngầm
    await db.tasks.update(id, { ...updates, updatedAt });
  },

  /**
   * Tăng số lượng thực hiện nguyên tử (Atomic Increment)
   * Giải quyết lỗi "núm nhảy nhưng không tăng"
   */
  incrementDoneCount: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task || task.status === 'done') return;

    const nextDoneCount = (task.doneCount || 0) + 1;
    const target = task.targetCount || 1; // Mặc định 1 nếu không có target
    
    // Nếu đạt hoặc vượt mục tiêu, tự động chuyển trạng thái 'done'
    const shouldComplete = nextDoneCount >= target;

    const updates: Partial<ITask> = {
      doneCount: nextDoneCount,
      status: shouldComplete ? 'done' : task.status,
    };

    // Gọi hàm updateTask để xử lý cả State và DB
    await get().updateTask(id, updates);
  }
}));