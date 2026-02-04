import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '../db';
import { Square, Trash2, CheckSquare, RefreshCw } from 'lucide-react';

export const TodoTab = () => {
  const [notification, setNotification] = useState<string | null>(null);

  const data = useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    const todayStr = new Date().toISOString().split('T')[0];

    const inbox = entries
      .filter((e: Entry) => !!e.is_task && e.status === 'active' && !e.is_focus)
      .sort((a: Entry, b: Entry) => b.created_at - a.created_at);

    const completed = entries
      .filter((e: Entry) => e.status === 'completed' && new Date(e.completed_at || 0).toISOString().split('T')[0] === todayStr)
      .sort((a: Entry, b: Entry) => (b.completed_at || 0) - (a.completed_at || 0));

    const focusCount = entries.filter((e: Entry) => e.status === 'active' && !!e.is_focus).length;

    return { inboxList: inbox, completedTodayList: completed, currentFocusCount: focusCount };
  }, [], { inboxList: [] as Entry[], completedTodayList: [] as Entry[], currentFocusCount: 0 });

  const handlePromoteToFocus = async (id: string) => {
    if (data.currentFocusCount >= 4) {
      await db.entries.update(id, { created_at: Date.now() });
      setNotification("Tâm trí đầy (4/4). Đã ưu tiên việc này lên đầu!");
      setTimeout(() => setNotification(null), 3000);
    } else {
      await db.entries.update(id, { is_focus: true });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24 h-full overflow-y-auto">
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs py-2 px-4 rounded-full shadow-lg">
          {notification}
        </div>
      )}

      <section>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Kho việc ({data.inboxList.length})</h3>
        <div className="space-y-1">
          {data.inboxList.map((task: Entry) => (
            <div key={task.id} className="group flex items-start gap-3 py-3 px-3 bg-white hover:bg-slate-50 rounded-lg">
              <button onClick={() => handlePromoteToFocus(task.id)} className="mt-0.5 text-slate-300 hover:text-blue-600">
                <Square size={20} />
              </button>
              <div className="flex-1">
                <p className="text-sm text-slate-700 leading-relaxed">{task.content}</p>
                {task.priority && task.priority !== 'normal' && (
                  <span className="text-[9px] font-bold text-orange-500 uppercase">{task.priority}</span>
                )}
              </div>
              <button onClick={async () => { if(confirm("Xóa?")) await db.entries.update(task.id, { status: 'deleted' }); }} 
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      {data.completedTodayList.length > 0 && (
        <section className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Đã xong hôm nay</h3>
          <div className="space-y-2 opacity-60">
            {data.completedTodayList.map((task: Entry) => (
              <div key={task.id} className="flex items-start gap-3 px-3 py-2">
                <CheckSquare size={18} className="text-slate-400" />
                <p className="text-sm text-slate-400 line-through">{task.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};