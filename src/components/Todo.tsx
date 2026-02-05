import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trash2, AlertCircle, Clock, Flame, Star, Check, Archive } from 'lucide-react';
import { db, type Entry, type Priority, addLog } from '../utils/db'; // Đảm bảo db.ts đã có addLog
import { getDateString } from '../utils/date';

const Todo: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<Entry[]>([]);
  const [completedToday, setCompletedToday] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH DATA ---
  const fetchTasks = async () => {
    const todayStr = getDateString();
    
    // 1. Kho việc: Việc chưa xong + Chưa vào tiêu điểm
    const active = await db.entries
      .where({ is_task: 1, status: 'active', is_focus: 0 })
      .reverse() // Dexie sort mặc định tăng dần, reverse để lấy cái mới nhất (nếu sort theo ID hoặc created_at)
      .sortBy('created_at'); // Sắp xếp theo thời gian tạo: Mới nhất lên đầu

    // 2. Việc đã xong: Chỉ lấy việc xong trong ngày hôm nay
    const completed = await db.entries
      .where({ is_task: 1, status: 'completed', date_str: todayStr })
      .toArray();

    setActiveTasks(active);
    setCompletedToday(completed);
  };

  useEffect(() => {
    fetchTasks();
    // Có thể thêm interval hoặc listener để auto-refresh nếu cần thiết
  }, []);

  // --- ACTIONS ---

  // 1. Logic Thăng cấp vào Tiêu điểm (Mind)
  const promoteToFocus = async (task: Entry) => {
    // Kiểm tra số lượng Tiêu điểm hiện tại
    const currentFocusCount = await db.entries
      .where({ is_focus: 1, status: 'active' })
      .count();

    // Ràng buộc Max 4
    if (currentFocusCount >= 4) {
      // Đẩy task lên đầu danh sách Todo (cập nhật created_at mới nhất)
      await db.entries.update(task.id!, { created_at: Date.now() });
      
      setError("Tâm trí đã đầy (4/4). Hãy giải quyết việc cũ trước!");
      setTimeout(() => setError(null), 3000);
      
      fetchTasks();
      return;
    }

    // Hợp lệ: Chuyển vào Tiêu điểm
    await db.entries.update(task.id!, { 
      is_focus: true,
      lifecycle_logs: addLog(task.lifecycle_logs, 'focus_enter') // Ghi log hành trình
    });
    fetchTasks();
  };

  // 2. Logic Hủy việc (Archive)
  const archiveTask = async (task: Entry) => {
    await db.entries.update(task.id!, { 
      status: 'archived',
      lifecycle_logs: addLog(task.lifecycle_logs, 'archived') // Ghi log hủy
    });
    fetchTasks();
  };

  // Helper render icon theo độ ưu tiên
  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'hỏa-tốc': return <Flame size={18} className="text-red-500 fill-red-100" />;
      case 'important': return <Star size={18} className="text-yellow-500 fill-yellow-100" />;
      case 'urgent': return <Clock size={18} className="text-orange-500" />;
      default: return <Check size={18} className="text-blue-500" />;
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-6 sticky top-0 bg-slate-50 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">KHO TRÍ NHỚ</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Memory Bank</p>
          </div>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">
            {activeTasks.length} ĐANG CHỜ
          </span>
        </header>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-lg"
            >
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === DANH SÁCH CHƯA XONG (ACTIVE) === */}
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {activeTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className={`relative group bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all border-l-[6px] ${
                  task.priority === 'hỏa-tốc' ? 'border-red-500' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Priority Badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {getPriorityIcon(task.priority)}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        task.priority === 'hỏa-tốc' ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    {/* Content */}
                    <p className="text-slate-700 font-medium leading-relaxed text-base">
                      {task.content}
                    </p>
                  </div>
                  
                  {/* Actions Column */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button 
                      onClick={() => promoteToFocus(task)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                      title="Đưa vào Tiêu điểm (Mind)"
                    >
                      <Target size={20} />
                    </button>
                    <button 
                      onClick={() => archiveTask(task)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                      title="Hủy bỏ (Lưu trữ)"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* === DANH SÁCH ĐÃ XONG TRONG NGÀY === */}
        {completedToday.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">
              Hoàn thành hôm nay ({completedToday.length})
            </h3>
            <div className="flex flex-col gap-3">
              {completedToday.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-slate-50/50 p-4 rounded-[1.5rem] flex items-center gap-4 border border-slate-100 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <p className="text-slate-500 line-through text-sm font-medium flex-1">{task.content}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-6 italic">
              "Các việc này sẽ được lưu kho vào lúc nửa đêm"
            </p>
          </div>
        )}

        {/* Empty State */}
        {activeTasks.length === 0 && completedToday.length === 0 && (
          <div className="py-24 text-center">
            <Archive size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-300 italic text-lg">"Kho trí nhớ sạch sẽ."</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Todo;