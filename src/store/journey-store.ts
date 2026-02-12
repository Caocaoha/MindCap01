import { create } from 'zustand';
import { db } from '../database/db';
import type { ITask, IThought } from '../database/types';
import { streakEngine } from '../modules/saban/streak-engine';
import { useUiStore } from './ui-store'; // [FOCUS MODULE]
import { useUserStore } from './user-store'; // [CME MODULE - NEW]
import { levelEngine } from '../services/cme/level-engine'; // [CME MODULE - NEW]

interface JourneyState {
  entries: (ITask | IThought)[];
  isLoading: boolean;

  // Actions cơ bản
  setEntries: (entries: (ITask | IThought)[]) => void;
  addEntry: (entry: ITask | IThought) => void;
  updateEntry: (id: number, updates: Partial<ITask | IThought>) => void;
  removeEntry: (id: number) => void;

  // Actions nghiệp vụ (Saban, Focus, CME)
  toggleTaskStatus: (id: number, status: 'pending' | 'completed' | 'dismissed') => Promise<void>;
  scheduleTaskForToday: (id: number) => Promise<void>;
  toggleFocusSelection: (id: number) => Promise<void>;
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

  // [CORE LOGIC]: Xử lý trạng thái nhiệm vụ & Hệ quả (Side-effects)
  toggleTaskStatus: async (id, status) => {
    const state = get();
    const task = state.entries.find((e) => e.id === id) as ITask;
    if (!task) return;

    let updates: Partial<ITask> = { status };

    // --- 1. LOGIC STREAK & RECOVERY (Saban) ---
    // Chỉ kích hoạt khi hoàn thành lần đầu tiên trong ngày
    if (status === 'completed' && task.status !== 'completed') {
      const streakUpdates = streakEngine.calculateNextState(task);
      updates = { ...updates, ...streakUpdates };
    }
    
    // Logic Undo: Trừ streak nếu lỡ bấm nhầm (chống cheat đơn giản)
    if (status === 'pending' && task.status === 'completed') {
      if (task.frequency && task.frequency !== 'ONCE' && (task.streakCurrent || 0) > 0) {
         updates.streakCurrent = Math.max(0, (task.streakCurrent || 0) - 1);
      }
    }

    // --- 2. LOGIC FOCUS MODE (Execution) ---
    // Nếu hoàn thành trong lúc Focus -> Tự động bỏ Focus (để slot cho việc khác)
    if (status === 'completed' && task.isFocusMode) {
       updates.isFocusMode = false;
    }

    // Nếu "Dismiss" (Hủy tiêu điểm) -> Về đầu danh sách Inbox/Today
    if (status === 'dismissed' && task.isFocusMode) {
       updates.status = 'pending'; // Reset trạng thái
       updates.isFocusMode = false; // Bỏ focus
       updates.createdAt = new Date(); // Hack: Update time để sort lên đầu
    }

    // --- 3. LOGIC LEVELING (CME - Gamification) [NEW] ---
    if (status === 'completed' && task.status !== 'completed') {
      // Tính điểm cơ bản
      let xpEarned = levelEngine.SCORING.TASK_COMPLETED;
      
      // Bonus nếu có Streak cao (>3 ngày)
      if ((task.streakCurrent || 0) >= 3) {
        xpEarned += levelEngine.SCORING.STREAK_BONUS;
      }

      // Gọi User Store để cộng điểm (Chạy ngầm, không await để UI mượt)
      useUserStore.getState().addXp(xpEarned, `Completed: ${task.title}`);
    }

    // --- UPDATE STATE & DB ---
    // 1. Update State (Optimistic UI)
    set((state) => {
      const updatedEntries = state.entries.map((entry) => 
        entry.id === id ? { ...entry, ...updates } : entry
      );
      
      // Sort lại: Đưa việc mới update (ví dụ Cancel Focus) lên đầu
      return { 
        entries: updatedEntries.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) 
      };
    });

    // 2. Update DB (Source of Truth)
    await db.tasks.update(id, updates);
  },

  // Logic: Đẩy task từ Inbox vào Today
  scheduleTaskForToday: async (id) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry as ITask, scheduledFor: today } : entry
      )
    }));

    await db.tasks.update(id, { scheduledFor: today });
  },

  // Logic: Chọn task vào Focus Mode (Max 4)
  toggleFocusSelection: async (id) => {
    const state = get();
    const task = state.entries.find((e) => e.id === id) as ITask;
    if (!task) return;

    // Nếu đang tắt -> Muốn bật: Check Limit
    if (!task.isFocusMode) {
      // Đếm số task đang focus (trừ task đã completed)
      const currentFocusCount = state.entries.filter(
        (e: any) => e.isFocusMode && e.status !== 'completed'
      ).length;
      
      if (currentFocusCount >= 4) {
        alert("⚠️ GIỚI HẠN TẬP TRUNG: Bạn chỉ được chọn tối đa 4 nhiệm vụ!");
        return; // Chặn ngay lập tức
      }
    }

    const newFocusState = !task.isFocusMode;
    
    set((state) => ({
      entries: state.entries.map((e) => 
        e.id === id ? { ...e, isFocusMode: newFocusState } : e
      )
    }));

    await db.tasks.update(id, { isFocusMode: newFocusState });
  }
}));