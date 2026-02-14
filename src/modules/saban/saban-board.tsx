import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { TaskCard } from './ui/task-card';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [MOD_SABAN]: Quản lý backlog chiến lược.
 * Giai đoạn 3: Cập nhật thẩm mỹ Linear.app (Slate/Zinc monochrome).
 */
export const SabanBoard: React.FC = () => {
  // 1. BẢO TỒN 100% BỘ LỌC VÀ SEARCH (Cơ sở logic từ Heartbeat v3.6)
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'once' | 'repeat'>('all');
  const [search, setSearch] = useState('');

  // 2. PHƯƠNG ÁN 3: COLLECTION-BASED FILTERING (Bảo tồn logic Dexie)
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
    /* CONTAINER: Nền trắng tuyệt đối */
    <div className="flex flex-col h-full space-y-6 bg-white">
      <header className="space-y-4 px-1">
        
        {/* NÚT LỌC CHIẾN THUẬT: Bo góc 6px, Border mảnh Slate-200 */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'urgent', 'important', 'once', 'repeat'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { triggerHaptic('light'); setFilter(f); }}
              className={`px-4 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border transition-all ${
                filter === f 
                  /* Active: Màu xanh đậm #2563EB chuẩn Linear */
                  ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                  /* Inactive: Slate style */
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'urgent' ? 'Khẩn cấp' : f === 'important' ? 'Quan trọng' : f === 'once' ? 'Một lần' : 'Lặp lại'}
            </button>
          ))}
        </div>

        {/* THANH TÌM KIẾM: Flat style, Border slate-200, bo góc 6px */}
        <input 
          type="text" 
          placeholder="Tìm kiếm kế hoạch..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-[6px] py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#2563EB] transition-all"
        />
      </header>

      {/* DANH SÁCH SA BÀN: Cuộn mượt với whitespace lớn */}
      <main className="flex-1 overflow-y-auto space-y-2 pb-24 custom-scrollbar">
        {tasks?.map(task => (
          /* TaskCard sẽ được cập nhật đồng bộ sang phong cách Linear ở bước tiếp theo */
          <TaskCard key={task.id} task={task} />
        ))}
        
        {/* EMPTY STATE: Monochrome Slate style */}
        {tasks?.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              Không có dữ liệu kế hoạch
            </span>
          </div>
        )}
      </main>
    </div>
  );
};