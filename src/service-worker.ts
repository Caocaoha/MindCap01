/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v2.0)
 * Update: 
 * - Tích hợp Catch-up Logic: Quét IndexedDB để bắn thông báo bù nếu bị trễ giờ.
 * - Layout Update: Title = Content, Body = "" (100% Content focus).
 * - Build Fix: Giữ nguyên điểm neo __WB_MANIFEST cho Cloudflare.
 */

import { db } from './database/db';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<any>;
};

// [CRITICAL]: Điểm neo bắt buộc để trình build bơm danh sách file.
const manifest = self.__WB_MANIFEST;
console.log('[MindCap] Service Worker Manifest Injected:', manifest.length);

/**
 * [CATCH-UP LOGIC]: Quét database để tìm các thông báo bị lỡ do OS "ngủ đông".
 */
const checkMissedNotifications = async () => {
  try {
    const now = Date.now();
    
    /**
     * Tìm tất cả các mốc thời gian:
     * 1. Đã đến hoặc đã qua thời gian dự kiến (scheduledAt <= now).
     * 2. Vẫn đang ở trạng thái 'pending'.
     */
    const missedSchedules = await db.sparkSchedules
      .where('scheduledAt')
      .belowOrEqual(now)
      .and(item => item.status === 'pending')
      .toArray();

    if (missedSchedules.length === 0) return;

    console.log(`[Spark Catch-up] Phát hiện ${missedSchedules.length} thông báo bị trễ. Đang xử lý...`);

    for (const schedule of missedSchedules) {
      // Hiển thị thông báo ngay lập tức
      await self.registration.showNotification(schedule.content, {
        body: "", // Để trống Body theo yêu cầu để banner gọn gàng nhất
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: `spark-${schedule.entryId}-${schedule.scheduledAt}`,
        vibrate: [200, 100, 200],
        data: { url: `/?open=${schedule.entryType}:${schedule.entryId}` }
      } as any);

      // Cập nhật trạng thái đã gửi để không bị lặp lại
      await db.sparkSchedules.update(schedule.id!, { status: 'sent' });
    }
  } catch (error) {
    console.error("[Spark Catch-up Error]:", error);
  }
};

/**
 * [HELPER]: Hàm xử lý lập lịch thông báo từ UI thread.
 */
const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, origin } = payload;

  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();
    
    if (delay > 0) {
      /**
       * Sử dụng setTimeout cho trường hợp App đang mở (Foreground).
       * Nếu App đóng, Catch-up Logic sẽ đảm nhiệm việc quét lại từ Database.
       */
      setTimeout(async () => {
        // Kiểm tra lại trạng thái trong DB trước khi hiển thị
        const record = await db.sparkSchedules
          .where({ entryId, scheduledAt: timestamp })
          .first();

        if (record && record.status === 'pending') {
          self.registration.showNotification(content, {
            body: "", // 100% Content: Body để trống
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: `spark-${entryId}-${index}`,
            vibrate: [200, 100, 200],
            data: { url: `${origin}/?open=${entryType}:${entryId}` },
            actions: [{ action: 'open', title: 'Xem chi tiết' }]
          } as any);

          await db.sparkSchedules.update(record.id!, { status: 'sent' });
        }
      }, delay);
    }
  });
};

/**
 * [EVENTS]: Lắng nghe các sự kiện để đánh thức tiến trình quét ngầm.
 */

// 1. Khi Service Worker kích hoạt
self.addEventListener('activate', (event) => {
  event.waitUntil(checkMissedNotifications());
});

// 2. Khi nhận tin nhắn lập lịch từ UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
    handleScheduleRequest(event.data.payload);
  }
  
  // Mỗi khi có tin nhắn, tiện thể quét luôn các mốc bị lỡ
  event.waitUntil(checkMissedNotifications());
});

// 3. Trình xử lý click thông báo (Giữ nguyên 100%)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url } = event.notification.data;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

export {};