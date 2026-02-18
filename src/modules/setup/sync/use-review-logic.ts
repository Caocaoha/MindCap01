import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';

export const useReviewLogic = () => {
  const [items, setItems] = useState<any[]>([]);
  const { setReadyCount } = useUiStore();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    // [FIX]: Truy vấn đồng thời cả Pending và Ready để khớp số liệu tuyệt đối
    const [pTasks, pThoughts, rTasks, rThoughts] = await Promise.all([
      db.tasks.where('syncStatus').equals('pending').toArray(),
      db.thoughts.where('syncStatus').equals('pending').toArray(),
      db.tasks.where('syncStatus').equals('ready_to_export').toArray(),
      db.thoughts.where('syncStatus').equals('ready_to_export').toArray()
    ]);
    
    // Cập nhật số liệu Sẵn sàng (SyncDashboard dùng biến này)
    setReadyCount(rTasks.length + rThoughts.length);
    
    // Cập nhật danh sách chờ duyệt
    setItems([
      ...pTasks.map(t => ({...t, _dbTable: 'tasks'})), 
      ...pThoughts.map(t => ({...t, _dbTable: 'thoughts'}))
    ]);
    
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