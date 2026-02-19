import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.5).
 * Giai đoạn 6.40: 
 * 1. [Delegation]: Chuyển giao logic lập lịch từ UI Thread sang Service Worker.
 * 2. [Reliability]: Đảm bảo thông báo nổ đúng giờ (10p, 24h, 72h) ngay cả khi App đóng.
 * 3. [Architecture]: Tuân thủ quy hoạch kebab-case và Project Structure.
 */

export const NotificationManager = {
  /**
   * [TEST]: Gửi thông báo tức thì sau 5 giây để kiểm tra cổng kết nối OS.
   */
  async sendTestNotification() {
    triggerHaptic('medium');
    
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    
    // Test 5s vẫn giữ setTimeout ngắn hạn để phản hồi nhanh
    setTimeout(() => {
      registration.showNotification("Hệ thống thông báo đã thông suốt! 🚀", {
        body: "Mind Cap: Trí tuệ được giải phóng.",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-notification",
        data: { url: window.location.origin } 
      } as any); 
    }, 5000);
  },

  /**
   * [WATERFALL SCHEDULING]: Ủy quyền lập lịch cho Service Worker.
   * Thay vì dùng setTimeout tại đây, ta gửi thông điệp vào luồng chạy ngầm.
   */
  async scheduleWaterfall(entryId: number, type: 'task' | 'thought', content: string, schedule: number[]) {
    // 1. Kiểm tra quyền hạn và sự sẵn sàng của SW 
    if (!("serviceWorker" in navigator) || Notification.permission !== 'granted') {
      console.warn("[Spark Notification] Quyền thông báo chưa được cấp hoặc SW không hỗ trợ.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const controller = navigator.serviceWorker.controller;

    if (!controller) {
      console.error("[Spark Notification] Không tìm thấy Service Worker controller.");
      return;
    }

    /**
     * [STRATEGY]: Gửi tin nhắn SCHEDULE_SPARK_NOTIFICATION vào Service Worker.
     * SW sẽ nhận mảng schedule và tự quản lý việc hiển thị thông báo.
     */
    controller.postMessage({
      type: 'SCHEDULE_SPARK_NOTIFICATION',
      payload: {
        entryId,
        entryType: type,
        content,
        schedule, // Mảng các timestamp [10p, 24h, 72h] từ SparkEngine
        origin: window.location.origin
      }
    });

    console.log(`[Spark Notification] Đã ủy quyền lập lịch cho bản ghi ${entryId} vào SW.`);
  },

  /**
   * [SNOOZE]: Nhắc lại sau 1 giờ.
   * Tương tự Waterfall, Snooze cũng được gửi vào SW để đảm bảo không bị đóng băng.
   */
  async snooze(entryId: number, type: 'task' | 'thought', content?: string) {
    if (!("serviceWorker" in navigator)) return;
    
    const controller = navigator.serviceWorker.controller;
    if (!controller) return;

    triggerHaptic('light');
    const SNOOZE_DELAY = 60 * 60 * 1000;
    const snoozeTimestamp = Date.now() + SNOOZE_DELAY;

    controller.postMessage({
      type: 'SCHEDULE_SPARK_NOTIFICATION',
      payload: {
        entryId,
        entryType: type,
        content: content || "Ký ức cần xem lại",
        schedule: [snoozeTimestamp],
        isSnooze: true,
        origin: window.location.origin
      }
    });
  }
};