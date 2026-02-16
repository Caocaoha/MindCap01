import { create } from 'zustand';
import { ITask, IThought } from '../database/types';
import { db } from '../database/db';

/**
 * [STORE]: Quản lý trạng thái hành trình v4.7.
 * Bổ sung 'migrateEntry' để xử lý chuyển đổi Type (Task <-> Thought) và cập nhật UI tức thì.
 */
export interface JourneyState {
  // --- Task Management (Khôi phục cho Saban/Focus) ---
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
  updateTask: (id: number, updates: Partial<ITask>) => Promise<void>;
  incrementDoneCount: (id: number) => void;

  // --- [NEW]: Action chuyển đổi dữ liệu ---
  // Xử lý việc di chuyển bản ghi giữa các bảng (Tasks/Thoughts) khi người dùng đổi loại.
  migrateEntry: (
    id: number, 
    fromType: 'task' | 'thought', 
    toType: 'task' | 'thought', 
    data: Partial<ITask | IThought>
  ) => Promise<void>;

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
    // [MOD]: Đảm bảo cập nhật DB trước để kích hoạt LiveQuery ở các nơi khác
    await db.tasks.update(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  // [NEW]: Logic di chuyển bản ghi giữa các bảng (Task <-> Thought)
  migrateEntry: async (id, fromType, toType, data) => {
    // TRƯỜNG HỢP 1: Không đổi loại (Chỉ update thuộc tính)
    if (fromType === toType) {
      if (fromType === 'task') {
        await get().updateTask(id, data as Partial<ITask>);
      } else {
        // Nếu là Thought, update trực tiếp vào DB
        await db.thoughts.update(id, data);
      }
      return;
    }

    // TRƯỜNG HỢP 2: Chuyển từ Task sang Thought (Rời khỏi Saban)
    if (fromType === 'task' && toType === 'thought') {
      const { id: _oldId, ...contentData } = data as any;
      
      // 1. Thêm vào bảng Thoughts
      await db.thoughts.add({
        ...contentData,
        type: 'thought',
        createdAt: contentData.createdAt || Date.now(),
        updatedAt: Date.now()
      });

      // 2. Xóa khỏi bảng Tasks
      await db.tasks.delete(id);

      // 3. Cập nhật Store: Loại bỏ task khỏi danh sách để Saban biến mất ngay
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }));
    }

    // TRƯỜNG HỢP 3: Chuyển từ Thought sang Task (Xuất hiện tại Saban)
    else if (fromType === 'thought' && toType === 'task') {
      const { id: _oldId, ...contentData } = data as any;

      // 1. Thêm vào bảng Tasks
      const newId = await db.tasks.add({
        ...contentData,
        type: 'task',
        status: 'todo', // Đảm bảo trạng thái mặc định
        createdAt: contentData.createdAt || Date.now(),
        updatedAt: Date.now()
      } as ITask);

      // 2. Xóa khỏi bảng Thoughts
      await db.thoughts.delete(id);

      // 3. Cập nhật Store: Thêm task mới vào danh sách để hiện ngay lập tức
      const newTask = await db.tasks.get(newId);
      if (newTask) {
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
      }
    }
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