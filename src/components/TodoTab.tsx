import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '../db';
import { 
  CheckCircle2, Circle, ArrowUpRight, Trash2, RefreshCw, CalendarClock 
} from 'lucide-react';

// --- Sub-component: Todo Item (Giữ nguyên, chỉ copy để đảm bảo đủ file) ---
const TodoItem = ({ item, onToggle, onFocus, onDelete }: any) => {
  return (
    <div className="group flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-md -mx-2">
      <button 
        onClick={onToggle}
        className={`mt-0.5 flex-shrink-0 transition-colors ${item.status === 'completed' ? 'text-slate-400' : 'text-slate-300 hover:text-blue-600'}`}
      >
        {item.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed break-words transition-all duration-300 ${item.status === 'completed' ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
          {item.content}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {item.frequency === 'daily' && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              <CalendarClock size={10} /> Daily
            </span>
          )}
          {item.is_focus && (
             <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Focus</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!item.status && !item.is_focus && (
          <button onClick={onFocus} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><ArrowUpRight size={16} /></button>
        )}
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

// --- Main Component (Đã sửa logic Query) ---

export const TodoTab = () => {
  const [notification, setNotification] = useState<string | null>(null);

  // [FIX] CHIẾN THUẬT VÉT CẠN: Lấy hết về rồi lọc (An toàn 100%)
  const todos = useLiveQuery(async () => {
    // 1. Lấy toàn bộ bản ghi trong DB
    const allEntries = await db.entries.toArray();
    
    // 2. Lọc thủ công bằng JS thuần (Tránh lỗi Index của Browser)
    // Dùng !!item.is_task để chấp nhận cả true lẫn 1
    const tasks = allEntries.filter(item => !!item.is_task && item.status !== 'archived');
    
    // 3. Sắp xếp: Mới nhất lên đầu
    return tasks.sort((a, b) => b.created_at - a.created_at);
  }, [], []); 

  // Phân loại danh sách để hiển thị
  const activeTodos = todos?.filter(t => t.status === 'active' && !t.is_focus) || [];
  const focusTodos = todos?.filter(t => t.is_focus && t.status === 'active') || [];
  const completedTodos = todos?.filter(t => t.status === 'completed') || [];

  // --- Handlers ---
  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    db.entries.update(id, { status: newStatus, is_focus: false });
    if (newStatus === 'completed') {
        db.activity_logs.add({ id: crypto.randomUUID(), created_at: Date.now(), action_type: 'TASK_DONE', entry_id: id });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Xóa nhiệm vụ này?")) db.entries.delete(id);
  };

  const handleMoveToFocus = async (entry: Entry) => {
    // Logic đếm cũng dùng vét cạn cho an toàn
    const all = await db.entries.toArray();
    const count = all.filter(e => !!e.is_focus && e.status === 'active').length;

    if (count >= 4) {
      await db.entries.update(entry.id, { created_at: Date.now() });
      setNotification("Tiêu điểm đã đầy (4/4). Đã đẩy lên đầu danh sách!");
      setTimeout(() => setNotification(null), 3000);
    } else {
      await db.entries.update(entry.id, { is_focus: true });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs py-2 px-4 rounded-full shadow-lg animate-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      {focusTodos.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ArrowUpRight size={14} /> Tiêu điểm ({focusTodos.length}/4)
          </h3>
          <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-1">
            {focusTodos.map(task => (
              <TodoItem key={task.id} item={task} 
                onToggle={() => handleToggle(task.id, task.status)}
                onFocus={() => {}} 
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Cần làm ({activeTodos.length})
        </h3>
        <div className="space-y-1">
            {activeTodos.length === 0 && focusTodos.length === 0 && (
                <div className="text-center py-10">
                    <RefreshCw size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm">Mọi thứ đã sạch sẽ.</p>
                </div>
            )}
            {activeTodos.map(task => (
                <TodoItem key={task.id} item={task} 
                    onToggle={() => handleToggle(task.id, task.status)}
                    onFocus={() => handleMoveToFocus(task)}
                    onDelete={() => handleDelete(task.id)}
                />
            ))}
        </div>
      </section>

      {completedTodos.length > 0 && (
        <section className="opacity-60 hover:opacity-100 transition-opacity">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Đã xong hôm nay</h3>
          <div>
            {completedTodos.map(task => (
              <TodoItem key={task.id} item={task} 
                onToggle={() => handleToggle(task.id, task.status)}
                onFocus={() => {}} onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};