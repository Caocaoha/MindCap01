// src/hooks/useSabanData.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { startOfDay } from 'date-fns';

export const useSabanData = () => {
  return useLiveQuery(async () => {
    const todayStart = startOfDay(new Date()).getTime();

    // 1. Lấy tất cả Task & Thought chưa hoàn thành + chưa đưa vào Focus
    const pendingItems = await db.table('entities')
      .where('isFocusing').equals(0) // 0 là false trong Dexie index
      .and(item => item.status !== 'completed')
      .toArray();

    // 2. Lấy Task đã hoàn thành của riêng ngày hôm nay
    const completedToday = await db.table('entities')
      .where('status').equals('completed')
      .and(item => item.completedAt >= todayStart)
      .toArray();

    const allItems = [...pendingItems, ...completedToday];

    return {
      doNow: allItems.filter(i => ['critical', 'urgent'].includes(i.priority)),
      plan: allItems.filter(i => i.priority === 'important'),
      later: allItems.filter(i => i.priority === 'normal' || !i.priority),
      thoughts: allItems.filter(i => i.type === 'thought' || i.type === 'mood'),
    };
  }, []);
};