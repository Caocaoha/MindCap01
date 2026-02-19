/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v1.9)
 * Fix: Sử dụng cú pháp chuẩn để Workbox Inject Manifest thành công trên Cloudflare.
 */

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<any>;
};

// [CRITICAL]: Điểm neo bắt buộc để trình build bơm danh sách file.
// Chúng ta gán vào một biến và log ra để đảm bảo nó không bị Tree-shaking xóa mất.
const manifest = self.__WB_MANIFEST;
console.log('[MindCap] Service Worker Manifest Injected:', manifest.length);

/**
 * [HELPER]: Hàm xử lý thông báo (Giữ nguyên logic v1.8 của bạn)
 */
const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, labels, origin } = payload;

  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(content, {
          body: labels[index] || "Gia hạn ký ức",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`,
          vibrate: [200, 100, 200],
          data: { url: `${origin}/?open=${entryType}:${entryId}` },
          actions: [{ action: 'open', title: 'Xem chi tiết' }]
        } as any);
      }, delay);
    }
  });
};

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
    handleScheduleRequest(event.data.payload);
  }
});

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