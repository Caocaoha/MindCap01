// src/modules/saban/streak-engine.ts
import type { ITask } from '../../database/types';

// Helper: Tính số ngày bị bỏ lỡ (Gap)
const getDaysMissed = (lastDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const last = new Date(lastDateStr);
  last.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Diff = 1 nghĩa là làm hôm qua (Gap = 0 ngày bị lỡ)
  // Diff = 2 nghĩa là lỡ hôm qua (Gap = 1 ngày bị lỡ)
  return Math.max(0, diffDays - 1);
};

export const streakEngine = {
  /**
   * Tính toán trạng thái Streak mới khi hoàn thành Task
   */
  calculateNextState: (task: ITask): Partial<ITask> => {
    // 1. Chỉ áp dụng cho task lặp lại
    if (!task.frequency || task.frequency === 'ONCE') return {};

    const today = new Date();
    // Nếu chưa từng làm -> Khởi tạo streak đầu tiên
    if (!task.streakLastDate) {
      return {
        streakCurrent: 1,
        streakLastDate: today,
        streakRecoveryCount: 0,
        streakFrozenVal: 0
      };
    }

    const gapMissed = getDaysMissed(task.streakLastDate.toString());

    // TH1: Làm lại trong cùng ngày (Undo rồi Done lại) -> Không đổi
    if (gapMissed < 0) return {}; 

    // --- CHECK RECOVERY MODE ---
    if (task.streakRecoveryCount && task.streakRecoveryCount > 0) {
      // Đang trong thử thách 3 ngày
      // Nếu lỡ ngày trong lúc recovery -> Reset recovery về 0, mất streak cũ hoàn toàn
      if (gapMissed > 0) {
        return {
          streakCurrent: 1, // Reset về 1
          streakRecoveryCount: 0,
          streakFrozenVal: 0,
          streakLastDate: today
        };
      }

      // Làm liên tiếp (Gap = 0)
      const newCount = task.streakRecoveryCount + 1;
      
      if (newCount >= 3) {
        // [THÀNH CÔNG]: Hồi phục Streak cũ
        // Công thức: Streak Mới = Frozen - (Gap lúc gãy chuỗi)
        // Lưu ý: Frozen đã lưu giá trị gốc. Ta cần trừ đi số ngày đã nghỉ.
        // Giả sử logic đơn giản: Hồi phục lại giá trị Frozen (đã trừ phạt lúc gãy)
        return {
          streakCurrent: (task.streakFrozenVal || 0) + 1, // +1 cho ngày hôm nay
          streakRecoveryCount: 0, // Thoát recovery
          streakFrozenVal: 0,
          streakLastDate: today
        };
      } else {
        // Vẫn đang thử thách (Ngày 1 hoặc 2)
        return {
          streakRecoveryCount: newCount,
          streakLastDate: today
          // streakCurrent vẫn giữ nguyên (thường là 0 hoặc ẩn)
        };
      }
    }

    // --- NORMAL MODE ---
    
    // TH2: Làm đều (Gap = 0) -> Tăng streak
    if (gapMissed === 0) {
      const nextStreak = (task.streakCurrent || 0) + 1;
      return {
        streakCurrent: Math.min(99, nextStreak), // Max cap 99
        streakLastDate: today
      };
    }

    // TH3: Bị phạt nhẹ (Gap 1-4 ngày)
    if (gapMissed <= 4) {
      // Logic: Gap 1 ngày -> Trừ 1. Gap 2 ngày -> Trừ 2...
      // Cộng 1 cho lần làm hiện tại.
      // Net change = Current - Gap + 1
      const penalty = gapMissed;
      const current = task.streakCurrent || 0;
      let nextStreak = current - penalty + 1;
      
      return {
        streakCurrent: Math.max(1, nextStreak), // Không âm
        streakLastDate: today
      };
    }

    // TH4: Mất lửa (Gap > 4) -> Vào Recovery
    if (gapMissed > 4) {
      return {
        streakCurrent: 0, // Ẩn lửa
        streakFrozenVal: Math.max(0, (task.streakCurrent || 0) - gapMissed), // Lưu lại giá trị tiềm năng
        streakRecoveryCount: 1, // Bắt đầu ngày 1/3 ngay lập tức
        streakLastDate: today
      };
    }

    return {};
  },

  /**
   * Logic hiển thị UI (Opacity & Visibility)
   */
  getVisualState: (task: ITask) => {
    if (!task.frequency || task.frequency === 'ONCE') return { isVisible: false, opacity: 0 };
    if (!task.streakLastDate) return { isVisible: false, opacity: 0 };

    const gapMissed = getDaysMissed(task.streakLastDate.toString());

    // Đang Recovery (Ẩn hoàn toàn trong 2 ngày đầu)
    if (task.streakRecoveryCount && task.streakRecoveryCount > 0 && task.streakRecoveryCount < 3) {
      return { isVisible: false, opacity: 0 };
    }

    // Nếu Gap > 4 mà chưa làm (chưa vào recovery) -> Ẩn
    if (gapMissed > 4) return { isVisible: false, opacity: 0 };

    // Gap 2-4: Opacity 0.3
    if (gapMissed >= 2 && gapMissed <= 4) return { isVisible: true, opacity: 0.3 };
    
    // Gap 1: Opacity 0.5
    if (gapMissed === 1) return { isVisible: true, opacity: 0.5 };

    // Gap 0: Sáng rõ
    return { isVisible: true, opacity: 1 };
  }
};