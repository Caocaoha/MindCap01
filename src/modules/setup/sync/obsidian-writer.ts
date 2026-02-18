/**
 * Purpose: Thực thi ghi tệp vật lý và cập nhật Database trạng thái Synced.
 * Inputs/Outputs: ExtendedIdea[] -> Kết quả số lượng bản ghi đã xử lý.
 * Business Rule: 
 * - Sử dụng sourceTable để tìm đúng bảng nguồn (tasks/thoughts).
 * - Sử dụng db.transaction để đảm bảo tính nguyên tử (ghi thành công mới update DB).
 * - Ép kiểu Number(id) tuyệt đối để khớp khóa chính IndexedDB.
 */

import { db } from '../../../database/db';
import { syncFormatter } from './sync-formatter';

export interface ExtendedIdea {
  id: number;
  content: string;
  createdAt: number;
  interactionScore?: number;
  tags?: string[];
  isBookmarked?: boolean;
  bookmarkReason?: string;
  sourceTable: 'tasks' | 'thoughts'; // Bắt buộc từ Version 9
}

export const obsidianWriter = {
  async writeToVault(ideas: ExtendedIdea[]): Promise<{ success: number; failed: number }> {
    try {
      const rootHandle = await (window as any).showDirectoryPicker();
      const folder = await rootHandle.getDirectoryHandle('MindCap', { create: true });
      
      const fileContent = syncFormatter.formatSingleFile(ideas);
      const fileName = `MindCap_Sync_${new Date().getTime()}.md`;
      
      const fileHandle = await folder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      // [ATOMIC UPDATE]: Chỉ thực thi khi file đã ghi thành công
      await db.transaction('rw', db.tasks, db.thoughts, async () => {
        for (const idea of ideas) {
          const table = idea.sourceTable === 'tasks' ? db.tasks : db.thoughts;
          // [KỶ LUẬT ID]: Luôn dùng kiểu Number để khớp database
          await (table as any).update(Number(idea.id), { 
            syncStatus: 'synced', 
            updatedAt: Date.now() 
          });
        }
      });

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Critical Sync Error:", err);
      throw err;
    }
  }
};