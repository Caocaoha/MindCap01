import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../database/db';

export const useReviewLogic = () => {
  const [items, setItems] = useState<any[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    // 1. Lay danh sach dang cho duyet (Pending)
    const pendingTasks = await db.tasks.where('syncStatus').equals('pending').toArray();
    const pendingThoughts = await db.thoughts.where('syncStatus').equals('pending').toArray();
    
    // 2. Dem so luong da san sang (Ready to export)
    const rTasks = await db.tasks.where('syncStatus').equals('ready_to_export').count();
    const rThoughts = await db.thoughts.where('syncStatus').equals('ready_to_export').count();
    
    setItems([...pendingTasks.map(t => ({...t, _dbTable: 'tasks'})), 
              ...pendingThoughts.map(t => ({...t, _dbTable: 'thoughts'}))]);
    setReadyCount(rTasks + rThoughts);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { syncStatus: 'ready_to_export', updatedAt: Date.now() });
    refresh();
  };

  const handleIgnore = async (id: number, table: 'tasks' | 'thoughts') => {
    await (db as any)[table].update(id, { syncStatus: 'ignored', updatedAt: Date.now() });
    refresh();
  };

  return { items, readyCount, loading, handleApprove, handleIgnore, refresh };
};