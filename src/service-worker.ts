/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v2.1)
 * Update: 
 * - Tích hợp Auto-Cleanup Logic: Tự động xóa các mốc 'sent' cũ sau 24 giờ.
 * - Catch-up Logic: Quét IndexedDB để bắn thông báo bù nếu bị trễ giờ.
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
 * [CLEANUP LOGIC]: Tự động dọn dẹp các bản ghi đã gửi hoặc đã quá hạn để tối ưu bộ nhớ.
 */
const performCleanup = async () => {
  try {
    const RETENTION_WINDOW = 24 * 60 * 60 * 1000; // Ngưỡng an toàn: 24 giờ
    const cleanupThreshold = Date.now() - RETENTION_WINDOW;

    /**
     * Thực hiện xóa hàng loạt (Bulk Delete):
     * 1. Các bản ghi đã gửi (status: 'sent') và đã quá 24 giờ.
     * 2. Các bản ghi bị lỡ (status: 'pending') nhưng đã quá hạn hơn 48 giờ (hết giá trị nhắc lại).
     */
    const oldSentRecords = await db.sparkSchedules
      .where('scheduledAt')
      .below(cleanupThreshold)
      .and(item => item.status === 'sent')
      .primaryKeys();

    if (oldSentRecords.length > 0) {
      await db.sparkSchedules.bulkDelete(oldSentRecords);
      console.log(`[Spark Cleanup] Đã dọn dẹp ${oldSentRecords.length} bản ghi cũ.`);
    }
  } catch (error) {
    console.error("[Spark Cleanup Error]:", error);
  }
};

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
        body: "", // 100% Content focus
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: `spark-${schedule.entryId}-${schedule.scheduledAt}`,
        vibrate: [200, 100, 200],
        data: { url: `/?open=${schedule.entryType}:${schedule.entryId}` }
      } as any);

      // Cập nhật trạng thái đã gửi
      await db.sparkSchedules.update(schedule.id!, { status: 'sent' });
    }
    
    // Sau khi xử lý bù, thực hiện dọn dẹp rác
    await performCleanup();
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
      setTimeout(async () => {
        // Kiểm tra lại trạng thái trong DB trước khi hiển thị để tránh trùng lặp
        const record = await db.sparkSchedules
          .where({ entryId, scheduledAt: timestamp })
          .first();

        if (record && record.status === 'pending') {
          self.registration.showNotification(content, {
            body: "", // Layout v2.3: 100% Content
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: `spark-${entryId}-${index}`,
            vibrate: [200, 100, 200],
            data: { url: `${origin}/?open=${entryType}:${entryId}` },
            actions: [{ action: 'open', title: 'Xem chi tiết' }]
          } as any);

          // Cập nhật trạng thái thành 'sent' và kích hoạt dọn dẹp nhẹ
          await db.sparkSchedules.update(record.id!, { status: 'sent' });
          await performCleanup();
        }
      }, delay);
    }
  });
};

/**
 * [EVENTS]: Lắng nghe các sự kiện để đánh thức tiến trình quét ngầm.
 */

// 1. Khi Service Worker kích hoạt: Quét bù và dọn dẹp hệ thống
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      checkMissedNotifications(),
      performCleanup()
    ])
  );
});

// 2. Khi nhận tin nhắn lập lịch từ UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
    handleScheduleRequest(event.data.payload);
  }
  
  // Mỗi khi có tương tác, tranh thủ kiểm tra và dọn dẹp
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