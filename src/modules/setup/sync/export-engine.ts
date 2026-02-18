import { db } from '../../../database/db';
import type { MindCapSyncPackage, MindCapIdea } from './types';

/**
 * Purpose: Trích xuất và đóng gói dữ liệu sẵn sàng đồng bộ sang Obsidian.
 * Inputs: Truy vấn trực tiếp từ IndexedDB.
 * Outputs: Đối tượng MindCapSyncPackage sẵn sàng để chuyển sang JSON.
 * Business Rule: 
 * - Chỉ lấy các bản ghi có syncStatus là 'ready_to_export'.
 * - Chuyển đổi ITask/IThought sang cấu trúc MindCapIdea tiêu chuẩn.
 */

export const generateExportPackage = async (): Promise<MindCapSyncPackage> => {
  const readyTasks = await db.tasks.where('syncStatus').equals('ready_to_export').toArray();
  const readyThoughts = await db.thoughts.where('syncStatus').equals('ready_to_export').toArray();

  const transformToIdea = (record: any): MindCapIdea => ({
    id: String(record.id),
    content: record.content,
    rawKeywords: record.tags || [],
    interactionScore: record.interactionScore || 0,
    syncStatus: record.syncStatus,
    metadata: {
      title: record.title || '',
      suggestedTags: record.suggestedTags || [],
      obsidianPath: record.obsidianPath || '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt || record.createdAt,
    }
  });

  return {
    version: "1.0",
    exportTimestamp: Date.now(),
    ideas: [...readyTasks, ...readyThoughts].map(transformToIdea),
    tagMappings: [], // Sẽ được bổ sung khi có module Tag Mapping
    appSettings: {}
  };
};