import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [DOMAIN LOGIC]: Xử lý logic chuỗi, trích xuất tag và Reset ngày mới
 */
export const streakEngine = {
  /**
   * 1. Trích xuất giá trị từ tags (BẢO TOÀN 100%)]
   * Ví dụ: "freq:weekly" -> "weekly"
   */
  getTagValue: (task: ITask, key: string): string | null => {
    const prefix = `${key}:`;
    const found = task.tags?.find(t => t.startsWith(prefix));
    return found ? found.split(':')[1] : null;
  },

  /**
   * 2. Kiểm tra phục hồi chuỗi (BẢO TOÀN 100% - 3-Day Rule)]
   */
  isWithinRecoveryPeriod: (task: ITask): boolean => {
    const THREE_DAYS_MS = 259200000;
    const lastUpdate = task.updatedAt ?? task.createdAt;
    return (Date.now() - lastUpdate) < THREE_DAYS_MS;
  },

  /**
   * 3. [MỚI]: Xác định trạng thái hiển thị ngọn lửa (Fix lỗi TS2339)
   */
  getVisualState: (task: ITask): 'active' | 'recovering' | 'dimmed' => {
    const isDone = task.status === 'done';
    const isRecovering = streakEngine.isWithinRecoveryPeriod(task);

    if (isDone) return 'active';
    if (isRecovering) return 'recovering';
    return 'dimmed';
  },

  /**
   * 4. [BẢO TOÀN 100%]: Xử lý Reset task theo chu kỳ 00:00
   */
  processDailyReset: async () => {
    const today = new Date();
    const todayDay = today.getDay(); // 0 (CN) - 6 (T7)
    const currentDayTag = `d:${todayDay === 0 ? 7 : todayDay}`; 

    const allTasks = await db.tasks.toArray();

    await db.transaction('rw', db.tasks, async () => {
      for (const task of allTasks) {
        const isDone = task.status === 'done';
        const freq = streakEngine.getTagValue(task, 'freq');

        // Logic A: Việc "Một lần" đã xong -> Ẩn vĩnh viễn khỏi Saban
        if (isDone && freq === 'once') {
          await db.tasks.update(task.id!, { isFocusMode: false }); //
        }

        // Logic B: Việc "Hàng tuần" -> Reset trạng thái để làm lại
        if (isDone && freq === 'weekly') {
          await db.tasks.update(task.id!, { status: 'todo', updatedAt: Date.now() });
        }

        // Logic C: Việc "Tùy chọn ngày" -> Reset khi đến đúng ngày được chọn
        if (isDone && freq === 'days-week') {
          const isTargetDay = task.tags?.includes(currentDayTag);
          if (isTargetDay) {
            await db.tasks.update(task.id!, { status: 'todo', updatedAt: Date.now() });
          }
        }
      }
    });

    console.log("StreakEngine: Daily reset executed.");
  }
};