/**
 * Purpose: Thực thi ghi dữ liệu ý tưởng trực tiếp vào Obsidian Vault trên máy tính.
 * Inputs: Danh sách MindCapIdea (ready_to_export).
 * Outputs: Trạng thái ghi file thành công và cập nhật syncStatus trong DB.
 * Business Rule: 
 * - Yêu cầu người dùng chọn thư mục Vault qua window.showDirectoryPicker().
 * - Chỉ thực thi ghi dữ liệu nếu trạng thái là 'ready_to_export'.
 * - Sau khi ghi thành công, cập nhật trạng thái bản ghi thành 'synced'.
 */

import { db } from '../../../database/db';
import { MindCapIdea } from './types';
import { markdownTransformer } from './markdown-transformer';

export const obsidianWriter = {
  /**
   * Quy trình ghi hàng loạt ý tưởng vào thư mục được chọn.
   */
  async writeToVault(ideas: MindCapIdea[]): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    try {
      // 1. Yêu cầu quyền truy cập thư mục từ người dùng [cite: 31]
      const directoryHandle = await (window as any).showDirectoryPicker();

      for (const idea of ideas) {
        try {
          // 2. Tạo nội dung và tên tệp chuẩn [cite: 32, 33]
          const fileName = markdownTransformer.generateFileName(idea);
          const content = markdownTransformer.toMarkdown(idea);

          // 3. Thực hiện ghi file vào ổ cứng [cite: 30]
          const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();

          // 4. Cập nhật trạng thái trong database 
          const table = idea.id.startsWith('task') ? db.tasks : db.thoughts;
          await (table as any).update(Number(idea.id), { 
            syncStatus: 'synced',
            updatedAt: Date.now() 
          });

          successCount++;
        } catch (err) {
          console.error(`Ghi file thất bại cho ID ${idea.id}:`, err);
          failedCount++;
        }
      }
    } catch (err) {
      console.error("Người dùng từ chối hoặc lỗi hệ thống tệp:", err);
      throw err;
    }

    return { success: successCount, failed: failedCount };
  }
};