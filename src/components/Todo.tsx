import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trash2, AlertCircle, Clock, Flame, Star, Check, Zap, Waves, CheckCircle2 } from 'lucide-react';
import { db, type Entry, type Priority, addLog, getTriggerEchoes, type IdentityProfile } from '../utils/db'; 
import { getDateString } from '../utils/date';

const Todo: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<Entry[]>([]);
  const [completedToday, setCompletedToday] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [echoes, setEchoes] = useState<{taskID: number, items: Entry[]} | null>(null);
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);

  const fetchTasks = async () => {
    try {
      const todayStr = getDateString();
      const all = await db.entries.toArray();
      const active = all.filter(t => t.is_task && t.status === 'active' && !t.is_focus)
                        .sort((a, b) => b.created_at - a.created_at);
      const completed = all.filter(t => t.is_task && t.status === 'completed' && t.date_str === todayStr);
      setActiveTasks(active);
      setCompletedToday(completed);
    } catch (err) { setError("Lỗi kết nối Sa bàn"); }
  };

  useEffect(() => { 
    fetchTasks();
    db.identity_profile.toArray().then(p => { if (p.length) setIdentity(p[p.length - 1]); });
  }, []);

  const handleDiagonalDrag = async (task: Entry, info: any) => {
    const { x, y } = info.offset;
    // Vuốt chéo ↗️ để gán vào Hiện tại (Focus) [cite: 1, 16]
    if (x > 60 && y < -60) {
      const currentFocus = await db.entries.filter(e => e.is_focus && e.status === 'active').count();
      if (currentFocus >= 4) {
        setError("Hiện tại đã đầy (4/4)!");
        setTimeout(() => setError(null), 2000);
        return;
      }
      await db.entries.update(task.id!, { is_focus: true, lifecycle_logs: addLog(task.lifecycle_logs, 'diagonal_promote') });
      if (navigator.vibrate) navigator.vibrate(40);
      fetchTasks();
    }
  };

  return (
    <div className="p-4">
      <header className="py-6 mb-4">
        {/* Nhãn SA BÀN to, đậm, mạnh mẽ */}
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
          <Target className="text-blue-600" /> SA BÀN
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Điều động & Quản trị mục tiêu</p>
        <div className="mt-2 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded inline-block">
          {activeTasks.length} việc cần làm đang chờ
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {/* Card dự án ưu tiên với hiệu ứng Pulsing  */}
        {identity && (
          <motion.div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2"><Target size={12}/> Dự án quan trọng nhất là gì?</h3>
              <p className="text-lg font-bold leading-tight mb-4 italic text-slate-100">"Hành động vì: {identity.core_identities[0]}"</p>
              <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "10%" }} className="h-full bg-blue-500 shadow-[0_0_10px_currentColor]" />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-4">
          <AnimatePresence mode='popLayout'>
            {activeTasks.map((task) => (
              <motion.div key={task.id} layout drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} onDragEnd={(_, info) => handleDiagonalDrag(task, info)} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 group touch-none">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-slate-50 text-slate-400">{task.frequency}</span>
                  <button onClick={async () => { const r = await getTriggerEchoes(task.content); setEchoes({taskID: task.id!, items: r}); }} className="text-slate-200 hover:text-blue-400"><Waves size={16}/></button>
                </div>
                <h4 className="text-slate-800 font-bold mb-3">{task.content}</h4>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-center">
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Vuốt chéo ↗ để đưa vào Hiện tại</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
export default Todo;