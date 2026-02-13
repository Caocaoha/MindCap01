import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { TaskCard } from './ui/task-card';
import { triggerHaptic } from '../../utils/haptic';

export const SabanBoard: React.FC = () => {
  // 1. BẢO TỒN 100% BỘ LỌC VÀ SEARCH
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'once' | 'repeat'>('all');
  const [search, setSearch] = useState('');

  // 2. PHƯƠNG ÁN 3: COLLECTION-BASED FILTERING
  const tasks = useLiveQuery(async () => {
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // Lọc thủ công trên Collection để tránh lỗi IndexableType của Boolean
    const allSabanTasks = await db.tasks
      .toCollection()
      .filter(task => task.isFocusMode === false) 
      .toArray();

    return allSabanTasks.filter(t => {
      // Logic Search
      const matchSearch = t.content.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      // Logic hiển thị: Task chưa xong HOẶC Task đã xong trong hôm nay
      const isDoneToday = t.status === 'done' && (t.updatedAt || 0) >= todayStart;
      const isTodo = t.status !== 'done';
      if (!isTodo && !isDoneToday) return false;

      // Logic các nút lọc On/Off
      if (filter === 'all') return true;
      if (filter === 'urgent') return t.tags?.includes('p:urgent');
      if (filter === 'important') return t.tags?.includes('p:important');
      if (filter === 'once') return t.tags?.includes('freq:once');
      if (filter === 'repeat') return t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');
      
      return true;
    }).sort((a, b) => {
      // Sắp xếp: Todo lên đầu, Done xuống cuối
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [filter, search]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="space-y-4 px-1">
        {/* NÚT LỌC CHIẾN THUẬT */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'urgent', 'important', 'once', 'repeat'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { triggerHaptic('light'); setFilter(f); }}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                filter === f 
                  ? 'bg-blue-500 border-blue-500 text-black shadow-lg shadow-blue-500/20' 
                  : 'border-white/5 opacity-30 text-white'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'urgent' ? 'Khẩn cấp' : f === 'important' ? 'Quan trọng' : f === 'once' ? 'Một lần' : 'Lặp lại'}
            </button>
          ))}
        </div>

        {/* THANH TÌM KIẾM */}
        <input 
          type="text" 
          placeholder="Tìm kiếm kế hoạch..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-white/20 transition-all"
        />
      </header>

      {/* DANH SÁCH SA BÀN */}
      <main className="flex-1 overflow-y-auto space-y-3 pb-24 custom-scrollbar">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks?.length === 0 && (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
            <span className="text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</span>
          </div>
        )}
      </main>
    </div>
  );
};