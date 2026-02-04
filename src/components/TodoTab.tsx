import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '../db';
import { Square, Trash2, CheckSquare, RefreshCw } from 'lucide-react';

export const TodoTab = () => {
  const [notification, setNotification] = useState<string | null>(null);

  // LẤY DỮ LIỆU TOÀN CẢNH TRONG NGÀY
  const { inboxList, completedTodayList, currentFocusCount } = useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. KHO VIỆC (Inbox): Active + Không phải Focus
    const inbox = entries
      .filter(e => !!e.is_task && e.status === 'active' && !e.is_focus)
      .sort((a, b) => b.created_at - a.created_at); // Mới nhất (hoặc vừa bị trả về) nằm trên cùng

    // 2. ĐÃ XONG HÔM NAY (Completed Today)
    const completed = entries
      .filter(e => 
        e.status === 'completed' && 
        new Date(e.completed_at || 0).toISOString().split('T')[0] === todayStr
      )
      .sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0)); // Mới xong nằm trên

    // Đếm Focus để chặn
    const focusCount = entries.filter(e => e.status === 'active' && !!e.is_focus).length;

    return { inboxList: inbox, completedTodayList: completed, currentFocusCount: focusCount };
  }, [], { inboxList: [], completedTodayList: [], currentFocusCount: 0 });

  // HANDLERS
  const handlePromoteToFocus = async (id: string) => {
    if (currentFocusCount >= 4) {
      // Đầy -> Đẩy lên đầu danh sách nhắc nhở
      await db.entries.update(id, { created_at: Date.now() });
      setNotification("Tâm trí đã đầy (4/4). Hãy hoàn thành bớt việc bên kia trước!");
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Vào Focus -> Biến mất khỏi đây
      await db.entries.update(id, { is_focus: true });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Xóa vĩnh viễn?")) await db.entries.update(id, { status: 'deleted' });
  };

  return (
    <div className="flex flex-col gap-8 pb-24 h-full overflow-y-auto">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs py-2 px-4 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 text-center w-max max-w-[90%]">
          {notification}
        </div>
      )}

      {/* PHẦN 1: KHO VIỆC CẦN LÀM */}
      <section>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 px-1">
          Kho việc cần làm ({inboxList.length})
        </h3>

        {inboxList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <RefreshCw size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">Kho trống. Hãy thêm việc từ Tâm trí.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {inboxList.map(task => (
              <div key={task.id} className="group flex items-start gap-3 py-3 px-3 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all rounded-lg">
                <button 
                  onClick={() => handlePromoteToFocus(task.id)} 
                  className="mt-0.5 text-slate-300 hover:text-blue-600 transition-colors"
                >
                  <Square size={20} />
                </button>
                <p className="flex-1 text-sm text-slate-700 leading-relaxed cursor-pointer select-none" onClick={() => handlePromoteToFocus(task.id)}>
                  {task.content}
                </p>
                <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PHẦN 2: ĐÃ XONG HÔM NAY */}
      {completedTodayList.length > 0 && (
        <section className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
            Đã xong hôm nay
          </h3>
          <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
            {completedTodayList.map(task => (
              <div key={task.id} className="flex items-start gap-3 px-3 py-2">
                <span className="mt-0.5 text-slate-400"><CheckSquare size={18} /></span>
                <p className="text-sm text-slate-400 line-through decoration-slate-300 leading-relaxed">
                  {task.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};