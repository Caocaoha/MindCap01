/**
 * Purpose: Quản lý logic nghiệp vụ cho việc duyệt ý tưởng đồng bộ Obsidian.
 * Inputs/Outputs: Cung cấp danh sách pending, số lượng ready và các hàm xử lý trạng thái.
 * Business Rule: 
 * - Kết nối với Global UI Store để đồng bộ số lượng readyCount toàn ứng dụng.
 * - Xử lý logic nhị phân: Sync (ready_to_export) hoặc Ignore (ignored).
 * - Tự động cập nhật lại danh sách và bộ đếm sau mỗi hành động.
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';

export const useReviewLogic = () => {
  const [items, setItems] = useState<any[]>([]);
  // [FIX]: Sử dụng readyCount và setReadyCount từ Global Store để tránh lệch số liệu giữa các màn hình
  const { readyCount, setReadyCount } = useUiStore();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Lấy danh sách đang chờ duyệt (Pending)
      const pendingTasks = await db.tasks.where('syncStatus').equals('pending').toArray();
      const pendingThoughts = await db.thoughts.where('syncStatus').equals('pending').toArray();
      
      // 2. Đếm số lượng bản ghi đã được duyệt (Ready to export)
      const rTasks = await db.tasks.where('syncStatus').equals('ready_to_export').count();
      const rThoughts = await db.thoughts.where('syncStatus').equals('ready_to_export').count();
      
      // 3. Cập nhật danh sách hiển thị cục bộ
      setItems([
        ...pendingTasks.map(t => ({...t, _dbTable: 'tasks'})), 
        ...pendingThoughts.map(t => ({...t, _dbTable: 'thoughts'}))
      ]);

      // 4. Cập nhật số lượng sẵn sàng vào Global Store
      setReadyCount(rTasks + rThoughts);
    } catch (err) {
      console.error("Lỗi khi nạp dữ liệu Review:", err);
    } finally {
      setLoading(false);
    }
  }, [setReadyCount]);

  useEffect(() => { 
    refresh(); 
  }, [refresh]);

  /**
   * Chấp nhận ý tưởng: Chuyển sang trạng thái sẵn sàng xuất (Obsidian).
   */
  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { 
      syncStatus: 'ready_to_export', 
      updatedAt: Date.now() 
    });
    refresh();
  };

  /**
   * Loại bỏ ý tưởng: Chuyển sang trạng thái bỏ qua (Vĩnh viễn không Review lại).
   */
  const handleIgnore = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { 
      syncStatus: 'ignored', 
      updatedAt: Date.now() 
    });
    refresh();
  };

  return { items, readyCount, loading, handleApprove, handleIgnore, refresh };
};