import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';

export const HabitRhythm: React.FC = () => {
  const habits = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    // Lọc theo tag freq: hoặc logic frequency != 'once' nếu có trường dữ liệu
    return tasks.filter(t => t.tags?.some(tag => tag.startsWith('freq:')));
  }, []);

  if (!habits || habits.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black tracking-widest opacity-20 uppercase px-6">Nhịp điệu thói quen</h4>
      <div className="grid grid-cols-1 gap-3 px-4">
        {habits.map(h => {
          const goal = parseInt(h.tags?.find(t => t.startsWith('freq:'))?.split(':')[1] || '1');
          const current = h.status === 'done' ? goal : 0; // Logic tạm thời
          return (
            <div key={h.id} className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-sm text-white/60">{h.content}</span>
              <div className="flex gap-1">
                {Array.from({ length: goal }).map((_, i) => (
                  <div key={i} className={`w-3 h-1 rounded-full ${i < current ? 'bg-blue-500' : 'bg-white/5'}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};