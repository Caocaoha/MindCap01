import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// 1. Bắt lỗi hệ thống
window.onerror = (message, source, lineno) => {
  console.error(`LỖI: ${message} tại dòng ${lineno}`);
  return false; 
};

window.onunhandledrejection = (event) => {
  console.error(`LỖI DỮ LIỆU: ${event.reason}`);
};

// 2. Đăng ký Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Sau khi build, file .ts sẽ trở thành .js trong thư mục dist
    navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
      .then(registration => console.log('Mind Cap SW Ready:', registration.scope))
      .catch(error => console.error('SW Registration Fail:', error));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)