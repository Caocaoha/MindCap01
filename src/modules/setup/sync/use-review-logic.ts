/**
 * Purpose: Xử lý logic nghiệp vụ cho chế độ duyệt ý tưởng (Tinder UI).
 * Inputs: Truy vấn dữ liệu từ IndexedDB (tasks & thoughts).
 * Outputs: Danh sách item pending, các hàm xử lý hành động swipe (Right/Left).
 * Business Rule: 
 * - Lọc các bản ghi có syncStatus là 'pending'[cite: 14].
 * - Swipe Right: Cập nhật syncStatus thành 'ready_to_export'[cite: 16].
 * - Swipe Left: Giữ nguyên trạng thái 'pending' để duyệt sau[cite: 17].
 */

import { useState, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';

export const useReviewLogic = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu từ cả hai bảng có trạng thái 'pending'
  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const pendingTasks = await db.tasks
        .where('syncStatus')
        .equals('pending')
        .toArray();
        
      const pendingThoughts = await db.thoughts
        .where('syncStatus')
        .equals('pending')
        .toArray();

      // Gộp và đánh dấu loại để xử lý logic DB sau này
      const combined = [
        ...pendingTasks.map(t => ({ ...t, _dbTable: 'tasks' })),
        ...pendingThoughts.map(t => ({ ...t, _dbTable: 'thoughts' }))
      ].sort((a, b) => b.createdAt - a.createdAt);

      setItems(combined);
    } catch (error) {
      console.error("Failed to fetch pending items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingItems();
  }, []);

  /**
   * Xử lý khi người dùng đồng ý xuất ý tưởng (Swipe Right)
   */
  const handleApprove = async (id: number, table: 'tasks' | 'thoughts') => {
    try {
      await (db as any)[table].update(id, { 
        syncStatus: 'ready_to_export',
        updatedAt: Date.now() 
      });
      setItems(prev => prev.filter(item => item.id !== id));
      triggerHaptic('success');
    } catch (error) {
      console.error("Failed to approve item:", error);
    }
  };

  /**
   * Xử lý khi người dùng bỏ qua ý tưởng (Swipe Left)
   */
  const handleSkip = (id: number) => {
    // Chỉ loại bỏ khỏi stack hiện tại trong phiên làm việc, không cập nhật DB
    setItems(prev => prev.filter(item => item.id !== id));
    triggerHaptic('light');
  };

  return {
    items,
    loading,
    handleApprove,
    handleSkip,
    refresh: fetchPendingItems
  };
};