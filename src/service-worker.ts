/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v1.7)
 * Fix: Thêm self.__WB_MANIFEST để sửa lỗi 'Unable to find a place to inject the manifest'.
 */

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<any>;
};

// [CRITICAL]: Dòng này bắt buộc phải có để Vite PWA có thể inject manifest.
// Đừng xóa hoặc sửa đổi chuỗi self.__WB_MANIFEST.
const manifest = self.__WB_MANIFEST;
console.log('[SW] Manifest injected:', manifest);

const sw = self;

/**
 * [HELPER]: Logic xử lý thông báo (Giữ nguyên từ bản v1.3)
 */
const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, origin, isSnooze } = payload;
  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        const title = isSnooze ? `⏰ Nhắc lại: ${content}` : content;
        sw.registration.showNotification(title, {
          body: isSnooze ? "Ký ức đã Snooze" : "Kích hoạt ký ức (10p)",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`,
          vibrate: [200, 100, 200],
          data: { url: `${origin}/?open=${entryType}:${entryId}` }
        } as any);
      }, delay);
    }
  });
};

sw.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
    handleScheduleRequest(event.data.payload);
  }
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url } = event.notification.data;
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return sw.clients.openWindow(url);
    })
  );
});

export {};