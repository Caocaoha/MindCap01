import { create } from 'zustand';
import { ITask, IThought } from '../database/types';
import { db } from '../database/db';

/**
 * [STORE]: Quản lý trạng thái hành trình v4.9.
 * [UPGRADE]: Chuyển đổi toàn bộ hệ thống thời gian sang ISO 8601 (UTC Agnostic).
 * [FIX]: Loại bỏ "Double Timezone Offset" bằng cách cưỡng bức sử dụng .toISOString().
 * [RULE]: Không chấp nhận Number Timestamp từ UI, luôn sinh mới chuỗi UTC tại Store.
 */
export interface JourneyState {
  // --- Task Management ---
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  updateTask: (id: number, updates: Partial<ITask>) => Promise<void>;
  incrementDoneCount: (id: number) => Promise<void>;

  // --- Action chuyển đổi dữ liệu ---
  migrateEntry: (
    id: number, 
    fromType: 'task' | 'thought', 
    toType: 'task' | 'thought', 
    data: Partial<ITask | IThought>
  ) => Promise<void>;

  // --- Action Hub v3.6 ---
  viewMode: 'stats' | 'diary' | 'spark'; 
  searchQuery: string;
  hiddenIds: number[];
  linkingItem: { id: number; type: 'task' | 'thought' } | null;
  
  setViewMode: (mode: 'stats' | 'diary' | 'spark') => void; 
  setSearchQuery: (query: string) => void;
  setLinkingItem: (item: { id: number; type: 'task' | 'thought' } | null) => void;
  toggleHide: (id: number) => void;
  calculateOpacity: (lastUpdate: string | number, isBookmarked?: boolean) => number;
  isDiaryEntry: (item: any) => boolean;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  // Khởi tạo Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  /**
   * Cập nhật Task cả trong Store và Database
   * [STRATEGY]: Chặn đứng việc truyền Timestamp số từ UI.
   */
  updateTask: async (id, updates) => {
    // [FIX]: Chuyển đổi updatedAt sang ISO 8601 UTC string
    const enhancedUpdates = {
      ...updates,
      updatedAt: new Date().toISOString() // Luôn sinh mới giờ chuẩn UTC
    };

    await db.tasks.update(id, enhancedUpdates as any);
    
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...enhancedUpdates } : t)),
    }));
  },

  // Logic di chuyển bản ghi giữa các bảng (Task <-> Thought)
  migrateEntry: async (id, fromType, toType, data) => {
    const nowISO = new Date().toISOString();

    if (fromType === toType) {
      if (fromType === 'task') {
        await get().updateTask(id, data as Partial<ITask>);
      } else {
        await db.thoughts.update(id, { ...data, updatedAt: nowISO });
      }
      return;
    }

    if (fromType === 'task' && toType === 'thought') {
      const { id: _oldId, ...contentData } = data as any;
      
      await db.thoughts.add({
        ...contentData,
        type: 'thought',
        createdAt: contentData.createdAt || nowISO,
        updatedAt: nowISO
      });

      await db.tasks.delete(id);

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }));
    }

    else if (fromType === 'thought' && toType === 'task') {
      const { id: _oldId, ...contentData } = data as any;

      const newId = await db.tasks.add({
        ...contentData,
        type: 'task',
        status: 'todo',
        createdAt: contentData.createdAt || nowISO,
        updatedAt: nowISO
      } as ITask);

      await db.thoughts.delete(id);

      const newTask = await db.tasks.get(newId);
      if (newTask) {
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
      }
    }
  },

  /**
   * Tăng số lượng thực hiện
   * [FIX]: Ép kiểu ISO 8601 cho updatedAt.
   */
  incrementDoneCount: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    
    const newCount = (task.doneCount || 0) + 1;
    const isDone = newCount >= (task.targetCount || 1);
    const nowISO = new Date().toISOString();
    
    const updates = { 
      doneCount: newCount, 
      status: (isDone ? 'done' : 'todo') as 'done' | 'todo',
      isFocusMode: isDone ? false : task.isFocusMode,
      updatedAt: nowISO 
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
   * [FIX]: Hỗ trợ so sánh cả ISO string và Number cũ.
   */
  calculateOpacity: (lastUpdate, isBookmarked) => {
    if (isBookmarked) return 1; 
    const updateTime = typeof lastUpdate === 'string' ? new Date(lastUpdate).getTime() : lastUpdate;
    const diffDays = (Date.now() - updateTime) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (diffDays / 40);
    return Math.max(0.1, Math.min(1, opacity));
  },

  isDiaryEntry: (item) => {
    if (item.status === 'active' && !item.isFocusMode) return false;
    return true;
  }
}));