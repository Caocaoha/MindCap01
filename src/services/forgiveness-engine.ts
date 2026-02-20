/**
 * [SERVICE]: Forgiveness Engine (v2.0)
 * [FIX]: Resiliency Query (Boolean/Integer) & Direct Injection.
 * [UPDATE v2.0]: Kiến trúc Time-Stamp Locking (Dấu vân tay thời gian).
 * Business Rule: Giải quyết bài toán hiệu năng (chống spam) nhưng vẫn cho phép
 * người dùng test hoặc thay đổi giờ nhiều lần trong ngày.
 */

import { db } from '../database/db';
import { useNotificationStore } from '../store/notification-store';

export const ForgivenessEngine = {
  /**
   * Lấy ngày hiện tại dưới dạng chuỗi YYYY-MM-DD để phục vụ tạo Dấu vân tay.
   */
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Hàm kiểm tra và thực thi chính được gọi từ App.tsx hoặc trigger.
   */
  async checkAndRun(forcedTime?: string) {
    try {
      const profile = await db.userProfile.toCollection().first();
      if (!profile && !forcedTime) return;

      const now = new Date();
      const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

      const storedValue = forcedTime || (profile?.forgivenessHour as any);
      
      let targetHour = 19;
      let targetMinute = 0;

      /**
       * [SAFETY & PARSING]: Bóc tách giờ và phút an toàn.
       */
      if (typeof storedValue === 'string' && storedValue.includes(':')) {
        const parts = storedValue.split(':').map(Number);
        if (!isNaN(parts[0])) targetHour = parts[0];
        if (!isNaN(parts[1])) targetMinute = parts[1];
      } else if (typeof storedValue === 'number' && !isNaN(storedValue)) {
        targetHour = storedValue;
      }

      const targetTotalMinutes = (targetHour * 60) + targetMinute;

      /**
       * [NEW 2.0]: TẠO DẤU VÂN TAY THỜI GIAN (TIME-STAMP)
       * Định dạng: YYYY-MM-DD_HH:mm (Ví dụ: 2026-02-20_19:30)
       */
      const formattedTime = `${targetHour.toString().padStart(2, '0')}:${targetMinute.toString().padStart(2, '0')}`;
      const today = this.getTodayString();
      const expectedStamp = `${today}_${formattedTime}`; 

      const lastRun = profile?.lastForgivenessRun || '';

      /**
       * [DEBUG LOG]: Giám sát hoạt động của Engine qua Console
       */
      console.log(`[Forgiveness Engine] Now: ${currentTotalMinutes}m | Target: ${targetTotalMinutes}m (${formattedTime}) | Stamp: ${expectedStamp} | LastRun: ${lastRun}`);

      /**
       * [CORE LOGIC]: Chỉ chạy khi "Giờ đã đến" VÀ "Dấu vân tay hiện tại khác dấu đã chạy".
       * Cho phép đổi giờ chạy lại nhiều lần, nhưng không bao giờ spam nếu giữ nguyên cấu hình.
       */
      if (currentTotalMinutes >= targetTotalMinutes && lastRun !== expectedStamp) {
        console.log(`[Forgiveness] Kích hoạt tại mốc: ${formattedTime}.`);
        await this.executeForgiveness(expectedStamp);
      }
    } catch (error) {
      console.error("[Forgiveness Engine Error]:", error);
    }
  },

  /**
   * [ACTION]: Kích hoạt kiểm tra ngay lập tức sau khi cập nhật từ UI.
   */
  async triggerCheckAfterUpdate(newTime: string) {
    try {
      /**
       * [UPDATE 2.0]: KHÔNG CẦN RESET DATABASE NỮA.
       * Vì kiến trúc Dấu vân tay sẽ tự so sánh (newTime khác lastRun),
       * nên ta chỉ cần truyền thẳng newTime vào Engine để nó chạy tự nhiên.
       */
      await this.checkAndRun(newTime);
    } catch (error) {
      console.error("[Forgiveness Trigger Error]:", error);
    }
  },

  /**
   * Thực hiện cập nhật hàng loạt trên Database và thông báo cho người dùng.
   * Tham số truyền vào nay là 'stamp' thay vì 'today'.
   */
  async executeForgiveness(stamp: string) {
    try {
      await db.transaction('rw', db.tasks, db.thoughts, db.userProfile, async () => {
        /**
         * [RESILIENCY QUERY]: Cập nhật an toàn với mọi kiểu dữ liệu (Boolean/1)
         */
        const focusTasksCount = await db.tasks
          .filter(t => t.isFocusMode === true || (t.isFocusMode as any) === 1)
          .modify({ isFocusMode: false });

        const focusThoughtsCount = await db.thoughts
          .filter(t => (t as any).isFocusMode === true || (t as any).isFocusMode === 1)
          .modify({ isFocusMode: false });

        /**
         * [UPDATE 2.0]: Ghi Dấu vân tay (Ví dụ: "2026-02-20_19:30") 
         * vào Database để khóa Engine lại cho đến ngày mai, hoặc đến khi người dùng đổi giờ mới.
         */
        await db.userProfile.toCollection().modify({
          lastForgivenessRun: stamp
        });

        const totalCleared = focusTasksCount + focusThoughtsCount;
        console.log(`[Forgiveness] Hoàn tất: Giải phóng ${totalCleared} bản ghi.`);
        
        /**
         * [UI FEEDBACK]: Phản hồi thị giác với Emerald Theme.
         */
        if (totalCleared > 0) {
          const { showNotification } = useNotificationStore.getState();
          showNotification(
            "Hãy nghỉ ngơi! Bạn đã rất nỗ lực.", 
            undefined, 
            'forgiveness'
          );
        }
      });
    } catch (error) {
      console.error("[Forgiveness Execution Failed]:", error);
    }
  }
};