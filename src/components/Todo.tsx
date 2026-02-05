import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trash2, AlertCircle, Clock, Flame, Star, Check, Archive, Zap } from 'lucide-react';
import { db, type Entry, type Priority, addLog } from '../utils/db'; 
import { getDateString } from '../utils/date';

const Todo: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<Entry[]>([]);
  const [completedToday, setCompletedToday] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const triggerHaptic = (type: 'success' | 'error' | 'click') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(15); 
      else if (type === 'error') navigator.vibrate([50, 30, 50]); 
      else if (type === 'click') navigator.vibrate(5);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log("TODO: Bắt đầu tải dữ liệu...");
      const todayStr = getDateString();
      
      // 1. Lấy toàn bộ DB để debug (Phòng trường hợp lọc sai)
      const allEntries = await db.entries.toArray();
      console.log("TODO DEBUG: Tổng số bản ghi trong DB:", allEntries.length);

      // 2. Lọc danh sách Active
      const active = allEntries
        .filter(task => 
          task.is_task === true &&     // Chỉ lấy Task (Boolean)
          task.status === 'active' && 
          task.is_focus !== true       // Không phải là Tiêu điểm (chấp nhận false hoặc undefined cho an toàn)
        )
        .sort((a, b) => b.created_at - a.created_at);

      console.log("TODO: Số task active tìm thấy:", active.length);

      // 3. Lọc danh sách Đã xong
      const completed = allEntries
        .filter(task => 
          task.is_task === true &&
          task.status === 'completed' && 
          task.date_str === todayStr
        );
      
      setActiveTasks(active);
      setCompletedToday(completed);
      setError(null);
    } catch (err) {
      console.error("TODO Error:", err);
      setError("Không thể tải danh sách");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- ACTIONS ---
  const promoteToFocus = async (task: Entry) => {
    triggerHaptic('click');
    try {
      const currentFocusCount = await db.entries
        .filter(e => e.is_focus === true && e.status === 'active')
        .count();

      if (currentFocusCount >= 4) {
        triggerHaptic('error'); 
        if (task.id) await db.entries.update(task.id, { created_at: Date.now() });
        setError("Tâm trí đã đầy (4/4)!");
        setTimeout(() => setError(null), 3000);
        fetchTasks();
        return;
      }

      if (task.id) {
        await db.entries.update(task.id, { 
          is_focus: true, 
          lifecycle_logs: addLog(task.lifecycle_logs, 'focus_enter') 
        });
        triggerHaptic('success'); 
        fetchTasks();
      }
    } catch (err) { setError("Lỗi cập nhật"); }
  };

  const archiveTask = async (task: Entry) => {
    if (task.id) {
      await db.entries.update(task.id, { 
        status: 'archived',
        lifecycle_logs: addLog(task.lifecycle_logs, 'archived') 
      });
      triggerHaptic('click');
      fetchTasks();
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'hỏa-tốc': return <Flame size={18} className="text-red-500 fill-red-100" />;
      case 'important': return <Star size={18} className="text-yellow-500 fill-yellow-100" />;
      case 'urgent': return <Clock size={18} className="text-orange-500" />;
      default: return <Check size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex justify-between items-center py-6 sticky top-0 bg-slate-50 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Target className="text-blue-600" /> KHO TRÍ NHỚ
            </h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1 ml-1">Todo List</p>
          </div>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">{activeTasks.length} ĐANG CHỜ</span>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-lg">
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {activeTasks.length > 0 ? activeTasks.map((task) => (
              <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -100 }} className={`relative group bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all border-l-[6px] ${task.priority === 'hỏa-tốc' ? 'border-red-500' : task.priority === 'urgent' ? 'border-orange-500' : task.priority === 'important' ? 'border-yellow-400' : 'border-blue-400'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      {getPriorityIcon(task.priority)}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${task.priority === 'hỏa-tốc' ? 'text-red-500' : 'text-slate-400'}`}>{task.priority}</span>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed text-base">{task.content}</p>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={() => promoteToFocus(task)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"><Zap size={20} /></button>
                    <button onClick={() => archiveTask(task)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><Trash2 size={18} /></button>
                  </div>
                </div>
              </motion.div>
            )) : (
              !error && <div className="py-24 text-center"><Archive size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-300 italic text-lg">"Kho trí nhớ sạch sẽ."</p></div>
            )}
          </AnimatePresence>
        </div>

        {completedToday.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Hoàn thành hôm nay ({completedToday.length})</h3>
            <div className="flex flex-col gap-3">
              {completedToday.map((task) => (
                <div key={task.id} className="bg-slate-50/50 p-4 rounded-[1.5rem] flex items-center gap-4 border border-slate-100 opacity-70">
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600"><Check size={14} strokeWidth={3} /></div>
                  <p className="text-slate-500 line-through text-sm font-medium flex-1">{task.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Todo;