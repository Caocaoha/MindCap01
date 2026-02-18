/**
 * Purpose: Ghi file vật lý và chốt trạng thái 'synced' trong database.
 * Inputs/Outputs: ExtendedIdea[] -> Result.
 * Business Rule: 
 * - Sử dụng mỏ neo sourceTable để xác định đúng bảng cần cập nhật.
 * - Ép kiểu Number(id) để tránh lỗi lệch kiểu dữ liệu trên Cloudflare.
 * - Thực hiện Atomic-like update: Ghi file xong mới đổi trạng thái DB.
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

      // [KỶ LUẬT CẬP NHẬT]: Dựa vào sourceTable đã được đóng băng
      for (const idea of ideas) {
        const table = db.table(idea.sourceTable);
        if (table) {
          await table.update(Number(idea.id), { 
            syncStatus: 'synced', 
            updatedAt: Date.now() 
          });
        }
      }

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Critical Writer Error:", err);
      throw err;
    }
  }
};