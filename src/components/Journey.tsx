import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Flame, TrendingUp } from 'lucide-react';
import { db } from '../utils/db';

const Journey: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, completed: 0, rate: 0 });

  useEffect(() => {
    db.entries.toArray().then(all => {
      const tasks = all.filter(e => e.is_task);
      const done = tasks.filter(e => e.status === 'completed' || e.status === 'archived');
      setStats({
        total: tasks.length,
        completed: done.length,
        rate: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
      });
    });
  }, []);

  return (
    <div className="p-6">
      <header className="mb-0">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Activity className="text-blue-600" /> HÀNH TRÌNH
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Định lượng chiến trường</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full border-8 border-blue-50 flex items-center justify-center mb-4">
            <span className="text-2xl font-black text-blue-600">{stats.rate}%</span>
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tỷ lệ hoàn thành</h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
            <CheckCircle className="text-blue-400 mb-2" size={20} />
            <div className="text-2xl font-black">{stats.completed}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Việc đã xong</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <TrendingUp className="text-purple-500 mb-2" size={20} />
            <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Tổng quân số</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Journey;