import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trash2, AlertCircle, Clock, Flame, Star, Check, Zap, Waves, CloudSun, History as HistoryIcon, CheckCircle2 } from 'lucide-react';
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
    } catch (err) {
      setError("Không thể kết nối Sa bàn");
    }
  };

  useEffect(() => { 
      fetchTasks();
      db.identity_profile.toArray().then(profiles => {
          if (profiles.length > 0) setIdentity(profiles[profiles.length - 1]);
      });
  }, []);

  const triggerHaptic = (type: 'success' | 'impact' | 'click') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(15);
      else if (type === 'impact') navigator.vibrate(40);
      else navigator.vibrate(5);
    }
  };

  const handleDiagonalDrag = async (task: Entry, info: any) => {
    const { x, y } = info.offset;
    if (x > 60 && y < -60) {
      const currentFocus = await db.entries.filter(e => e.is_focus && e.status === 'active').count();
      if (currentFocus >= 4) {
        setError("Hiện tại đã đầy (4/4)!");
        setTimeout(() => setError(null), 2000);
        return;
      }
      await db.entries.update(task.id!, { is_focus: true, lifecycle_logs: addLog(task.lifecycle_logs, 'diagonal_promote') });
      triggerHaptic('impact');
      fetchTasks();
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex justify-between items-center py-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Target className="text-blue-600" /> SA BÀN
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                Điều động & Quản trị mục tiêu
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-right">V7.1</span>
            <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
                {activeTasks.length} việc cần làm đang chờ
            </span>
          </div>
        </header>

        {identity && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />
                <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target size={12}/> Nhiệm vụ cốt lõi
                    </h3>
                    <p className="text-lg font-bold leading-tight mb-4">
                        "Tiến tới căn tính: <span className="text-blue-400">{identity.core_identities[0]}</span>"
                    </p>
                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "10%" }} className="h-full bg-blue-500 shadow-[0_0_10px_currentColor]" /> 
                    </div>
                </div>
            </motion.div>
        )}

        <div className="flex flex-col gap-4">
          {activeTasks.map((task) => (
            <motion.div key={task.id} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} onDragEnd={(_, info) => handleDiagonalDrag(task, info)} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 group touch-none">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-blue-50 text-blue-600">{task.frequency}</span>
                    <button onClick={async () => { const r = await getTriggerEchoes(task.content); setEchoes({taskID: task.id!, items: r}); triggerHaptic('click'); }} className="text-slate-200 hover:text-blue-400"><Waves size={16}/></button>
                </div>
                <h4 className="text-slate-800 font-bold mb-3">{task.content}</h4>
                {task.quantity > 1 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                            <span>Tiến độ</span>
                            <span>{task.progress} / {task.quantity} {task.unit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${(task.progress / task.quantity) * 100}%` }} className="h-full bg-blue-500" />
                        </div>
                    </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-center">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Vuốt chéo ↗ để đưa vào Hiện tại</span>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Todo;