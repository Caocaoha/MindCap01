import { db } from '../database/db';

/**
 * [SERVICE]: Forgiveness Engine (v1.0)
 * Business Rule: 
 * - Giải phóng tâm lý: Đẩy mọi việc từ Focus về Todo sau mốc giờ cài đặt (mặc định 19h).
 * - Bảo tồn: Chỉ thay đổi isFocusMode, không can thiệp status hay reset việc lặp lại (Reset dành cho mốc 0h).
 * - Tiết kiệm: Chạy một lần duy nhất khi App khởi chạy (Lazy Trigger).
 */

export const ForgivenessEngine = {
  /**
   * Lấy ngày hiện tại dưới dạng chuỗi YYYY-MM-DD để so sánh.
   */
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Hàm kiểm tra và thực thi chính được gọi từ App.tsx.
   */
  async checkAndRun() {
    try {
      // 1. Lấy thông tin cấu hình từ User Profile
      const profile = await db.userProfile.toCollection().first();
      if (!profile) return;

      const now = new Date();
      const currentHour = now.getHours();
      const today = this.getTodayString();

      const forgivenessHour = profile.forgivenessHour ?? 19;
      const lastRun = profile.lastForgivenessRun || '';

      /**
       * ĐIỀU KIỆN KÍCH HOẠT:
       * - Đã đến hoặc qua giờ tha thứ.
       * - Chưa chạy lần nào trong ngày hôm nay.
       */
      if (currentHour >= forgivenessHour && lastRun !== today) {
        console.log(`[Forgiveness] Đã chạm mốc ${forgivenessHour}h. Bắt đầu giải phóng Focus...`);
        await this.executeForgiveness(today);
      }
    } catch (error) {
      console.error("[Forgiveness Engine Error]:", error);
    }
  },

  /**
   * Thực hiện cập nhật hàng loạt trên Database.
   */
  async executeForgiveness(today: string) {
    try {
      /**
       * CHIẾN THUẬT BẢO TỒN TRẠNG THÁI:
       * Chúng ta thực hiện Bulk Update trên cả 2 bảng Tasks và Thoughts.
       * Chỉ nhắm vào các bản ghi đang ở chế độ Focus.
       */
      await db.transaction('rw', db.tasks, db.thoughts, db.userProfile, async () => {
        // 1. Giải phóng Tasks trong Focus
        const focusTasksCount = await db.tasks
          .where('isFocusMode')
          .equals(1) // Dexie biểu diễn boolean true là 1
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

        console.log(`[Forgiveness] Hoàn tất: Giải phóng ${focusTasksCount} tasks và ${focusThoughtsCount} thoughts.`);
      });
    } catch (error) {
      console.error("[Forgiveness Execution Failed]:", error);
    }
  }
};