import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// === HỆ THỐNG BÁO ĐỘNG VÀ ĐĂNG KÝ SW ===

window.onerror = (message, source, lineno) => {
  console.error(`LỖI HỆ THỐNG: ${message} tại dòng ${lineno}`);
  return false; 
};

window.onunhandledrejection = (event) => {
  console.error(`LỖI DỮ LIỆU: ${event.reason}`);
};

// ĐĂNG KÝ SERVICE WORKER (SPARK)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Lưu ý: Sau khi build, file .ts sẽ trở thành .js trong thư mục dist
    navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
      .then(registration => {
        console.log('Mind Cap SW Ready:', registration.scope);
      })
      .catch(error => {
        console.error('SW Registration Failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)