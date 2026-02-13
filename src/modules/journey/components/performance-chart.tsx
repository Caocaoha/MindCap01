import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';

export const PerformanceChart: React.FC = () => {
  const stats = useLiveQuery(async () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await db.tasks.where('createdAt').above(sevenDaysAgo).toArray();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d.setHours(0,0,0,0)).getTime();
      const end = start + 86400000;

      const dayTasks = tasks.filter(t => t.createdAt >= start && t.createdAt < end);
      const completed = dayTasks.filter(t => t.status === 'done').length;
      const focus = dayTasks.filter(t => t.isFocusMode).length;
      const rate = focus > 0 ? (completed / focus) * 100 : 0;

      return { label: d.toLocaleDateString('vi-VN', { weekday: 'short' }), completed, rate };
    });
  }, []);

  if (!stats) return null;

  return (
    <div className="bg-zinc-900/20 border border-white/5 rounded-[2rem] p-6 mb-6">
      <div className="flex justify-between items-center mb-6 px-2">
        <h4 className="text-[10px] font-black tracking-widest opacity-20 uppercase">Hiệu suất 7 ngày</h4>
        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-tighter opacity-40">
          <span className="text-blue-500">■ Số việc</span>
          <span className="text-orange-400">● Tỷ lệ</span>
        </div>
      </div>

      <div className="relative h-32 w-full">
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          {stats.map((d, i) => {
            const x = i * 15 + 5;
            const barH = (d.completed / 10) * 30; // Giả định max 10 việc/ngày
            const lineY = 35 - (d.rate / 100) * 30;
            return (
              <g key={i}>
                <rect x={x} y={35 - barH} width="6" height={barH} className="fill-blue-500/20 rx-1" />
                <circle cx={x + 3} cy={lineY} r="1" className="fill-orange-400 shadow-glow" />
                <text x={x + 3} y="45" textAnchor="middle" className="fill-white/10 text-[3px] uppercase">{d.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
