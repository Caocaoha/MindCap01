import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.3).
 * Giai đoạn 6.30: Tối ưu hiển thị iOS (Content -> Title) và sửa lỗi Deep Linking.
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
   * [WATERFALL SCHEDULING]: Lập lịch các mốc thời gian Spotlight.
   */
  async scheduleWaterfall(entryId: number, type: 'task' | 'thought', content: string) {
    if (!("serviceWorker" in navigator) || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    
    const intervals = [
      { label: '10 phút', delay: 10 * 60 * 1000 },
      { label: '24 giờ', delay: 24 * 60 * 60 * 1000 },
      { label: '72 giờ', delay: 72 * 60 * 60 * 1000 }
    ];

    intervals.forEach((mốc, index) => {
      const notificationOptions: any = {
        // [MOD]: Content chính thức làm tiêu đề
        body: "", 
        icon: "/icon-192x192.png",
        tag: `spark-${entryId}-${index}`,
        data: { 
          url: `${window.location.origin}/?open=${type}:${entryId}`,
          entryId
        },
        actions: [
          { action: 'snooze', title: 'Nhắc lại sau (1h)' }
        ]
      };

      if (index === 0) {
        setTimeout(() => {
          // Tiêu đề là content thô để hiện được nhiều nhất
          registration.showNotification(content, notificationOptions);
        }, mốc.delay);
      }
    });
  }
};