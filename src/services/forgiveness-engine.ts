/**
 * [SERVICE]: Forgiveness Engine (v1.5.2)
 * [FIX]: Resiliency Query (Boolean/Integer) & Direct Injection.
 * [FIX]: Triệt tiêu lỗi TS2339 (bulkUpdate) bằng cách sử dụng .modify() chuẩn Dexie.
 * Business Rule: Đảm bảo giải phóng Focus ngay lập tức khi nhận lệnh từ UI.
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
   * [UPDATE]: Chấp nhận tham số forcedTime (string HH:mm) để bỏ qua việc đọc DB bị trễ.
   */
  async checkAndRun(forcedTime?: string) {
    try {
      const profile = await db.userProfile.toCollection().first();
      if (!profile && !forcedTime) return;

      const now = new Date();
      const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

      /**
       * [FIX]: Ép kiểu thành 'any' để vượt qua kiểm tra nghiêm ngặt của TS.
       * Ưu tiên sử dụng forcedTime truyền trực tiếp từ UI khi nhấn Lưu.
       */
      const storedValue = forcedTime || (profile?.forgivenessHour as any);
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
      const lastRun = profile?.lastForgivenessRun || '';

      /**
       * [DEBUG LOG]: Kiểm tra trạng thái Engine trong Console (F12)
       */
      console.log(`[Forgiveness Engine] Now: ${currentTotalMinutes}m | Target: ${targetTotalMinutes}m | LastRun: ${lastRun}`);

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
   * [UPDATE]: Nhận giờ mới từ UI và thực hiện reset flag để buộc Engine chạy lại ngay.
   */
  async triggerCheckAfterUpdate(newTime: string) {
    try {
      // 1. Reset dấu mốc chạy trong ngày để Engine chấp nhận thực thi lại
      await db.userProfile.toCollection().modify({
        lastForgivenessRun: ''
      });
      
      // 2. Chạy check với giờ mới được tiêm trực tiếp (bỏ qua độ trễ ghi DB)
      await this.checkAndRun(newTime);
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
        /**
         * [RESILIENCY QUERY & FIX]: 
         * Sử dụng .modify() trực tiếp trên Collection sau khi filter.
         * Filter lọc cả trường hợp là boolean true VÀ trường hợp là số 1.
         */
        const focusTasksCount = await db.tasks
          .filter(t => t.isFocusMode === true || (t.isFocusMode as any) === 1)
          .modify({ isFocusMode: false });

        const focusThoughtsCount = await db.thoughts
          .filter(t => (t as any).isFocusMode === true || (t as any).isFocusMode === 1)
          .modify({ isFocusMode: false });

        // Đánh dấu đã chạy thành công trong ngày
        await db.userProfile.toCollection().modify({
          lastForgivenessRun: today
        });

        const totalCleared = focusTasksCount + focusThoughtsCount;
        console.log(`[Forgiveness] Hoàn tất: Giải phóng ${totalCleared} bản ghi.`);
        
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