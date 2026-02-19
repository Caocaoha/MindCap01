/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v1.8)
 * Layout Update: 
 * - Title: 100% Nội dung bản ghi (Content).
 * - Body: Nhãn thời gian (10 phút, 24h...).
 */

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<any> };
const manifest = self.__WB_MANIFEST; 

const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, labels, origin } = payload;

  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        // [LAYOUT v2.0]: Đưa content làm tiêu đề chính
        const title = content; 
        const intervalLabel = labels[index] || "Gia hạn ký ức";

        self.registration.showNotification(title, {
          body: intervalLabel, // Thông số thời gian nằm dưới icon
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`,
          vibrate: [200, 100, 200],
          data: { url: `${origin}/?open=${entryType}:${entryId}` },
          actions: [
            { action: 'open', title: 'Xem chi tiết' }
          ]
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