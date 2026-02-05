import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trash2, AlertCircle, Clock, Flame, Star, Check, Archive, Zap, Scale, Repeat, Pencil, Waves, CloudSun, History as HistoryIcon, X, CheckCircle2 } from 'lucide-react';
import { db, type Entry, type Priority, addLog, getTriggerEchoes } from '../utils/db'; 
import { getDateString } from '../utils/date';

const Todo: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<Entry[]>([]);
  const [completedToday, setCompletedToday] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý "Tiếng vang" (Echoes) từ ký ức
  const [echoes, setEchoes] = useState<{taskID: number, items: Entry[]} | null>(null);

  const fetchTasks = async () => {
    try {
      const todayStr = getDateString();
      const all = await db.entries.toArray();
      
      // Lọc các Task đang hoạt động (không nằm trong Tiêu điểm)
      const active = all.filter(t => t.is_task && t.status === 'active' && !t.is_focus)
                        .sort((a, b) => b.created_at - a.created_at);
      
      // Lọc các Task đã xong hôm nay
      const completed = all.filter(t => t.is_task && t.status === 'completed' && t.date_str === todayStr);
      
      setActiveTasks(active);
      setCompletedToday(completed);
    } catch (err) {
      setError("Không thể kết nối Sa bàn");
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const triggerHaptic = (type: 'success' | 'error' | 'click' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(15);
      else if (type === 'impact') navigator.vibrate(40);
      else navigator.vibrate(5);
    }
  };

  // --- LOGIC TIẾNG VANG (TRIGGER POINT) ---
  const showEchoes = async (task: Entry) => {
    if (!task.id) return;
    // Nếu đang mở đúng task đó thì đóng lại
    if (echoes && echoes.taskID === task.id) { 
      setEchoes(null); 
      return; 
    }
    
    const results = await getTriggerEchoes(task.content);
    setEchoes({ taskID: task.id, items: results });
    triggerHaptic('click');
  };

  // --- LOGIC VUỐT CHÉO (DIAGONAL SWIPE TO FOCUS) ---
  const handleDiagonalDrag = async (task: Entry, info: any) => {
    const { x, y } = info.offset;
    // Ngưỡng: Vuốt sang phải (>60px) và lên trên (<-60px)
    if (x > 60 && y < -60) {
      const currentFocus = await db.entries.filter(e => e.is_focus && e.status === 'active').count();
      if (currentFocus >= 4) {
        setError("Chiến trường Tiêu điểm đã đầy (4/4)!");
        setTimeout(() => setError(null), 2000);
        return;
      }
      
      await db.entries.update(task.id!, { 
        is_focus: true, 
        lifecycle_logs: addLog(task.lifecycle_logs, 'diagonal_promote') 
      });
      
      triggerHaptic('impact');
      fetchTasks();
    }
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

  // --- LOGIC CẢNH BÁO THỊ GIÁC THEO CHU KỲ ---
  const getFreqBadgeStyle = (task: Entry) => {
    if (task.frequency === 'once') return 'bg-slate-100 text-slate-400';
    
    const day = new Date().getDay(); // 0: CN, 1: T2...
    const progress = task.progress || 0;

    // Cảnh báo đỏ: Weekly mà đến cuối tuần vẫn 0 tiến độ
    if (task.frequency === 'weekly' && progress === 0 && (day === 5 || day === 6 || day === 0)) {
        return 'bg-red-100 text-red-600 animate-pulse';
    }
    // Cảnh báo cam: Weekly chưa có tiến độ khi đã qua nửa tuần
    if (task.frequency === 'weekly' && progress === 0 && day >= 3) {
        return 'bg-orange-100 text-orange-600';
    }
    return 'bg-blue-50 text-blue-600';
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'hỏa-tốc': return <Flame size={16} className="text-red-500 fill-red-100" />;
      case 'important': return <Star size={16} className="text-yellow-500 fill-yellow-100" />;
      case 'urgent': return <Clock size={16} className="text-orange-500" />;
      default: return <Check size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 pb-24 font-sans bg-slate-50">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        <header className="flex justify-between items-center py-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Target className="text-blue-600" /> SA BÀN CHIẾN TRẬN
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                Điều động quân lực & Ngữ cảnh
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded">V5.6</span>
            <span className="text-[10px] font-bold text-slate-300 mt-1">{activeTasks.length} ĐƠN VỊ ĐANG CHỜ</span>
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-600 text-white p-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
                <AlertCircle size={14}/> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode='popLayout'>
            {activeTasks.map((task) => (
              <motion.div 
                key={task.id} 
                layout
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => handleDiagonalDrag(task, info)}
                className="relative bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group touch-none"
              >
                <div className="p-5">
                    {/* Header: Badge & Tiếng vang */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 items-center">
                            {getPriorityIcon(task.priority)}
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${getFreqBadgeStyle(task)}`}>
                                {task.frequency === 'once' ? 'Một lần' : task.frequency}
                                {task.frequency_detail && ` • ${task.frequency_detail}`}
                            </span>
                        </div>
                        <button 
                          onClick={() => showEchoes(task)} 
                          className={`p-2 rounded-xl transition-all ${echoes && echoes.taskID === task.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-50'}`}
                        >
                            <Waves size={16}/>
                        </button>
                    </div>

                    {/* Content & Progress Bar */}
                    <div className="mb-4">
                        <h4 className="text-slate-800 font-bold text-base leading-tight mb-3">{task.content}</h4>
                        {task.quantity > 1 && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Hành trình</span>
                                    <span className="text-blue-600 font-black">{task.progress} / {task.quantity} {task.unit}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(task.progress / task.quantity) * 100}%` }}
                                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Echoes Overlay (Tiếng vang ký ức) */}
                    <AnimatePresence>
                        {echoes && echoes.taskID === task.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }} 
                              className="mb-4 bg-slate-50 rounded-2xl p-4 border-l-4 border-blue-400 overflow-hidden"
                            >
                                <p className="text-[9px] font-black text-blue-500 uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                                    <HistoryIcon size={12}/> Động lực từ ký ức
                                </p>
                                <div className="space-y-3">
                                    {echoes.items.length > 0 ? echoes.items.map(e => (
                                        <div key={e.id} className="text-[11px] text-slate-500 italic leading-relaxed border-b border-slate-200/50 pb-2 last:border-0">
                                            "{e.content}"
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-slate-300 italic">Chưa tìm thấy tiếng vang liên quan...</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Action */}
                    <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">
                             Vuốt chéo để xuất quân ↗
                        </span>
                        <button onClick={() => archiveTask(task)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Danh sách hoàn thành trong ngày */}
        {completedToday.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 size={14}/> Chiến tích hôm nay ({completedToday.length})
            </h3>
            <div className="space-y-2">
                {completedToday.map(t => (
                    <div key={t.id} className="bg-white/40 p-3 rounded-2xl flex items-center gap-3 border border-slate-100 opacity-60">
                        <Check size={14} className="text-green-500"/>
                        <span className="text-xs text-slate-500 line-through font-medium">{t.content}</span>
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