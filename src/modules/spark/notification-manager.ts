import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.7).
 * Giai đoạn 6.46: 
 * - [Fix]: Sửa lỗi TS2304 "Cannot find name 'entryType'".
 * - [Safety]: Đảm bảo biến 'type' được sử dụng nhất quán trong toàn bộ hàm.
 */

export const NotificationManager = {
  /**
   * [TEST]: Gửi thông báo tức thì sau 5 giây để kiểm tra cổng kết nối OS.
   */
  async sendTestNotification() {
    triggerHaptic('medium');
    
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    
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
   * [WATERFALL SCHEDULING]: Ủy quyền lập lịch cho Service Worker chạy ngầm.
   */
  async scheduleWaterfall(entryId: number, type: 'task' | 'thought', content: string, schedule: number[]) {
    // 1. Kiểm tra quyền hạn và sự sẵn sàng của SW
    if (!("serviceWorker" in navigator)) return;
    
    if (Notification.permission !== 'granted') {
      console.warn("[Spark Notification] Quyền thông báo chưa được cấp.");
      return;
    }

    try {
      // Chờ cho đến khi Service Worker sẵn sàng
      const registration = await navigator.serviceWorker.ready;
      const controller = navigator.serviceWorker.controller;

      // [SAFETY CHECK]: Chỉ gửi tin nhắn nếu Controller đã active
      if (controller) {
        controller.postMessage({
          type: 'SCHEDULE_SPARK_NOTIFICATION',
          payload: {
            entryId,
            entryType: type, // Ánh xạ từ 'type' sang 'entryType' cho Service Worker
            content,
            schedule, 
            origin: window.location.origin
          }
        });
        // [FIXED]: Sử dụng đúng tên biến 'type' đã khai báo ở tham số hàm
        console.log(`[Spark Notification] Đã ủy quyền lập lịch cho ${type}:${entryId}.`);
      } else {
        console.warn("[Spark Notification] SW Controller chưa sẵn sàng. Hãy F5 trang web.");
      }
    } catch (error) {
      console.error("[Spark Notification Error]:", error);
    }
  },

  /**
   * [SNOOZE]: Nhắc lại sau 1 giờ.
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