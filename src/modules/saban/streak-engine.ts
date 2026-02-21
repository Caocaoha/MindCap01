import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [DOMAIN LOGIC]: Xử lý logic chuỗi, trích xuất tag và Reset ngày mới (v2.4)
 * [UPGRADE]: Hỗ trợ hệ thống thời gian chuẩn ISO 8601 (UTC Agnostic).
 * [FIX]: Sử dụng new Date().getTime() để so sánh mốc 0h chính xác cho cả String và Number.
 * [FIX]: Sửa lỗi "Vượt thời gian" bằng cách ép toàn bộ dữ liệu Reset về giờ chuẩn UTC.
 */
export const streakEngine = {
  /**
   * 1. Trích xuất giá trị từ tags (BẢO TOÀN 100%)
   */
  getTagValue: (task: ITask, key: string): string | null => {
    const prefix = `${key}:`;
    const found = task.tags?.find(t => t.startsWith(prefix));
    return found ? found.split(':')[1] : null;
  },

  /**
   * 2. Kiểm tra phục hồi chuỗi (BẢO TOÀN 100%)
   * [UPDATE]: Hỗ trợ nhận diện thời gian từ cả ISO String và Number.
   */
  isWithinRecoveryPeriod: (task: ITask): boolean => {
    const THREE_DAYS_MS = 259200000;
    const lastUpdate = task.updatedAt ?? task.createdAt;
    // Chuyển đổi linh hoạt sang timestamp để thực hiện phép trừ
    const lastUpdateTime = typeof lastUpdate === 'string' ? new Date(lastUpdate).getTime() : Number(lastUpdate);
    return (Date.now() - lastUpdateTime) < THREE_DAYS_MS;
  },

  /**
   * 3. Xác định trạng thái hiển thị ngọn lửa (BẢO TOÀN 100%)
   */
  getVisualState: (task: ITask): 'active' | 'recovering' | 'dimmed' => {
    const isDone = task.status === 'done';
    const isRecovering = streakEngine.isWithinRecoveryPeriod(task);
    if (isDone) return 'active';
    if (isRecovering) return 'recovering';
    return 'dimmed';
  },

  /**
   * 4. [UPDATE 11.7]: Xử lý Reset task dựa trên so sánh mốc 0h.
   * [FIX]: Chuyển sang so sánh dựa trên đối tượng Date để đảm bảo đồng nhất UTC.
   */
  processDailyReset: async () => {
    const now = new Date();
    // Xác định mốc 00:00:00 của ngày hôm nay theo giờ địa phương
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todayDay = now.getDay(); // 0 (CN) - 6 (T7)
    const currentVnDay = todayDay === 0 ? 8 : todayDay + 1; 
    const currentDayTag = `d:${currentVnDay}`; 
    const nowISO = new Date().toISOString();

    console.group(`[StreakEngine] Kiểm tra Reset ngày mới (UTC Agnostic): Thứ ${currentVnDay}`);

    await db.transaction('rw', db.tasks, async () => {
      const allTasks = await db.tasks.toArray();
      const resetList: any[] = [];

      for (const task of allTasks) {
        if (task.status !== 'done') continue;

        /**
         * [CORE FIX]: Chuyển đổi updatedAt (String/Number) về Timestamp để so sánh.
         * Việc sử dụng new Date(val).getTime() là cách an toàn nhất để "đọc" ISO 8601.
         */
        const lastDoneTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
        
        // Nếu task hoàn thành SAU 0h sáng nay -> Tuyệt đối không reset
        if (lastDoneTime >= startOfToday) {
          continue;
        }

        const tagFreq = streakEngine.getTagValue(task, 'freq');
        const freq = task.frequency || tagFreq;

        // Bỏ qua các task làm một lần
        if (freq === 'once' || freq === 'none') {
          await db.tasks.update(task.id!, { isFocusMode: false, updatedAt: nowISO });
          continue;
        }

        /**
         * [LOGIC CẢI TIẾN]: Nhận diện "Target Day" (Ngày cần làm)
         */
        const repeatDays = task.repeatOn || [];
        const isDaily = freq === 'daily';
        const isWeeklyType = freq === 'weekly' || freq === 'days-week' || freq === 'custom';
        
        const isTargetDay = 
          isDaily || 
          repeatDays.includes(currentVnDay) || 
          task.tags?.includes(currentDayTag);

        // Nếu hôm nay là ngày cần thực hiện task này -> RESET
        if (isTargetDay || (isWeeklyType && repeatDays.length === 0)) {
          /**
           * [ACTION]: Hồi sinh Task
           * - Đưa trạng thái về todo.
           * - Làm rỗng tiến độ (doneCount: 0).
           * - Cập nhật updatedAt theo chuẩn ISO 8601 UTC mới.
           */
          await db.tasks.update(task.id!, { 
            status: 'todo', 
            doneCount: 0, 
            isFocusMode: false,
            updatedAt: nowISO 
          });

          resetList.push({ 
            Nhiệm_vụ: task.content.substring(0, 20), 
            Tần_suất: freq, 
            Mốc_cũ: task.updatedAt,
            Lý_do: isDaily ? "Hàng ngày" : "Đúng lịch Thứ " + currentVnDay 
          });
        }
      }

      if (resetList.length > 0) {
        console.table(resetList);
      } else {
        console.log("Không có nhiệm vụ nào cần hồi sinh.");
      }
    });

    console.groupEnd();
  }
};