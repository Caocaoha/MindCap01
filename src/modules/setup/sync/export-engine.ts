/**
 * Purpose: Truy vấn và đóng gói dữ liệu sẵn sàng xuất sang Obsidian.
 * Inputs/Outputs: N/A -> { ideas: ExtendedIdea[] }.
 * Business Rule: 
 * - Chỉ lấy các bản ghi có syncStatus là 'ready_to_export'.
 * - [CRITICAL]: Truy xuất kèm theo trường sourceTable từ Database.
 */

import { db } from '../../../database/db';

export const generateExportPackage = async () => {
  const [readyTasks, readyThoughts] = await Promise.all([
    db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
    db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
  ]);

  // Đảm bảo mỗi bản ghi khi xuất ra luôn mang theo hộ chiếu sourceTable
  const ideas = [
    ...readyTasks.map(t => ({ ...t, sourceTable: t.sourceTable || 'tasks' })),
    ...readyThoughts.map(t => ({ ...t, sourceTable: t.sourceTable || 'thoughts' }))
  ];

  return {
    version: "1.0",
    timestamp: Date.now(),
    ideas
  };
};