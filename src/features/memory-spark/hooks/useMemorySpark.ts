// src/features/memory-spark/hooks/useMemorySpark.ts
import { scheduler } from '../scheduler';
import { useUIStore } from '../../../core/store'; // Giả định dùng Zustand/Store quản lý UI

export const useMemorySpark = () => {
  const { isInputOpen } = useUIStore(); // Lấy trạng thái UniversalInput

  const handleTrigger = async (id: string) => {
    // Kiểm tra Exclusion Rule
    if (isInputOpen) {
      console.log("MEM: User is typing. Spark queued.");
      // Thử lại sau 30 giây nếu người dùng vẫn đang bận
      setTimeout(() => handleTrigger(id), 30000);
      return;
    }

    // Hiển thị Popup (Hà sẽ code UI ở bước sau)
    console.log("✨ MEMORY SPARK ACTIVATED:", id);
    
    // Sau khi xử lý xong, tìm kẻ tiếp theo ngay lập tức
    await scheduler.reSchedule(handleTrigger);
  };

  return { 
    startService: () => scheduler.reSchedule(handleTrigger) 
  };
};