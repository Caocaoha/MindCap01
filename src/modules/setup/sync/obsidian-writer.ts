/**
 * Purpose: Thực thi ghi dữ liệu tri thức vào Obsidian Vault.
 * Inputs: Danh sách ideas (ITask | IThought).
 * Outputs: Trạng thái thành công/thất bại.
 * Business Rule: 
 * - Đóng gói toàn bộ phiên sync vào một file Markdown duy nhất.
 * - Tự động tạo/truy cập thư mục /MindCap trong Vault.
 * - [FIX]: Xuất interface ExtendedIdea để đồng bộ kiểu dữ liệu với Dashboard.
 */

import { db } from '../../../database/db';

// [FIX]: Thêm export để các file khác có thể sử dụng kiểu dữ liệu này
export interface ExtendedIdea {
  id: string | number;
  content: string;
  createdAt: number;
  interactionScore?: number;
  tags?: string[];
  _dbTable: 'tasks' | 'thoughts';
}

export const obsidianWriter = {
  async writeToVault(ideas: ExtendedIdea[]): Promise<{ success: number; failed: number }> {
    try {
      // 1. Yêu cầu chọn thư mục Vault gốc từ người dùng
      const rootHandle = await (window as any).showDirectoryPicker();
      
      // 2. Truy cập hoặc tạo thư mục 'MindCap' để tránh lẫn dữ liệu
      const mindCapFolder = await rootHandle.getDirectoryHandle('MindCap', { create: true });

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      // 3. Khởi tạo Nội dung File theo Template Single File
      let fileContent = `# 📥 MindCap Export: ${dateStr} | ${timeStr}\n\n`;
      fileContent += `## 📊 Tổng quan phiên (Session Summary)\n`;
      fileContent += `- **Nguồn:** MindCap PWA\n`;
      fileContent += `- **Số lượng bản ghi:** ${ideas.length}\n`;
      fileContent += `- **Trạng thái:** #inbox/processing\n\n---\n\n`;
      fileContent += `## 💡 Danh sách mẩu nhận thức\n\n`;

      for (const idea of ideas) {
        const itemTime = new Date(idea.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const shortId = Math.random().toString(36).substring(2, 8);
        const title = idea.content.split('\n')[0].substring(0, 50);
        
        const tags = (idea.tags || []).map((t: string) => "#" + t).join(' ') || '#uncategorized';

        // 4. Xây dựng Entry Template cho từng mẩu tin
        fileContent += `### 🧩 [${itemTime}] ${title}\n`;
        fileContent += `- **ID::** ${idea.id}\n`;
        fileContent += `- **Score::** ${idea.interactionScore || 0}\n`;
        fileContent += `- **Topic::** ${tags}\n`;
        fileContent += `- **Content:**\n    > ${idea.content.replace(/\n/g, '\n    > ')}\n\n`;
        fileContent += `^block-${shortId}\n\n---\n\n`;
      }

      // 5. Ghi dữ liệu vào một file duy nhất
      const fileName = `MindCap_Sync_${dateStr.replace(/-/g, '')}_${timeStr.replace(/:/g, '')}.md`;
      const fileHandle = await mindCapFolder.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      // 6. Cập nhật trạng thái 'synced' trong Database
      for (const idea of ideas) {
        const table = idea._dbTable === 'tasks' ? db.tasks : db.thoughts;
        const numericId = typeof idea.id === 'string' ? Number(idea.id.replace(/\D/g, '')) : idea.id;
        await (table as any).update(numericId, { syncStatus: 'synced', updatedAt: Date.now() });
      }

      return { success: ideas.length, failed: 0 };
    } catch (err) {
      console.error("Lỗi ghi file Obsidian:", err);
      throw err;
    }
  }
};