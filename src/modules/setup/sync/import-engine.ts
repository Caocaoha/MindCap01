import { db } from '../../../database/db';
import type { MindCapSyncPackage, MindCapIdea } from './types';

/**
 * Purpose: Nhập dữ liệu từ file JSON kèm theo logic xử lý xung đột (v2.0).
 * Inputs: MindCapSyncPackage (đã parse từ JSON).
 * Outputs: Cập nhật trạng thái IndexedDB.
 * Business Rule: 
 * - Áp dụng Smart Merge Logic: Ưu tiên bản ghi có updatedAt mới nhất.
 * - Đảm bảo tính toàn vẹn khi ghi đè dữ liệu cũ.
 * [FIX TS2365]: Ép kiểu thời gian về timestamp để so sánh chính xác giữa vế đến và vế tại chỗ.
 * [UPGRADE]: Chuẩn hóa updatedAt về ISO 8601 UTC string khi lưu xuống DB.
 */

export const parseAndMergePackage = async (pkg: MindCapSyncPackage): Promise<void> => {
  for (const idea of pkg.ideas) {
    const table = idea.id.startsWith('task') ? db.tasks : db.thoughts;
    // Tách ID số từ chuỗi định danh (ví dụ: 'task_1' -> 1)
    const numericId = Number(idea.id.replace(/\D/g, ''));
    const existing = await table.get(numericId);

    /**
     * [FIX TS2365]: Đưa cả hai mốc thời gian về dạng Number (Timestamp) để so sánh.
     * incomingUpdateTime: Thời gian của bản ghi trong file nhập vào.
     * localUpdateTime: Thời gian của bản ghi hiện có trong máy.
     */
    const incomingUpdateTime = new Date(idea.metadata.updatedAt).getTime();
    const localUpdateTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

    // Chỉ cập nhật nếu bản ghi mới hơn bản ghi hiện tại hoặc chưa tồn tại
    const shouldUpdate = !existing || incomingUpdateTime > localUpdateTime;

    if (shouldUpdate) {
      /**
       * [UPGRADE]: Khi lưu xuống, cưỡng bức updatedAt về chuẩn ISO 8601.
       * Nếu idea.metadata.updatedAt là số (từ file cũ), new Date().toISOString() sẽ chuẩn hóa nó.
       */
      const normalizedUpdatedAt = new Date(idea.metadata.updatedAt).toISOString();

      await table.put({
        ...(existing || {}),
        content: idea.content,
        syncStatus: idea.syncStatus,
        title: idea.metadata.title,
        obsidianPath: idea.metadata.obsidianPath,
        updatedAt: normalizedUpdatedAt,
        // Giữ lại các trường internal khác của DB nếu đã tồn tại
      } as any);
    }
  }
};