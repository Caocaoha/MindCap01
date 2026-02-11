// src/modules/journey/logic/statsEngine.ts
import { db } from '../../../database/db';

export interface DailyStat {
  date: string;
  completed: number;
  totalFocus: number;
  rate: number;
}

export const getLast7DaysStats = async (): Promise<DailyStat[]> => {
  const stats: DailyStat[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayStr = d.toISOString().split('T')[0];
    const nextDay = d.getTime() + 24 * 60 * 60 * 1000;

    const dayTasks = await db.tasks
      .where('createdAt').between(d.getTime(), nextDay)
      .toArray();

    const completed = dayTasks.filter(t => t.status === 'completed').length;
    // Giả định Focus Tasks là những task có status 'active' hoặc đã 'completed' trong ngày đó
    const totalFocus = dayTasks.filter(t => t.status !== 'todo').length;
    const rate = totalFocus > 0 ? (completed / totalFocus) * 100 : 0;

    stats.push({ date: dayStr, completed, totalFocus, rate });
  }
  return stats;
};  