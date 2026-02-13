import { create } from 'zustand';
import { db } from '../database/db'; 
import { ITask } from '../database/types'; 

/**
 * [STATE]: Quản lý trạng thái và logic tính toán cho Tab Hành trình
 * Tuân thủ tuyệt đối Master Doc v3.1
 */
export interface JourneyState {
  // --- Các tính năng hiện có (Bảo tồn 100%) ---
  viewMode: 'stats' | 'diary';
  searchQuery: string;
  setViewMode: (mode: 'stats' | 'diary') => void;
  setSearchQuery: (query: string) => void;
  calculateOpacity: (lastUpdate: number, isBookmarked?: boolean) => number;
  isDiaryEntry: (item: any) => boolean;

  // --- Tính năng Task (Tích hợp Dò lỗi chuyên sâu) ---
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

  // --- Logic hiện có (Bảo tồn 100%) ---
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  /**
   * Tính toán độ mờ Entropy ($Opacity = 1 - (Days/40)$) [cite: 31, 47]
   */
  calculateOpacity: (lastUpdate, isBookmarked) => {
    if (isBookmarked) return 1; // Entropy Shield cho Hạt giống
    
    const diffDays = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (diffDays / 40); 
    
    return Math.max(0, Math.min(1, opacity));
  },

  /**
   * Bộ lọc Diary: Loại bỏ các task 'backlog' không nằm trong tiêu điểm [cite: 42]
   */
  isDiaryEntry: (item) => {
    if (item.status === 'backlog' && !item.isFocusMode) {
      return false;
    }
    return true;
  },

  // --- Logic Task chuẩn Master Doc v3.1 + Diagnostic Trace ---

  setTasks: (tasks) => {
    console.log("MindCap Trace: setTasks called with", tasks.length, "items.");
    set({ tasks: [...tasks] }); // Tạo tham chiếu mảng mới
  },

  /**
   * Cập nhật Task (Functional Update + Deep Logging)
   */
  updateTask: async (id, updates) => {
    const updatedAt = Date.now();
    
    console.group(`🚀 MindCap Trace: updateTask(ID: ${id})`);
    console.log("Updates payload:", updates);

    try {
      // 1. Fast-lane (Zustand): Đảm bảo tạo tham chiếu Object mới [cite: 40]
      set((state) => {
        const index = state.tasks.findIndex(t => t.id === id);
        if (index === -1) {
          console.warn("❌ Trace Error: Task ID not found in Store!");
          return state;
        }

        const newTasks = [...state.tasks];
        newTasks[index] = { ...newTasks[index], ...updates, updatedAt };
        
        console.log("Zustand State updated successfully.");
        return { tasks: newTasks };
      });

      // 2. Shadow-lane (Dexie DB) [cite: 41, 53]
      const dbResult = await db.tasks.update(id, { ...updates, updatedAt });
      if (dbResult === 0) {
        console.error("❌ Trace Error: Dexie update failed. ID might not exist in DB.");
      } else {
        console.log("Dexie DB committed successfully.");
      }
    } catch (err) {
      console.error("❌ Trace Fatal Error:", err);
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Tăng số lượng thực hiện nguyên tử (Atomic Increment)
   * Kèm theo ép kiểu Number tường minh [cite: 58-59]
   */
  incrementDoneCount: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    
    console.group(`➕ MindCap Trace: incrementDoneCount(ID: ${id})`);
    
    if (!task) {
      console.error("❌ Trace Error: Task not found in Store.");
      console.groupEnd();
      return;
    }

    if (task.status === 'done') {
      console.warn("⚠️ Trace Warning: Task is already done. Ignoring increment.");
      console.groupEnd();
      return;
    }

    // Ép kiểu tường minh để tránh lỗi dữ liệu string
    const currentDone = Number(task.doneCount || 0);
    const target = Number(task.targetCount || 1);
    const nextDoneCount = currentDone + 1;
    
    console.log(`Current: ${currentDone}, Target: ${target}, Next: ${nextDoneCount}`);

    const shouldComplete = nextDoneCount >= target;
    const finalStatus = shouldComplete ? 'done' : task.status;

    console.log(`New Status candidate: ${finalStatus}`);

    await get().updateTask(id, {
      doneCount: nextDoneCount,
      status: finalStatus as 'todo' | 'done' | 'backlog',
    });
    
    console.groupEnd();
  }
}));