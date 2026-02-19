import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.4).
 * Giai đoạn 6.31: 
 * 1. [Sync]: Tiếp nhận mảng schedule chính thức từ SparkEngine thông qua EntryService.
 * 2. [Waterfall]: Thực hiện đăng ký đầy đủ các mốc nhắc nhở (10p, 24h, 72h) thay vì chỉ mốc đầu tiên.
 * 3. [Deep Linking]: Duy trì tham số open trong data để App.tsx điều hướng chính xác.
 */

export const NotificationManager = {
  /**
   * [TEST]: Gửi thông báo tức thì sau 5 giây.
   */
  async sendTestNotification() {
    triggerHaptic('medium');
    
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    
    setTimeout(() => {
      /**
       * [MOD]: Đẩy content lên Title để hiện dòng đầu tiên in đậm trên iOS.
       */
      registration.showNotification("Hệ thống thông báo đã thông suốt! 🚀", {
        body: "", // Bỏ trống body để tiết kiệm diện tích
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-notification",
        data: { url: window.location.origin } 
      } as any); 
    }, 5000);
  },

  /**
   * [SNOOZE]: Hành động nhắc lại sau.
   */
  async snooze(entryId: number, type: 'task' | 'thought', content?: string) {
    if (!("serviceWorker" in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    const SNOOZE_DELAY = 60 * 60 * 1000; 
    const displayContent = content || "Ký ức cần xem lại";

    triggerHaptic('light');

    setTimeout(() => {
      registration.showNotification(displayContent, {
        body: "✨ Snooze (1h)", // Hiện label nhỏ ở dưới
        icon: "/icon-192x192.png",
        tag: `spark-snooze-${entryId}`,
        data: { 
          url: `${window.location.origin}/?open=${type}:${entryId}`,
          entryId
        }
      } as any);
    }, SNOOZE_DELAY);
  },

  /**
   * [WATERFALL SCHEDULING]: Lập lịch các mốc thời gian Spotlight dựa trên tính toán từ SparkEngine.
   * @param entryId - ID của bản ghi.
   * @param type - Loại bản ghi (task/thought).
   * @param content - Nội dung bản ghi để hiển thị Spotlight trên banner.
   * @param schedule - Mảng các mốc timestamp (Date.now() + interval) nhận từ EntryService.
   */
  async scheduleWaterfall(entryId: number, type: 'task' | 'thought', content: string, schedule: number[]) {
    if (!("serviceWorker" in navigator) || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    
    // Nhãn hiển thị cho các giai đoạn tương ứng với mảng schedule [10p, 24h, 72h]
    const labels = ['Nhắc nhở 10p', 'Nhắc nhở 24h', 'Nhắc nhở 72h'];

    schedule.forEach((timestamp, index) => {
      const delay = timestamp - Date.now();
      
      // Chỉ lập lịch cho các mốc thời gian trong tương lai
      if (delay > 0) {
        const notificationOptions: any = {
          // [MOD]: Nội dung bản ghi đóng vai trò tiêu đề ưu tiên nhất (Spotlight) 
          body: labels[index] || "Gia hạn ký ức", 
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`,
          // Lưu trữ metadata để App.tsx thực hiện Deep Link khi nhấn vào banner [cite: 9, 22]
          data: { 
            url: `${window.location.origin}/?open=${type}:${entryId}`,
            entryId,
            entryType: type
          },
          actions: [
            { action: 'snooze', title: 'Nhắc lại sau (1h)' }
          ],
          // Hỗ trợ chế độ rung tùy chỉnh nếu trình duyệt cho phép
          vibrate: [200, 100, 200]
        };

        // Đăng ký thông báo cục bộ thông qua setTimeout (Luồng tạm thời cho PWA)
        setTimeout(() => {
          registration.showNotification(content, notificationOptions);
        }, delay);
      }
    });
  }
};