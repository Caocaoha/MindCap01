import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.2).
 * Chịu trách nhiệm lập lịch và hiển thị thông báo Spotlight theo mô hình Thác đổ.
 */

export const NotificationManager = {
  /**
   * [TEST]: Gửi thông báo tức thì sau 5 giây để kiểm tra kết nối trên iPhone.
   */
  async sendTestNotification() {
    triggerHaptic('medium');
    
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    
    // Đăng ký thông báo hiển thị sau 5 giây để người dùng kịp khóa màn hình
    setTimeout(() => {
      registration.showNotification("Mind Cap: Test Spark", {
        body: "Nếu bạn thấy dòng này, hệ thống thông báo đã thông suốt! 🚀",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-notification",
        data: { url: window.location.origin } 
      } as any); // Ép kiểu any để hỗ trợ các thuộc tính mở rộng của PWA/Service Worker
    }, 5000);
  },

  /**
   * [SNOOZE]: Hành động nhắc lại sau (Mặc định 1 tiếng).
   * Được kích hoạt khi người dùng nhấn nút 'Snooze' trên banner thông báo.
   * * @param entryId ID của bản ghi
   * @param type Loại bản ghi (task/thought)
   * @param content Nội dung cần hiển thị (Không bắt buộc để tránh lỗi TS2554)
   */
  async snooze(entryId: number, type: 'task' | 'thought', content?: string) {
    if (!("serviceWorker" in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    const SNOOZE_DELAY = 60 * 60 * 1000; // Khoảng thời gian 1 tiếng
    const displayContent = content || "Ký ức cần xem lại";

    triggerHaptic('light');

    // Lập lịch một thông báo bổ sung trong bộ nhớ cache của Service Worker
    setTimeout(() => {
      registration.showNotification("Mind Cap (Snooze)", {
        body: `Nhắc lại: "${displayContent.substring(0, 40)}..."`,
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
   * [WATERFALL SCHEDULING]: Lập lịch các mốc thời gian Spotlight (10m, 24h, 72h).
   */
  async scheduleWaterfall(entryId: number, type: 'task' | 'thought', content: string) {
    if (!("serviceWorker" in navigator) || Notification.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const now = Date.now();

    // Các mốc thời gian Waterfall theo thiết kế
    const intervals = [
      { label: '10 phút', delay: 10 * 60 * 1000 },
      { label: '24 giờ', delay: 24 * 60 * 60 * 1000 },
      { label: '72 giờ', delay: 72 * 60 * 60 * 1000 }
    ];

    intervals.forEach((mốc, index) => {
      /**
       * Ép kiểu any cho options để vượt qua lỗi TS2353 liên quan đến thuộc tính 'actions'
       * vốn là thuộc tính hợp lệ trong Service Worker Notification nhưng chưa được cập nhật trong Type gốc.
       */
      const notificationOptions: any = {
        body: `Ký ức Spotlight: "${content.substring(0, 40)}..."`,
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

      // Mốc 10 phút đầu tiên được xử lý trực tiếp khi App còn trong bộ nhớ đệm
      if (index === 0) {
        setTimeout(() => {
          registration.showNotification("Mind Cap Spark", notificationOptions);
        }, mốc.delay);
      }
    });
  },

  /**
   * [DEEP LINKING]: Xử lý logic khi tương tác với thông báo.
   */
  handleNotificationClick(event: any) {
    const notification = event.notification;
    const action = event.action;

    // Phân tích hành động từ nút bấm (Snooze) hoặc chạm vào thân thông báo
    if (action === 'snooze') {
      const entryId = notification.data.entryId;
      const url = notification.data.url;
      const type = url.includes('task') ? 'task' : 'thought';
      
      // Lấy lại nội dung từ thân thông báo cũ để truyền vào hàm snooze
      const bodyContent = notification.body.replace('Ký ức Spotlight: "', '').replace('..."', '');
      
      this.snooze(entryId, type, bodyContent);
      notification.close();
      return;
    }

    const url = notification.data.url;
    notification.close();

    if (url) {
      // Đưa người dùng quay lại đúng bản ghi thông qua Deep Linking
      window.focus();
      window.location.href = url;
    }
  }
};