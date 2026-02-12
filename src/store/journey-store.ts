import { create } from 'zustand';
import { db } from '../database/db';
import type { ITask, IThought } from '../database/types';
import { streakEngine } from '../modules/saban/streak-engine';

interface JourneyState {
  entries: (ITask | IThought)[];
  isLoading: boolean;

  // Actions cơ bản
  setEntries: (entries: (ITask | IThought)[]) => void;
  addEntry: (entry: ITask | IThought) => void;
  updateEntry: (id: number, updates: Partial<ITask | IThought>) => void;
  removeEntry: (id: number) => void;

  // Actions cho Saban & Streak
  toggleTaskStatus: (id: number, status: 'pending' | 'completed' | 'dismissed') => Promise<void>;
  scheduleTaskForToday: (id: number) => Promise<void>;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  entries: [],
  isLoading: false,

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) => set((state) => ({ 
    entries: [entry, ...state.entries] 
  })),

  updateEntry: (id, updates) => set((state) => ({
    entries: state.entries.map((entry) => 
      entry.id === id ? { ...entry, ...updates } : entry
    ),
  })),

  removeEntry: (id) => set((state) => ({
    entries: state.entries.filter((entry) => entry.id !== id),
  })),

  // [NEW] Logic: Đổi trạng thái & Tính toán Streak
  toggleTaskStatus: async (id, status) => {
    const state = get();
    // Tìm task trong state hiện tại
    const task = state.entries.find((e) => e.id === id) as ITask;
    if (!task) return;

    let updates: Partial<ITask> = { status };

    // LOGIC 1: STREAK UPDATE (Khi hoàn thành)
    // Chỉ kích hoạt nếu chuyển sang completed
    if (status === 'completed' && task.status !== 'completed') {
      const streakUpdates = streakEngine.calculateNextState(task);
      updates = { ...updates, ...streakUpdates };
    }
    
    // LOGIC 2: UNDO (Khi bỏ hoàn thành)
    if (status === 'pending' && task.status === 'completed') {
      // Logic đơn giản: Nếu undo, có thể trừ streak hoặc giữ nguyên (tùy policy).
      // Ở đây ta tạm thời trừ đi 1 nếu streak > 0 để tránh cheat,
      // nhưng logic recovery phức tạp hơn nên MVP tạm chấp nhận sai số nhỏ khi undo.
      if (task.frequency && task.frequency !== 'ONCE' && (task.streakCurrent || 0) > 0) {
         updates.streakCurrent = Math.max(0, (task.streakCurrent || 0) - 1);
      }
    }

    // LOGIC 3: CANCEL FOCUS (Hủy tiêu điểm -> Về đầu danh sách)
    if (status === 'pending' && task.isFocusMode) {
       updates.isFocusMode = false;
       updates.createdAt = new Date(); // Hack: Update time để sort lên đầu
    }

    // 1. Update State (Optimistic UI)
    set((state) => {
      const updatedEntries = state.entries.map((entry) => 
        entry.id === id ? { ...entry, ...updates } : entry
      );
      
      // Sort lại nếu cần (đưa task mới update lên đầu nếu chưa complete)
      return { entries: updatedEntries };
    });

    // 2. Update DB
    await db.tasks.update(id, updates);
  },

  // [NEW] Logic: Đẩy task từ Inbox vào Today
  scheduleTaskForToday: async (id) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry as ITask, scheduledFor: today } : entry
      )
    }));

    await db.tasks.update(id, { scheduledFor: today });
  }
}));