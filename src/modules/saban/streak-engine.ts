import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [DOMAIN LOGIC]: Xử lý logic chuỗi, trích xuất tag và Reset ngày mới (v2.1)
 * [FIX]: Tích hợp mốc 0h để tránh việc reset nhầm task vừa hoàn thành trong ngày.
 */
export const streakEngine = {
  getTagValue: (task: ITask, key: string): string | null => {
    const prefix = `${key}:`;
    const found = task.tags?.find(t => t.startsWith(prefix));
    return found ? found.split(':')[1] : null;
  },

  isWithinRecoveryPeriod: (task: ITask): boolean => {
    const THREE_DAYS_MS = 259200000;
    const lastUpdate = task.updatedAt ?? task.createdAt;
    return (Date.now() - lastUpdate) < THREE_DAYS_MS;
  },

  getVisualState: (task: ITask): 'active' | 'recovering' | 'dimmed' => {
    const isDone = task.status === 'done';
    const isRecovering = streakEngine.isWithinRecoveryPeriod(task);
    if (isDone) return 'active';
    if (isRecovering) return 'recovering';
    return 'dimmed';
  },

  /**
   * 4. [UPDATE 11.3]: Xử lý Reset task dựa trên so sánh mốc 0h.
   * Logic: Chỉ reset những task 'done' có updatedAt TRƯỚC 0h ngày hôm nay.
   */
  processDailyReset: async () => {
    const now = new Date();
    
    // 1. Xác định mốc 00:00:00 của ngày hôm nay (tính bằng mili giây)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todayDay = now.getDay(); // 0 (CN) - 6 (T7)
    const currentVnDay = todayDay === 0 ? 8 : todayDay + 1; 
    const currentDayTag = `d:${currentVnDay}`; 

    const allTasks = await db.tasks.toArray();

    await db.transaction('rw', db.tasks, async () => {
      for (const task of allTasks) {
        // Chỉ xử lý các task đã hoàn thành (status === 'done')
        if (task.status !== 'done') continue;

        /**
         * [CORE FIX]: KIỂM TRA MỐC THỜI GIAN
         * Nếu task được hoàn thành SAU mốc 0h hôm nay, bỏ qua không reset.
         */
        const lastDoneTime = task.updatedAt || 0;
        if (lastDoneTime >= startOfToday) {
          continue; // Task này mới làm xong hôm nay, giữ nguyên trạng thái done
        }

        // Nếu đã lọt xuống đây, nghĩa là task này là 'done' của ngày hôm qua
        const tagFreq = streakEngine.getTagValue(task, 'freq');
        const freq = task.frequency || tagFreq;

        if (freq === 'once' || freq === 'none') {
          await db.tasks.update(task.id!, { isFocusMode: false });
          continue;
        }

        const repeatDays = task.repeatOn || [];
        const isTargetDay = repeatDays.includes(currentVnDay) || task.tags?.includes(currentDayTag);

        // Reset việc Hàng ngày (daily)
        if (freq === 'daily') {
          await db.tasks.update(task.id!, { status: 'todo', updatedAt: Date.now() });
          continue;
        }

        // Reset việc Hàng tuần (weekly) hoặc Theo ngày cụ thể
        if (freq === 'weekly' || freq === 'days-week') {
          const hasSpecificDays = repeatDays.length > 0 || task.tags?.some(t => t.startsWith('d:'));
          
          if (hasSpecificDays) {
            if (isTargetDay) {
              await db.tasks.update(task.id!, { status: 'todo', updatedAt: Date.now() });
            }
          } else {
            // Mặc định reset nếu là weekly mà không cài ngày lẻ (legacy)
            await db.tasks.update(task.id!, { status: 'todo', updatedAt: Date.now() });
          }
        }
      }
    });

    console.log(`[StreakEngine] Rollover executed for day ${currentVnDay}. Reset tasks completed BEFORE ${new Date(startOfToday).toLocaleString()}`);
  }
};