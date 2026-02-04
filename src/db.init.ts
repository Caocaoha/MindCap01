import { db } from './db';

/**
 * Hàm khởi tạo dữ liệu mẫu cho lần chạy đầu tiên.
 * Chỉ chạy khi bảng prompt_configs trống.
 */
export const initializeDatabase = async () => {
  try {
    const count = await db.prompt_configs.count();
    
    if (count === 0) {
      console.log('Mind OS: Seeding initial data...');
      
      // 1. Tạo các bộ câu hỏi mặc định
      await db.prompt_configs.bulkAdd([
        {
          id: 'default',
          name: 'Ghi chép tự do',
          content_list: [
            "Hôm nay bạn cảm thấy thế nào?",
            "Điều gì quan trọng nhất cần hoàn thành?",
            "Có điều gì đang làm phiền tâm trí bạn không?"
          ]
        },
        {
          id: 'audit',
          name: 'Tự vấn khắc nghiệt',
          content_list: [
            "Tại sao bạn lại trì hoãn việc này?",
            "Điều tồi tệ nhất có thể xảy ra là gì?",
            "Bạn đang trốn tránh điều gì?",
            "Đây có phải là cái tôi (Ego) đang lên tiếng?"
          ]
        },
        {
          id: 'free',
          name: 'Dòng chảy (Flow)',
          content_list: [] // Rỗng để viết không giới hạn
        }
      ]);

      // 2. Thiết lập trạng thái ban đầu
      await db.app_state.bulkPut([
        { key: 'current_prompt_mode', value: 'default' },
        { key: 'last_cyclable_mode', value: 'default' }
      ]);

      console.log('Mind OS: Database initialized successfully.');
    }
  } catch (error) {
    console.error('Mind OS: Database initialization failed', error);
  }
};