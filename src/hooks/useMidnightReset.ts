import { useEffect } from 'react';
import { performMidnightReset } from '../utils/db';

export const useMidnightReset = () => {
  useEffect(() => {
    const checkAndReset = async () => {
      const lastResetDate = localStorage.getItem('last_midnight_reset');
      const today = new Date().toISOString().split('T')[0];

      // Nếu ngày hiện tại khác với ngày reset cuối cùng
      if (lastResetDate !== today) {
        try {
          await performMidnightReset();
          // Cập nhật ngày reset mới nhất vào bộ nhớ trình duyệt
          localStorage.setItem('last_midnight_reset', today);
        } catch (error) {
          console.error("Lỗi khi reset tâm trí:", error);
        }
      }
    };

    // Kiểm tra ngay khi ứng dụng khởi chạy
    checkAndReset();

    // Thiết lập kiểm tra mỗi 1 phút để bắt kịp khoảnh khắc giao thừa nếu app đang mở
    const interval = setInterval(checkAndReset, 60000);
    return () => clearInterval(interval);
  }, []);
};