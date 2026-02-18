/**
 * Purpose: Thực thi ghi tệp và cập nhật trạng thái đồng bộ (v1.6).
 * Business Rule: Sử dụng db.table() để truy cập bảng an toàn, tránh lỗi undefined.
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
  sourceTable: 'tasks' | 'thoughts';
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

      // [SAFE UPDATE]: Sử dụng db.table() để đảm bảo bảng luôn được định nghĩa
      await db.transaction('rw', db.tasks, db.thoughts, async () => {
        for (const idea of ideas) {
          const tableName = idea.sourceTable || (idea.hasOwnProperty('type') ? 'thoughts' : 'tasks');
          const table = db.table(tableName); 
          
          if (table) {
            await table.update(Number(idea.id), { 
              syncStatus: 'synced', 
              updatedAt: Date.now() 
            });
          }
        }
      });

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Lỗi đồng bộ:", err);
      throw err;
    }
  }
};