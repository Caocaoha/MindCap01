import { db } from './utils/db';

export const initializeDatabase = async () => {
  try {
    const count = await db.prompt_configs.count();
    
    if (count === 0) {
      console.log('Mind OS: Seeding initial data...');
      
      await db.prompt_configs.bulkAdd([
        {
          id: 'default',
          name: 'Ghi chép tự do',
          content_list: ["Hôm nay bạn cảm thấy thế nào?", "Điều gì quan trọng nhất cần hoàn thành?"]
        },
        {
          id: 'audit',
          name: 'Tự vấn khắc nghiệt',
          content_list: ["Tại sao bạn lại trì hoãn?", "Điều tồi tệ nhất có thể xảy ra là gì?"]
        },
        {
          id: 'free',
          name: 'Dòng chảy (Flow)',
          content_list: []
        }
      ]);

      await db.app_state.bulkPut([
        { key: 'current_prompt_mode', value: 'default' },
        { key: 'last_cyclable_mode', value: 'default' }
      ]);

      console.log('Mind OS: Database initialized.');
    }
  } catch (error) {
    console.error('Mind OS: Database initialization failed', error);
  }
};