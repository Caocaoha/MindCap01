/**
 * Purpose: Điều phối logic duyệt ý tưởng và quản lý trạng thái đồng bộ.
 * Inputs/Outputs: items, loading, handleApprove, handleIgnore, refresh.
 * Business Rule: 
 * - Lọc bản ghi 'pending' để duyệt.
 * - [MỎ NEO]: Lưu vĩnh viễn sourceTable vào DB khi người dùng nhấn Sync.
 * - Đồng bộ readyCount lên Global Store để hiển thị tại tab Sync.
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
      const [pTasks, pThoughts, rTasks, rThoughts] = await Promise.all([
        db.tasks.where('syncStatus').equals('pending').toArray(),
        db.thoughts.where('syncStatus').equals('pending').toArray(),
        db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
        db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
      ]);
      
      setReadyCount(rTasks.length + rThoughts.length);
      
      setItems([
        ...pTasks.map(t => ({ ...t, sourceTable: 'tasks' })), 
        ...pThoughts.map(t => ({ ...t, sourceTable: 'thoughts' }))
      ]);
    } catch (err) {
      console.error("Refresh Error:", err);
    } finally {
      setLoading(false);
    }
  }, [setReadyCount]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    // [FIX]: Ghi đè vĩnh viễn sourceTable để không bị mất dấu khi Bridge/Export
    await (db as any)[table].update(id, { 
      syncStatus: 'ready_to_export', 
      sourceTable: table, 
      updatedAt: Date.now() 
    });
    refresh();
  };

  const handleIgnore = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { 
      syncStatus: 'ignored', 
      sourceTable: table,
      updatedAt: Date.now() 
    });
    refresh();
  };

  return { items, loading, handleApprove, handleIgnore, refresh };
};