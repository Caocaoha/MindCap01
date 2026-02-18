/**
 * Purpose: Quản lý trạng thái duyệt và đồng bộ bộ đếm UI.
 * Inputs/Outputs: Review states and Refresh actions.
 * Business Rule: Đảm bảo số liệu Refresh đồng thời cho mọi trạng thái syncStatus.
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
    const [pT, pTh, rT, rTh] = await Promise.all([
      db.tasks.where('syncStatus').equals('pending').toArray(),
      db.thoughts.where('syncStatus').equals('pending').toArray(),
      db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
      db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
    ]);
    
    setReadyCount(rT.length + rTh.length);
    setItems([...pT.map(t => ({...t, _dbTable: 'tasks'})), 
              ...pTh.map(t => ({...t, _dbTable: 'thoughts'}))]);
    setLoading(false);
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

  return { items, loading, handleApprove, handleIgnore, refresh };
};