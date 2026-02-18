/**
 * Purpose: Thực thi ghi file và chốt trạng thái 'synced' cưỡng bách.
 * Business Rule: 
 * - [FALLBACK]: Nếu không có sourceTable, tự quét ID ở cả 2 bảng.
 * - Ép kiểu Number(id) để tránh lệch kiểu trên Cloudflare.
 */

import { db } from '../../../database/db';
import { syncFormatter } from './sync-formatter';

export interface ExtendedIdea {
  id: number;
  content: string;
  sourceTable?: 'tasks' | 'thoughts';
  [key: string]: any;
}

export const obsidianWriter = {
  async writeToVault(ideas: ExtendedIdea[]): Promise<{ success: number; failed: number }> {
    try {
      const rootHandle = await (window as any).showDirectoryPicker();
      const folder = await rootHandle.getDirectoryHandle('MindCap', { create: true });
      const fileContent = syncFormatter.formatSingleFile(ideas);
      const fileName = `MindCap_Sync_${Date.now()}.md`;
      
      const fileHandle = await folder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      // [PHÒNG THỦ]: Cập nhật trạng thái từng bản ghi
      for (const idea of ideas) {
        const numId = Number(idea.id);
        const updateData = { syncStatus: 'synced', updatedAt: Date.now() };

        if (idea.sourceTable) {
          await (db as any)[idea.sourceTable].update(numId, updateData);
        } else {
          // Fallback cho bản ghi cũ: Thử cập nhật ở cả 2 bảng
          await Promise.all([
            db.tasks.update(numId, updateData),
            db.thoughts.update(numId, updateData)
          ]);
        }
      }
      return { success: ideas.length, failed: 0 };
    } catch (err) { throw err; }
  }
};