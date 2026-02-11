// src/modules/journey/components/ReflectiveMirror.tsx
import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../store/userStore';
import { getLast7DaysStats, DailyStat } from '../logic/statsEngine';

export const ReflectiveMirror: React.FC = () => {
  const user = useUserStore();
  const [stats, setStats] = useState<DailyStat[]>([]);

  useEffect(() => {
    getLast7DaysStats().then(setStats);
  }, []);

  const maxTasks = Math.max(...stats.map(s => s.completed), 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. USER PROFILE CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Current Identity</div>
            <div className="text-2xl font-black text-slate-800">{user.archetype || 'NEWBIE'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600">Level {user.level}</div>
          </div>
        </div>
        {/* XP BAR */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${(user.currentCME % 100)}%` }} 
          />
        </div>
      </div>

      {/* 2. DUAL AXIS CHART (SVG) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-6">Performance (7 Days)</h3>
        <div className="relative h-40 w-full flex items-end justify-between gap-2">
          {/* Trục Y giả lập */}
          <div className="absolute -left-2 top-0 bottom-0 border-l border-slate-100" />
          
          {stats.map((s, i) => (
            <div key={i} className="relative flex-1 flex flex-col items-center group">
              {/* Bar (Completed) */}
              <div 
                className="w-full bg-blue-100 rounded-t-sm transition-all duration-500 relative"
                style={{ height: `${(s.completed / maxTasks) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-slate-800 text-white px-1 rounded">
                  {s.completed}
                </div>
              </div>
              {/* Dot (Rate Line) */}
              <div 
                className="absolute w-2 h-2 bg-blue-600 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-700"
                style={{ bottom: `${s.rate}%` }}
              />
              <span className="text-[10px] text-slate-400 mt-2">{s.date.split('-')[2]}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span className="w-3 h-3 bg-blue-100 rounded-sm" /> Tasks
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span className="w-2 h-2 bg-blue-600 rounded-full" /> Rate %
          </div>
        </div>
      </div>
    </div>
  );
};