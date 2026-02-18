/**
 * Purpose: Thực thi ghi dữ liệu tri thức vào Obsidian Vault với tính nguyên tử cao.
 * Business Rule: 
 * - Sử dụng Transaction để đảm bảo không sót bản ghi, không trùng lặp.
 * - [FIX]: Đồng bộ kiểu dữ liệu ID (Number) trực tiếp từ Database JSON.
 * - [NEW]: Template Markdown tối giản, tích hợp sâu phần Bookmark.
 */

import { db } from '../../../database/db';

export interface ExtendedIdea {
  id: number; // [FIX]: Sử dụng kiểu Number đồng bộ với ID thực trong JSON
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
      // 1. Yêu cầu chọn Vault gốc
      const rootHandle = await (window as any).showDirectoryPicker();
      const mindCapFolder = await rootHandle.getDirectoryHandle('MindCap', { create: true });

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      // 2. Khởi tạo Nội dung theo Template mới (Bỏ Header mẩu tin)
      let fileContent = `# 📥 MindCap Export: ${dateStr} | ${timeStr}\n\n`;
      fileContent += `## 📊 Tổng quan phiên\n`;
      fileContent += `- **Số lượng:** ${ideas.length} bản ghi\n`;
      fileContent += `- **Trạng thái:** #inbox/processing\n\n---\n\n`;

      for (const idea of ideas) {
        const tags = (idea.tags || []).map((t: string) => "#" + t).join(' ') || '#uncategorized';
        const shortId = Math.random().toString(36).substring(2, 8);

        // [TEMPLATE MỚI]: Tập trung vào Metadata và Content
        fileContent += `- **ID::** ${idea.id}\n`;
        fileContent += `- **Score::** ${idea.interactionScore || 0}\n`;
        fileContent += `- **Topic::** ${tags}\n`;
        fileContent += `- **Content:**\n    > ${idea.content.replace(/\n/g, '\n    > ')}\n`;
        
        // [NEW]: Thêm phần bookmark nếu có
        if (idea.isBookmarked && idea.bookmarkReason) {
          fileContent += `- **Bookmark:** *${idea.bookmarkReason}*\n`;
        }
        
        fileContent += `\n^block-${shortId}\n\n---\n\n`;
      }

      // 3. Ghi tệp vật lý
      const fileName = `MindCap_Sync_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.md`;
      const fileHandle = await mindCapFolder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      // 4. [ATOMIC UPDATE]: Sử dụng Transaction để cập nhật trạng thái DB
      // Đảm bảo cập nhật chính xác ID kiểu Number từ JSON
      await db.transaction('rw', db.tasks, db.thoughts, async () => {
        for (const idea of ideas) {
          const table = idea._dbTable === 'tasks' ? db.tasks : db.thoughts;
          await (table as any).update(idea.id, { 
            syncStatus: 'synced', 
            updatedAt: Date.now() 
          });
        }
      });

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Lỗi đồng bộ tri thức:", err);
      throw err;
    }
  }
};