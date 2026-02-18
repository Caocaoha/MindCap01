/**
 * Purpose: Quản lý logic duyệt thẻ và đóng băng nhãn nguồn dữ liệu.
 * Inputs/Outputs: items, loading, handleApprove, handleIgnore.
 * Business Rule: 
 * - [SOURCE ANCHOR]: Ghi đè vĩnh viễn sourceTable vào DB khi Approve/Ignore.
 * - Đảm bảo dữ liệu Bridge không bao giờ mất dấu bảng gốc (tasks/thoughts).
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
      const [pT, pTh, rT, rTh] = await Promise.all([
        db.tasks.where('syncStatus').equals('pending').toArray(),
        db.thoughts.where('syncStatus').equals('pending').toArray(),
        db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
        db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
      ]);
      
      setReadyCount(rT.length + rTh.length);
      setItems([
        ...pT.map(t => ({ ...t, sourceTable: 'tasks' })), 
        ...pTh.map(t => ({ ...t, sourceTable: 'thoughts' }))
      ]);
    } catch (err) { console.error("Refresh Error:", err); }
    finally { setLoading(false); }
  }, [setReadyCount]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    // Ghi đè nhãn nguồn vĩnh viễn để tránh lỗi undefined khi Sync
    await (db as any)[table].update(Number(id), { 
      syncStatus: 'ready_to_export', 
      sourceTable: table,
      updatedAt: Date.now() 
    });
    refresh();
  };

  const handleIgnore = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(Number(id), { 
      syncStatus: 'ignored', 
      sourceTable: table,
      updatedAt: Date.now() 
    });
    refresh();
  };

  return { items, loading, handleApprove, handleIgnore, refresh };
};