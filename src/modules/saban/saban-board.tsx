import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { TaskCard } from './ui/task-card';
import { triggerHaptic } from '../../utils/haptic';

export const SabanBoard: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'once' | 'repeat'>('all');
  const [search, setSearch] = useState('');

  // 1. Logic Lọc dữ liệu theo thời gian thực]
  const tasks = useLiveQuery(async () => {
    // Chỉ lấy task chưa vào Focus]
    let query = db.tasks.where('isFocusMode').equals(0); 

    const result = await query.toArray();
    
    return result.filter(t => {
      const matchSearch = t.content.toLowerCase().includes(search.toLowerCase());
      if (filter === 'all') return matchSearch;
      if (filter === 'urgent') return matchSearch && t.tags?.includes('p:urgent');
      if (filter === 'important') return matchSearch && t.tags?.includes('p:important');
      if (filter === 'once') return matchSearch && t.tags?.includes('freq:once');
      if (filter === 'repeat') return matchSearch && t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');
      return matchSearch;
    }).sort((a, b) => (a.status === 'done' ? 1 : -1)); // Đẩy việc đã xong xuống cuối]
  }, [filter, search]);

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      <header className="space-y-4">
        {/* Hàng nút On/Off Filter */}
        <div className="flex flex-wrap gap-2 px-1">
          {['all', 'urgent', 'important', 'once', 'repeat'].map((f) => (
            <button
              key={f}
              onClick={() => { triggerHaptic('light'); setFilter(f as any); }}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                filter === f ? 'bg-blue-500 border-blue-500 text-black shadow-lg shadow-blue-500/20' : 'border-white/5 opacity-30 text-white'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'urgent' ? 'Khẩn cấp' : f === 'important' ? 'Quan trọng' : f === 'once' ? 'Một lần' : 'Lặp lại'}
            </button>
          ))}
        </div>

        {/* Thanh tìm kiếm */}
        <div className="px-1">
          <input 
            type="text"
            placeholder="Tìm kiếm nhiệm vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
      </header>

      {/* Danh sách Task */}
      <main className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pb-24">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </main>
    </div>
  );
};