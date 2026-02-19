/// <reference lib="webworker" />

/**
 * [SERVICE WORKER]: Spark Background Processor (v1.6)
 * Fix: Thêm biến __WB_MANIFEST chuẩn để trình build nhận diện được điểm Inject.
 */

// Định nghĩa kiểu dữ liệu để TypeScript không báo lỗi
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<any>;
};

// [CRITICAL]: Dòng này cực kỳ quan trọng. Trình build sẽ tìm chính xác chuỗi này.
// Đừng xóa hoặc sửa tên biến __WB_MANIFEST.
const manifest = self.__WB_MANIFEST;
console.log('[SW] Manifest đã được Inject thành công:', manifest);

/**
 * Logic xử lý thông báo (Giữ nguyên phần bạn đã có bên dưới)
 */
const handleScheduleRequest = (payload: any) => {
  const { entryId, entryType, content, schedule, origin, isSnooze } = payload;
  schedule.forEach((timestamp: number, index: number) => {
    const delay = timestamp - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        const title = isSnooze ? `⏰ Nhắc lại: ${content}` : content;
        self.registration.showNotification(title, {
          body: isSnooze ? "Ký ức đã Snooze" : "Kích hoạt ký ức",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `spark-${entryId}-${index}`,
          data: { url: `${origin}/?open=${entryType}:${entryId}` }
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

export {};