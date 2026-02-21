/**
 * Purpose: Truy vấn và đóng gói dữ liệu sẵn sàng xuất sang Obsidian (v2.0).
 * Inputs/Outputs: N/A -> { ideas: ExtendedIdea[] }.
 * Business Rule: 
 * - Chỉ lấy các bản ghi có syncStatus là 'ready_to_export'.
 * - [CRITICAL]: Truy xuất kèm theo trường sourceTable từ Database.
 * - [UPGRADE]: Đồng nhất thời gian (Timezone Agnostic) sang chuẩn ISO 8601 cho toàn bộ gói xuất.
 */

import { db } from '../../../database/db';

export const generateExportPackage = async () => {
  const [readyTasks, readyThoughts] = await Promise.all([
    db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
    db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
  ]);

  /**
   * Hàm hỗ trợ chuẩn hóa thời gian sang ISO 8601 UTC.
   * Đảm bảo file xuất ra luôn mang định dạng chuỗi chuẩn, 
   * giúp các thiết bị khác khi nhập vào không bị sai lệch múi giờ.
   */
  const normalizeToISO = (val: string | number | undefined) => {
    if (!val) return new Date().toISOString();
    return new Date(val).toISOString();
  };

  // Đảm bảo mỗi bản ghi khi xuất ra luôn mang theo hộ chiếu sourceTable và thời gian chuẩn ISO
  const ideas = [
    ...readyTasks.map(t => ({ 
      ...t, 
      sourceTable: t.sourceTable || 'tasks',
      createdAt: normalizeToISO(t.createdAt),
      updatedAt: normalizeToISO(t.updatedAt)
    })),
    ...readyThoughts.map(t => ({ 
      ...t, 
      sourceTable: t.sourceTable || 'thoughts',
      createdAt: normalizeToISO(t.createdAt),
      updatedAt: normalizeToISO(t.updatedAt)
    }))
  ];

  return {
    version: "2.0", // Nâng cấp phiên bản gói dữ liệu để đánh dấu bước ngoặt ISO 8601
    timestamp: new Date().toISOString(), // Mốc thời gian đóng gói chuẩn UTC (ISO String)
    ideas
  };
};