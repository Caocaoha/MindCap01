/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v1.3)
 * Fix: Thay thế postMessage nội bộ bằng hàm helper và sửa kiểu dữ liệu ExtendableMessageEvent.
 */

const sw = (self as unknown) as ServiceWorkerGlobalScope;

/**
 * [HELPER]: Hàm thực hiện lập lịch thông báo.
 * Tách riêng để cả Message Listener và Notification Click đều có thể gọi trực tiếp.
 */
const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, origin, isSnooze } = payload;

  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        const title = isSnooze ? `⏰ Nhắc lại: ${content}` : content;
        const label = isSnooze 
          ? "Ký ức đã Snooze" 
          : (index === 0 ? "Kích hoạt ký ức (10p)" : "Gia hạn ký ức");

        // Ép kiểu any cho options để bypass lỗi vibrate và các thuộc tính mở rộng
        const options: any = {
          body: label,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`, 
          vibrate: [200, 100, 200],
          data: { 
            url: `${origin}/?open=${entryType}:${entryId}`,
            entryId,
            entryType,
            content
          },
          actions: [
            { action: 'snooze', title: 'Nhắc lại sau (1h)' },
            { action: 'open', title: 'Xem chi tiết' }
          ]
        };

        sw.registration.showNotification(title, options);
      }, delay);
    }
  });
};

/**
 * [LISTENER]: Lắng nghe lệnh từ NotificationManager (UI Thread).
 * Sử dụng ExtendableMessageEvent thay vì MessageEvent.
 */
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;
  if (data && data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
    console.log(`[SW] Tiếp nhận yêu cầu lập lịch cho ${data.payload.entryType}:${data.payload.entryId}`);
    handleScheduleRequest(data.payload);
  }
});

/**
 * [LISTENER]: Xử lý khi người dùng tương tác với Banner.
 */
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  const notification = event.notification;
  const action = event.action;
  const { url, entryId, entryType, content } = notification.data;

  notification.close();

  if (action === 'snooze') {
    // Thay vì dùng postMessage (lỗi), ta gọi trực tiếp hàm helper
    const SNOOZE_DELAY = 60 * 60 * 1000;
    const snoozeTime = Date.now() + SNOOZE_DELAY;

    handleScheduleRequest({
      entryId,
      entryType,
      content,
      schedule: [snoozeTime],
      isSnooze: true,
      origin: url.split('/?')[0]
    });
    return;
  }

  // Xử lý Deep Linking mở App
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const c = client as WindowClient;
        if (c.url === url && 'focus' in c) {
          return c.focus();
        }
      }
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(url);
      }
    })
  );
});

export {};