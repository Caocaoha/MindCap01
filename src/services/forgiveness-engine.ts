import { db } from '../database/db';
// [NEW]: Kết nối Notification Store để hiển thị lời nhắn nhủ
import { useNotificationStore } from '../store/notification-store';

/**
 * [SERVICE]: Forgiveness Engine (v1.1)
 * Business Rule: 
 * - Giải phóng tâm lý: Đẩy mọi việc từ Focus về Todo sau mốc giờ cài đặt (mặc định 19h).
 * - Phản hồi cảm xúc: Hiển thị Global Toast nếu có việc được giải phóng.
 * - Bảo tồn: Chỉ thay đổi isFocusMode, không can thiệp status hay reset việc lặp lại.
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
      const profile = await db.userProfile.toCollection().first();
      if (!profile) return;

      const now = new Date();
      const currentHour = now.getHours();
      const today = this.getTodayString();

      const forgivenessHour = profile.forgivenessHour ?? 19;
      const lastRun = profile.lastForgivenessRun || '';

      if (currentHour >= forgivenessHour && lastRun !== today) {
        console.log(`[Forgiveness] Đã chạm mốc ${forgivenessHour}h. Bắt đầu giải phóng Focus...`);
        await this.executeForgiveness(today);
      }
    } catch (error) {
      console.error("[Forgiveness Engine Error]:", error);
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
        console.log(`[Forgiveness] Hoàn tất: Giải phóng ${totalCleared} bản ghi.`);

        /**
         * [UI FEEDBACK]: Chỉ hiển thị lời nhắn nhủ nếu thực sự có việc được giải phóng.
         * Sử dụng getState() để kích hoạt Store bên ngoài Component Tree.
         */
        if (totalCleared > 0) {
          const { showNotification } = useNotificationStore.getState();
          showNotification("Hãy nghỉ ngơi! Bạn đã rất nỗ lực.");
        }
      });
    } catch (error) {
      console.error("[Forgiveness Execution Failed]:", error);
    }
  }
};