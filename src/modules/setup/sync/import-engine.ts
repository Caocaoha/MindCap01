import { db } from '../../../database/db';
import type { MindCapSyncPackage, MindCapIdea } from './types';

/**
 * Purpose: Nhập dữ liệu từ file JSON ekm theo logic xử lý xung đột.
 * Inputs: MindCapSyncPackage (đã parse từ JSON).
 * Outputs: Cập nhật trạng thái IndexedDB.
 * Business Rule: 
 * - Áp dụng Smart Merge Logic: Ưu tiên bản ghi có updatedAt mới nhất.
 * - Đảm bảo tính toàn vẹn khi ghi đè dữ liệu cũ.
 */

export const parseAndMergePackage = async (pkg: MindCapSyncPackage): Promise<void> => {
  for (const idea of pkg.ideas) {
    const table = idea.id.startsWith('task') ? db.tasks : db.thoughts;
    const existing = await table.get(Number(idea.id));

    const shouldUpdate = !existing || (idea.metadata.updatedAt > (existing.updatedAt || 0));

    if (shouldUpdate) {
      await table.put({
        ...(existing || {}),
        content: idea.content,
        syncStatus: idea.syncStatus,
        title: idea.metadata.title,
        obsidianPath: idea.metadata.obsidianPath,
        updatedAt: idea.metadata.updatedAt,
        // Giữ lại các trường internal khác của DB nếu đã tồn tại
      } as any);
    }
  }
};