/**
 * [SERVICE WORKER]: Spark Background Processor (v1.0)
 * Purpose: Quản lý thông báo và tương tác người dùng khi App không hoạt động.
 * Capabilities: 
 * - Lập lịch thông báo Waterfall/Snooze chạy ngầm[cite: 15].
 * - Xử lý Deep Linking (?open=type:id)[cite: 9, 10].
 * - Xử lý hành động Snooze trực tiếp trên Banner[cite: 13, 14].
 */

// Đăng ký lắng nghe sự kiện Message từ luồng UI (NotificationManager)
self.addEventListener('message', (event) => {
    const data = event.data;
  
    if (data && data.type === 'SCHEDULE_SPARK_NOTIFICATION') {
      const { entryId, entryType, content, schedule, origin, isSnooze } = data.payload;
  
      console.log(`[SW] Tiếp nhận lập lịch cho ${entryType}:${entryId}. Số mốc: ${schedule.length}`);
  
      // Duyệt qua từng mốc thời gian trong lịch trình Waterfall
      schedule.forEach((timestamp: number, index: number) => {
        const delay = timestamp - Date.now();
  
        if (delay > 0) {
          // Sử dụng setTimeout trong SW để kích hoạt thông báo
          // Lưu ý: Trong môi trường PWA thực tế, SW có thể bị ngủ đông nếu delay quá dài.
          // Để đạt độ tin cậy 100% cho mốc 24h/72h, nên kết hợp với Periodic Sync hoặc Push API.
          setTimeout(() => {
            const title = isSnooze ? `⏰ Nhắc lại: ${content}` : content;
            const label = isSnooze ? "Ký ức đã Snooze" : (index === 0 ? "Kích hoạt ký ức (10p)" : "Gia hạn ký ức");
  
            (self as any).registration.showNotification(title, {
              body: label,
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              tag: `spark-${entryId}-${index}`, // Tránh trùng lặp thông báo
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
            });
          }, delay);
        }
      });
    }
  });
  
  // Xử lý sự kiện tương tác với thông báo (Click vào Banner hoặc Button)
  self.addEventListener('notificationclick', (event: any) => {
    const notification = event.notification;
    const action = event.action;
    const { url, entryId, entryType, content } = notification.data;
  
    // Đóng thông báo ngay sau khi tương tác
    notification.close();
  
    if (action === 'snooze') {
      /**
       * [ACTION]: Xử lý Snooze trực tiếp từ Service Worker.
       * Tự động lập lịch lại sau 1 giờ[cite: 14].
       */
      const SNOOZE_DELAY = 60 * 60 * 1000;
      const snoozeTime = Date.now() + SNOOZE_DELAY;
  
      // Tự gửi lại tin nhắn cho chính mình để lập lịch snooze
      self.postMessage({
        type: 'SCHEDULE_SPARK_NOTIFICATION',
        payload: {
          entryId,
          entryType,
          content,
          schedule: [snoozeTime],
          isSnooze: true,
          origin: url.split('/?')[0]
        }
      });
      
      return;
    }
  
    /**
     * [ACTION]: Xử lý Deep Linking.
     * Tìm kiếm cửa sổ App đang mở hoặc mở cửa sổ mới với tham số điều hướng[cite: 9, 10].
     */
    event.waitUntil(
      (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any) => {
        // Nếu App đang mở, tập trung vào cửa sổ đó và điều hướng
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Nếu App chưa mở, mở tab mới với URL chứa ?open=...
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(url);
        }
      })
    );
  });