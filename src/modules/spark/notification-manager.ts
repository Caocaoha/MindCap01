import { triggerHaptic } from '../../utils/haptic';

/**
 * [SERVICE]: Spark Notification Messenger (v2.2).
 * Chịu trách nhiệm lập lịch và hiển thị thông báo Spotlight theo mô hình Thác đổ.
 * Giai đoạn 6.21: Tối giản hóa tiêu đề và nội dung để ưu tiên không gian cho content người dùng.
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
      /**
       * [MOD]: Rút gọn tiêu đề thành icon Spark để tiết kiệm không gian.
       */
      registration.showNotification("✨ Test Spark", {
        body: "Hệ thống thông báo đã thông suốt! 🚀",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-notification",
        data: { url: window.location.origin } 
      } as any); 
    }, 5000);
  },

  /**
   * [SNOOZE]: Hành động nhắc lại sau (Mặc định 1 tiếng).
   * Được kích hoạt khi người dùng nhấn nút 'Snooze' trên banner thông báo.
   */
  async snooze(entryId: number, type: 'task' | 'thought', content?: string) {
    if (!("serviceWorker" in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    const SNOOZE_DELAY = 60 * 60 * 1000; 
    const displayContent = content || "Ký ức cần xem lại";

    triggerHaptic('light');

    // Lập lịch một thông báo bổ sung trong bộ nhớ cache của Service Worker
    setTimeout(() => {
      /**
       * [MOD]: Loại bỏ tiền tố "Nhắc lại:" để hiện content ngay từ dòng đầu.
       */
      registration.showNotification("✨ Snooze", {
        body: displayContent,
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
    
    // Các mốc thời gian Waterfall theo thiết kế
    const intervals = [
      { label: '10 phút', delay: 10 * 60 * 1000 },
      { label: '24 giờ', delay: 24 * 60 * 60 * 1000 },
      { label: '72 giờ', delay: 72 * 60 * 60 * 1000 }
    ];

    intervals.forEach((mốc, index) => {
      /**
       * [MOD]: Loại bỏ chuỗi "Ký ức Spotlight:" gây chiếm dụng diện tích.
       * body giờ đây sẽ hiển thị trực tiếp content thô.
       */
      const notificationOptions: any = {
        body: content, 
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
          /**
           * [MOD]: Tiêu đề Spark được rút gọn tối đa.
           */
          registration.showNotification("✨ Spark", notificationOptions);
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
      
      /**
       * [FIX]: Cập nhật Regex để trích xuất content sạch khi tiêu đề đã thay đổi.
       */
      const bodyContent = notification.body;
      
      this.snooze(entryId, type, bodyContent);
      notification.close();
      return;
    }

    const url = notification.data.url;
    notification.close();

    if (url) {
      window.focus();
      window.location.href = url;
    }
  }
};