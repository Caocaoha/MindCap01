import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '../db';
import { Square, Trash2, RefreshCw } from 'lucide-react';

export const TodoTab = () => {
  const [notification, setNotification] = useState<string | null>(null);

  // 1. LẤY DỮ LIỆU KHO (INBOX)
  // Logic: Active + KHÔNG phải Focus (vì Focus đã nằm bên MindTab rồi)
  const allData = useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    return entries.filter(e => !!e.is_task && e.status !== 'deleted' && e.status !== 'archived');
  }, [], [] as Entry[]);

  // Lọc riêng Inbox để hiển thị
  const inboxList = allData?.filter(t => t.status === 'active' && !t.is_focus).sort((a,b) => b.created_at - a.created_at) || [];
  
  // Đếm số lượng Focus hiện tại (để chặn nếu quá 4)
  const currentFocusCount = allData?.filter(t => t.status === 'active' && !!t.is_focus).length || 0;

  // 2. HANDLER: ĐẨY VIỆC VÀO TÂM TRÍ (FOCUS)
  const handlePromoteToFocus = async (id: string) => {
    if (currentFocusCount >= 4) {
      // Logic: Tâm trí đầy -> Báo lỗi & Đẩy lên đầu kho
      await db.entries.update(id, { created_at: Date.now() });
      setNotification("Tâm trí đang quá tải (4/4). Hãy hoàn thành bớt việc bên tab Tâm trí trước!");
      setTimeout(() => setNotification(null), 3000);
    } else {
      // Logic: Còn chỗ -> Đẩy sang MindTab
      await db.entries.update(id, { is_focus: true });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Xóa vĩnh viễn việc này?")) await db.entries.update(id, { status: 'deleted' });
  };

  return (
    <div className="flex flex-col gap-6 pb-24 h-full">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs py-2 px-4 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 text-center w-max max-w-[90%]">
          {notification}
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Kho việc cần làm ({inboxList.length})
        </h3>

        {inboxList.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <RefreshCw size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Kho đang trống</p>
            <p className="text-slate-400 text-xs mt-1">Hãy sang Tâm trí để thêm việc mới.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {inboxList.map(task => (
              <div key={task.id} className="group flex items-start gap-3 py-3 px-3 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all rounded-lg">
                {/* Nút Check: Chọn làm (Đẩy sang MindTab) */}
                <button 
                  onClick={() => handlePromoteToFocus(task.id)} 
                  className="mt-0.5 text-slate-300 hover:text-blue-600 transition-colors"
                  title="Chọn làm việc này"
                >
                  <Square size={20} />
                </button>
                
                <p className="flex-1 text-sm text-slate-700 leading-relaxed cursor-pointer" onClick={() => handlePromoteToFocus(task.id)}>
                  {task.content}
                </p>

                {/* Nút Xóa */}
                <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Gợi ý nhỏ ở dưới cùng */}
      <div className="text-center text-[10px] text-slate-300 pb-2">
        Mẹo: Chọn ☐ để đưa việc vào Tâm trí
      </div>
    </div>
  );
};