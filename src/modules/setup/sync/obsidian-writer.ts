/**
 * Purpose: Thực thi ghi tệp vật lý và chốt trạng thái Database.
 * Inputs/Outputs: ExtendedIdea[] -> { success, failed }.
 * Business Rule: 
 * - Thực hiện Atomic Transaction: Chỉ update DB khi đã ghi file thành công.
 * - [FIX]: Ép kiểu Number(id) để đảm bảo khớp chính xác khóa chính của IndexedDB.
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
  _dbTable: 'tasks' | 'thoughts';
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

      // [ATOMIC]: Chốt trạng thái trong DB với ID đã được chuẩn hóa kiểu Number
      await db.transaction('rw', db.tasks, db.thoughts, async () => {
        for (const idea of ideas) {
          const table = idea._dbTable === 'tasks' ? db.tasks : db.thoughts;
          await (table as any).update(Number(idea.id), { 
            syncStatus: 'synced', 
            updatedAt: Date.now() 
          });
        }
      });

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Lỗi ghi Obsidian:", err);
      throw err;
    }
  }
};