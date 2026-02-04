import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // <-- Quan trọng: Nạp giao diện Tailwind
import { initializeDatabase } from './db.init' // <-- Quan trọng: Nạp dữ liệu mẫu

// Chạy hàm khởi tạo Database 1 lần duy nhất
initializeDatabase();

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("Không tìm thấy thẻ có id='root' trong file index.html");
}