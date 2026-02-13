import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [CORE LOGIC]: Xử lý Export và Import dữ liệu JSON
 */
export const backupService = {
  // Xuất dữ liệu ra file vật lý
  exportToJson: async () => {
    try {
      triggerHaptic('medium');
      const tasks = await db.tasks.toArray();
      const thoughts = await db.thoughts.toArray();
      const moods = await db.moods.toArray();

      const backupData = {
        version: 1.0,
        timestamp: Date.now(),
        payload: { tasks, thoughts, moods }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindcap_vault_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export completed' };
    } catch (error) {
      return { success: false, message: 'Export failed' };
    }
  },

  // Nhập dữ liệu từ file và ghi đè database
  importFromJson: async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          
          if (!json.payload || !json.payload.tasks) {
            throw new Error("Invalid format");
          }

          triggerHaptic('success');
          
          // Atomic Transaction: Đảm bảo dữ liệu không bị hỏng nếu lỗi giữa chừng
          await db.transaction('rw', [db.tasks, db.thoughts, db.moods], async () => {
            await db.tasks.clear();
            await db.thoughts.clear();
            await db.moods.clear();

            await db.tasks.bulkAdd(json.payload.tasks);
            await db.thoughts.bulkAdd(json.payload.thoughts);
            await db.moods.bulkAdd(json.payload.moods);
          });

          resolve({ success: true });
        } catch (err) {
          reject({ success: false, message: 'Invalid JSON Structure' });
        }
      };
      reader.readAsText(file);
    });
  }
};