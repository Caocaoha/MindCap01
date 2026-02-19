import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// === PHẦN MỚI: CÀI ĐẶT HỆ THỐNG BÁO ĐỘNG TOÀN CỤC ===

// 1. Bắt lỗi code thông thường (Cú pháp, biến undefined...)
window.onerror = function (message, source, lineno, colno, error) {
  const errorMsg = `LỖI HỆ THỐNG:\n${message}\nTại dòng: ${lineno}`;
  console.error(errorMsg);
  // Chỉ hiện alert nếu đang debug hoặc gặp lỗi nghiêm trọng
  alert(errorMsg); 
  return false; 
};

// 2. Bắt lỗi Promise (Database, API, Mạng...) -> QUAN TRỌNG NHẤT VỚI APP CỦA BẠN
window.onunhandledrejection = function (event) {
  const reason = event.reason;
  let message = 'Lỗi không xác định';

  if (reason instanceof Error) {
    message = reason.message;
  } else if (typeof reason === 'string') {
    message = reason;
  } else {
    message = JSON.stringify(reason);
  }

  // Bỏ qua lỗi resize (lỗi vặt của trình duyệt không ảnh hưởng App)
  if (message.includes('ResizeObserver')) return;

  const alertMsg = `LỖI DỮ LIỆU (DB/Mạng):\n${message}`;
  console.error(alertMsg);
  
  // BẮT BUỘC HIỆN LÊN MÀN HÌNH ĐIỆN THOẠI
  alert(alertMsg);
};

// 3. ĐĂNG KÝ SERVICE WORKER (SPARK BACKGROUND ENGINE)
// [NEW]: Kích hoạt luồng chạy ngầm để xử lý Waterfall Notification và Deep Linking.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Lưu ý: Đường dẫn 'service-worker.js' là kết quả sau khi build từ src/service-worker.ts
    navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
      .then(registration => {
        console.log('Mind Cap Service Worker đã sẵn sàng: ', registration.scope);
      })
      .catch(error => {
        console.error('Lỗi đăng ký Service Worker:', error);
      });
  });
}

// ========================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)