import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.9).
 * Giai đoạn 6.47: 
 * - [Update]: Bổ sung tham số isExtended để phân loại nhãn thời gian (10p, 24h... vs 7 ngày, 30 ngày...).
 * - [Layout]: Truyền mảng 'labels' sang Service Worker để hiển thị vào phần Body của thông báo.
 * - [Safety]: Giữ nguyên cơ chế kiểm tra Controller và quyền Notification.
 */

/**
 * Hàm hỗ trợ lấy nhãn hiển thị tương ứng với từng giai đoạn của Spark Engine.
 */
const GET_LABELS = (isExtended: boolean): string[] => {
  if (isExtended) {
    return ["7 ngày", "30 ngày", "4 tháng"];
  }
  return ["10 phút", "24 giờ", "72 giờ"];
};

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
   * Bổ sung tham số isExtended để xác định tập nhãn thời gian cần hiển thị.
   */
  async scheduleWaterfall(
    entryId: number, 
    type: 'task' | 'thought', 
    content: string, 
    schedule: number[], 
    isExtended: boolean = false
  ) {
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
            labels: GET_LABELS(isExtended), // Gửi mảng nhãn thời gian để SW hiển thị vào Body
            origin: window.location.origin
          }
        });
        
        // [LOG]: Theo dõi tiến trình lập lịch trong Console
        console.log(`[Spark Notification] Đã ủy quyền lập lịch cho ${type}:${entryId}. Chế độ: ${isExtended ? 'Gia hạn' : 'Khởi tạo'}`);
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
        labels: ["Nhắc lại (1 giờ)"], // Nhãn đặc biệt cho hành động Snooze
        isSnooze: true,
        origin: window.location.origin
      }
    });
  }
};