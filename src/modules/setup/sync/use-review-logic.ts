/**
 * Purpose: Quản lý logic duyệt thẻ và đồng bộ bộ đếm UI (v1.8).
 * Inputs/Outputs: items, loading, handleApprove, handleIgnore, refresh.
 * Business Rule: 
 * - Lọc dữ liệu từ Database và đồng bộ trạng thái ready_to_export.
 * - [FIX]: Xuất đầy đủ các hàm xử lý để Component có thể sử dụng.
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';

export const useReviewLogic = () => {
  const [items, setItems] = useState<any[]>([]);
  const { setReadyCount } = useUiStore();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!db.isOpen()) await db.open();

      const [pT, pTh, rT, rTh] = await Promise.all([
        db.tasks.where('syncStatus').equals('pending').toArray(),
        db.thoughts.where('syncStatus').equals('pending').toArray(),
        db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
        db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
      ]);
      
      setReadyCount(rT.length + rTh.length);
      setItems([
        ...pT.map(t => ({...t, sourceTable: t.sourceTable || 'tasks'})), 
        ...pTh.map(t => ({...t, sourceTable: t.sourceTable || 'thoughts'}))
      ]);
    } catch (err) {
      console.error("Lỗi Refresh DB:", err);
    } finally {
      setLoading(false);
    }
  }, [setReadyCount]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { syncStatus: 'ready_to_export', updatedAt: Date.now() });
    refresh();
  };

  const handleIgnore = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { syncStatus: 'ignored', updatedAt: Date.now() });
    refresh();
  };

  // [FIX]: Đảm bảo xuất đầy đủ các thuộc tính để tránh lỗi Property does not exist
  return { items, loading, handleApprove, handleIgnore, refresh };
};