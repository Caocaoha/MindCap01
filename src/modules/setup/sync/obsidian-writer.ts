import { db } from '../../../database/db';
import { MindCapIdea } from './types';
import { markdownTransformer } from './markdown-transformer';

export const obsidianWriter = {
  async writeToVault(ideas: MindCapIdea[]): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    try {
      // 1. Yêu cầu chọn thư mục Vault gốc
      const rootHandle = await (window as any).showDirectoryPicker();

      // [NEW LOGIC]: Truy cập hoặc tạo thư mục 'MindCap' để không bị lẫn dữ liệu
      const mindCapFolder = await rootHandle.getDirectoryHandle('MindCap', { create: true });

      for (const idea of ideas) {
        try {
          const fileName = markdownTransformer.generateFileName(idea);
          const content = markdownTransformer.toMarkdown(idea);

          // 2. Ghi file vào thư mục MindCap thay vì Root
          const fileHandle = await mindCapFolder.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();

          // 3. Cập nhật trạng thái
          const table = idea.id.startsWith('task') ? db.tasks : db.thoughts;
          await (table as any).update(Number(idea.id), { 
            syncStatus: 'synced',
            updatedAt: Date.now() 
          });

          successCount++;
        } catch (err) {
          console.error(`Lỗi ghi file ${idea.id}:`, err);
          failedCount++;
        }
      }
    } catch (err) {
      console.error("User cancelled or FS error:", err);
      throw err;
    }

    return { success: successCount, failed: failedCount };
  }
};