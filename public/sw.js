/**
 * [SERVICE WORKER]: Xử lý sự kiện click thông báo (v1.0).
 * Đây là phần chạy độc lập với React để có thể đánh thức ứng dụng trên iOS.
 */
self.addEventListener('notificationclick', function(event) {
    const notification = event.notification;
    const action = event.action;
    const urlToOpen = notification.data.url;
  
    // Đóng thông báo ngay khi click
    notification.close();
  
    // Logic: Tìm xem tab app có đang mở không, nếu có thì focus, nếu không thì mở mới
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          // Nếu tìm thấy tab đang mở đúng địa chỉ, chỉ cần focus
          if (client.visibilityState === 'visible' || 'focus' in client) {
            return client.focus();
          }
        }
        // Nếu không thấy tab nào, mở một cửa sổ mới với URL deep link
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  });