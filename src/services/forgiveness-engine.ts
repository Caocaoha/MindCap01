/**
 * [SERVICE]: Forgiveness Engine (v1.3.2)
 * [FIX]: Khắc phục lỗi TS2339 (type never) bằng cách ép kiểu dữ liệu từ Database.
 * [UPDATE]: Bổ sung logic reset lastForgivenessRun và kiểm tra isNaN cho phép tính thời gian.
 * Business Rule: Hỗ trợ so sánh chính xác đến từng phút (HH:mm) cho cả dữ liệu cũ và mới.
 */

import { db } from '../database/db';
import { useNotificationStore } from '../store/notification-store';

export const ForgivenessEngine = {
  /**
   * Lấy ngày hiện tại dưới dạng chuỗi YYYY-MM-DD để so sánh.
   */
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Hàm kiểm tra và thực thi chính được gọi từ App.tsx hoặc trigger.
   */
  async checkAndRun() {
    try {
      const profile = await db.userProfile.toCollection().first();
      if (!profile) return;

      const now = new Date();
      const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

      /**
       * [FIX]: Ép kiểu thành 'any' hoặc 'string | number' để vượt qua kiểm tra nghiêm ngặt của TS
       * khi interface chưa được cập nhật đồng bộ.
       */
      const storedValue = profile.forgivenessHour as any;
      let targetTotalMinutes = 19 * 60; // Mặc định 19:00

      /**
       * [SAFETY]: Bọc các phép tính trong kiểm tra isNaN để đảm bảo tính ổn định.
       */
      if (typeof storedValue === 'string' && storedValue.includes(':')) {
        const parts = storedValue.split(':').map(Number);
        const hourPart = parts[0];
        const minutePart = parts[1];

        if (!isNaN(hourPart)) {
          const validMinutes = isNaN(minutePart) ? 0 : minutePart;
          targetTotalMinutes = (hourPart * 60) + validMinutes;
        }
      } else if (typeof storedValue === 'number' && !isNaN(storedValue)) {
        targetTotalMinutes = storedValue * 60;
      }

      const today = this.getTodayString();
      const lastRun = profile.lastForgivenessRun || '';

      if (currentTotalMinutes >= targetTotalMinutes && lastRun !== today) {
        console.log(`[Forgiveness] Kích hoạt tại mốc: ${storedValue}.`);
        await this.executeForgiveness(today);
      }
    } catch (error) {
      console.error("[Forgiveness Engine Error]:", error);
    }
  },

  /**
   * [ACTION]: Kích hoạt kiểm tra ngay lập tức sau khi cập nhật từ UI.
   * Logic: Reset cờ lastForgivenessRun để buộc Engine chạy lại ngay cả khi hôm nay đã chạy rồi.
   */
  async triggerCheckAfterUpdate() {
    try {
      // 1. Reset dấu mốc chạy trong ngày để Engine chấp nhận thực thi lại
      await db.userProfile.toCollection().modify({
        lastForgivenessRun: ''
      });
      
      // 2. Gọi hàm kiểm tra chính
      await this.checkAndRun();
    } catch (error) {
      console.error("[Forgiveness Trigger Error]:", error);
    }
  },

  /**
   * Thực hiện cập nhật hàng loạt trên Database và thông báo cho người dùng.
   */
  async executeForgiveness(today: string) {
    try {
      await db.transaction('rw', db.tasks, db.thoughts, db.userProfile, async () => {
        // 1. Giải phóng Tasks trong Focus
        const focusTasksCount = await db.tasks
          .where('isFocusMode')
          .equals(1) 
          .modify({ isFocusMode: false });

        // 2. Giải phóng Thoughts trong Focus
        const focusThoughtsCount = await db.thoughts
          .where('isFocusMode')
          .equals(1)
          .modify({ isFocusMode: false });

        // 3. Đánh dấu đã chạy thành công trong ngày
        await db.userProfile.toCollection().modify({
          lastForgivenessRun: today
        });

        const totalCleared = focusTasksCount + focusThoughtsCount;
        
        /**
         * [UI FEEDBACK]: Chỉ hiển thị lời nhắn nhủ nếu thực sự có việc được giải phóng.
         * Emerald Theme ('forgiveness') được sử dụng để tạo cảm giác nhẹ nhõm.
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