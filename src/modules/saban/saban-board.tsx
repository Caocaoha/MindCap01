import React, { useEffect, useState } from 'react';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { streakEngine } from './streak-engine';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [MOD_SABAN]: Bảng điều khiển chiến thuật
 * Hiển thị luồng công việc (Task Chain) và quản lý trạng thái tập trung.
 */
export const SabanBoard: React.FC = () => {
  const [activeFlows, setActiveFlows] = useState<ITask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ITask[]>([]);

  const loadSabanData = async () => {
    const allTasks = await db.tasks.toArray();

    // 1. Xử lý Logic Task Chain cho các tác vụ chưa xong
    const activeRaw = allTasks.filter(t => t.status !== 'done');
    
    const chainedActive = activeRaw.filter(task => {
      const gid = streakEngine.getTagValue(task, 'group');
      if (!gid) return true; // Không có group thì luôn hiện

      const groupMembers = activeRaw.filter(t => streakEngine.getTagValue(t, 'group') === gid);
      const orders = groupMembers.map(t => parseInt(streakEngine.getTagValue(t, 'order') || '999'));
      const minOrder = Math.min(...orders);
      
      return parseInt(streakEngine.getTagValue(task, 'order') || '999') === minOrder;
    });

    // 2. Lấy các tác vụ đã xong và sắp xếp theo thời gian hoàn thành (mới nhất lên đầu của nhóm Done)
    const doneTasks = allTasks
      .filter(t => t.status === 'done')
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    setActiveFlows(chainedActive.sort((a, b) => b.createdAt - a.createdAt));
    setCompletedTasks(doneTasks);
  };

  useEffect(() => {
    loadSabanData();
  }, []);

  // Chuyển đổi trạng thái Focus (Tối đa 4)
  const toggleFocus = async (task: ITask) => {
    if (task.status === 'done') return;

    const currentFocusCount = await db.tasks.where('isFocusMode').equals(1).count();
    
    if (!task.isFocusMode && currentFocusCount >= 4) {
      triggerHaptic('warning');
      alert("Focus Mode đã đầy (Tối đa 4). Hãy hoàn thành bớt!");
      return;
    }

    await db.tasks.update(task.id!, { 
      isFocusMode: !task.isFocusMode,
      updatedAt: Date.now() 
    });
    
    triggerHaptic('light');
    loadSabanData();
  };

  // Đánh dấu hoàn thành thủ công tại Saban
  const quickComplete = async (task: ITask) => {
    if (!task.id) return;
    triggerHaptic('success');
    
    await db.tasks.update(task.id, {
      status: 'done',
      isFocusMode: false,
      updatedAt: Date.now()
    });
    
    loadSabanData();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter italic">SABAN.</h1>
        <p className="text-[10px] opacity-40 uppercase tracking-[0.3em] mt-1">Tactical Backlog & Flow</p>
      </header>

      {/* DANH SÁCH ĐANG THỰC THI (ACTIVE) */}
      <section className="space-y-3 mb-12">
        <h2 className="text-xs font-bold opacity-30 uppercase mb-4">Active Flows</h2>
        {activeFlows.map(task => (
          <div 
            key={task.id} 
            className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
              task.isFocusMode 
              ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
              : 'bg-zinc-900 border-white/5'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1" onClick={() => toggleFocus(task)}>
                <div className="flex gap-2 mb-2">
                  {task.isFocusMode && (
                    <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      FOCUS
                    </span>
                  )}
                  {task.tags?.map(tag => (
                    <span key={tag} className="text-[9px] text-zinc-500 font-mono">#{tag}</span>
                  ))}
                </div>
                <h3 className="text-lg font-bold leading-tight group-active:scale-95 transition-transform">
                  {task.content}
                </h3>
              </div>
              
              <button 
                onClick={() => quickComplete(task)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* DANH SÁCH ĐÃ XONG (COMPLETED) */}
      {completedTasks.length > 0 && (
        <section className="space-y-2 opacity-60">
          <h2 className="text-xs font-bold opacity-30 uppercase mb-4">Completed</h2>
          {completedTasks.map(task => (
            <div key={task.id} className="p-4 bg-transparent border border-zinc-800 border-dashed rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium line-through text-zinc-500 italic">
                {task.content}
              </span>
              <span className="text-[9px] font-mono opacity-30">
                {new Date(task.updatedAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* EMPTY STATE */}
      {activeFlows.length === 0 && completedTasks.length === 0 && (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl">
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No tasks found</p>
        </div>
      )}
    </div>
  );
};