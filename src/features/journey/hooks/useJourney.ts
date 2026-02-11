import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db'; // Giả sử đường dẫn DB của bạn
import { JourneyEntry, JourneyStats } from '../types';
import { calculateEntropy, isFromPast } from '../utils';

export const useJourney = () => {
  // 1. Query Dữ liệu thô từ Dexie
  // Lấy Task đã xong & Thoughts
  const rawTasks = useLiveQuery(() => 
    db.tasks.where('status').equals('done').toArray()
  );
  
  const rawThoughts = useLiveQuery(() => 
    db.thoughts.toArray()
  );

  // 2. The Aggregator & Librarian (Xử lý dữ liệu)
  const { entries, stats } = useMemo(() => {
    if (!rawTasks || !rawThoughts) return { entries: [], stats: null };

    const processedEntries: JourneyEntry[] = [];
    const weeklyMap = new Map<string, { total: number, done: number }>();

    // --- A. TASK PROCESSING ---
    rawTasks.forEach(t => {
      // Chỉ lấy quá khứ (trước 0h hôm nay)
      if (t.completedAt && isFromPast(t.completedAt)) {
        processedEntries.push({
          id: t.id,
          type: 'task',
          content: t.title,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
          projectId: t.projectId, // Giả sử task có projectId
          tags: t.tags || [],
          isBookmarked: t.isBookmarked || false,
          bookmarkReason: t.bookmarkReason,
          opacity: calculateEntropy(t.completedAt, t.isBookmarked),
          relatedIds: [] // Sẽ tính sau
        });
      }
      
      // Tính Stats (Cho 7 ngày qua - logic đơn giản hóa)
      // ... (Phần logic stats chi tiết bạn có thể bổ sung sau)
    });

    // --- B. THOUGHT PROCESSING ---
    rawThoughts.forEach(t => {
      if (isFromPast(t.createdAt)) {
        processedEntries.push({
          id: t.id,
          type: 'thought',
          content: t.content,
          createdAt: t.createdAt,
          tags: t.tags || [],
          isBookmarked: t.isBookmarked || false,
          opacity: calculateEntropy(t.createdAt, t.isBookmarked),
          relatedIds: []
        });
      }
    });

    // --- C. THE LIBRARIAN (INDEXING ECHO) ---
    // Tạo map để tra cứu nhanh
    // Logic: Nếu cùng ProjectID hoặc cùng Tag -> Liên quan
    for (let i = 0; i < processedEntries.length; i++) {
      const entryA = processedEntries[i];
      for (let j = 0; j < processedEntries.length; j++) {
        if (i === j) continue;
        const entryB = processedEntries[j];
        
        const isSameProject = entryA.projectId && entryA.projectId === entryB.projectId;
        const hasCommonTag = entryA.tags.some(tag => entryB.tags.includes(tag));
        
        if (isSameProject || hasCommonTag) {
          entryA.relatedIds.push(entryB.id);
        }
      }
    }

    // Sort by Date DESC
    processedEntries.sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));

    // Fake Stats Data (Để demo UI)
    const mockStats: JourneyStats = {
      level: 5,
      xp: 1250,
      nextLevelXp: 2000,
      title: "Explorer",
      weeklyData: Array.from({ length: 7 }).map((_, i) => ({
        date: `Day ${i+1}`,
        completed: Math.floor(Math.random() * 10),
        rate: Math.floor(Math.random() * 100),
      }))
    };

    return { entries: processedEntries, stats: mockStats };
  }, [rawTasks, rawThoughts]);

  // Actions
  const toggleBookmark = async (id: string, type: 'task' | 'thought') => {
    const table = type === 'task' ? db.tasks : db.thoughts;
    const item = await table.get(id);
    if (item) {
      await table.update(id, { isBookmarked: !item.isBookmarked });
    }
  };

  return {
    entries,
    stats,
    toggleBookmark
  };
};