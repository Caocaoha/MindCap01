import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, Send, X, CheckCircle2, Zap } from 'lucide-react';
import { db, type Entry, addLog } from '../utils/db';
import { getDateString } from '../utils/date';

const THRESHOLD = 60;

const Mind: React.FC = () => {
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- MOTION VALUES ---
  const taskDragX = useMotionValue(0);
  const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0);
  const moodDragY = useMotionValue(0);

  // --- TRANSFORMS ---
  // X-RAIL (Task)
  const scaleTL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleTR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  const scaleBL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleBR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  
  // T-RAIL (Save)
  const scaleLeft = useTransform(moodDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleUp = useTransform(moodDragY, [-THRESHOLD, 0], [1.5, 1]);
  const scaleDown = useTransform(moodDragY, [0, THRESHOLD], [1, 1.5]);

  // --- DATA FETCHING ---
  const fetchFocusTasks = async () => {
    const tasks = await db.entries.where({ is_focus: 1, status: 'active' }).toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => {
    fetchFocusTasks();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsInputMode(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputMode]);

  // --- HANDLERS ---
  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim()) return;

    const initialLogs = [{ action: 'created', timestamp: Date.now() }];
    const entryData: any = {
      content,
      created_at: Date.now(),
      date_str: getDateString(),
      status: 'active',
      is_focus: false,
      lifecycle_logs: initialLogs,
    };

    if (type === 'task') {
      entryData.is_task = true;
      entryData.mood = 'neutral';
      if (direction === 'TL') entryData.priority = 'normal';
      if (direction === 'TR') entryData.priority = 'important';
      if (direction === 'BL') entryData.priority = 'urgent';
      if (direction === 'BR') entryData.priority = 'hỏa-tốc';
    } else {
      entryData.is_task = false;
      entryData.priority = 'normal';
      if (direction === 'L') entryData.mood = 'neutral';
      if (direction === 'U') entryData.mood = 'positive';
      if (direction === 'D') entryData.mood = 'negative';
    }

    await db.entries.add(entryData);
    
    // Reset UI
    setContent('');
    setIsInputMode(false);
    setActiveRail('none');
    taskDragX.set(0); taskDragY.set(0);
    moodDragX.set(0); moodDragY.set(0);
  };

  const completeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { 
      status: 'completed', is_focus: false, completed_at: Date.now(),
      lifecycle_logs: addLog(task.lifecycle_logs, 'completed')
    });
    fetchFocusTasks();
  };

  const removeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { 
      is_focus: false, lifecycle_logs: addLog(task.lifecycle_logs, 'focus_exit_manual')
    });
    fetchFocusTasks();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-4 h-full">
        
        {/* === INPUT SECTION === */}
        <section className={`relative transition-all duration-500 z-50 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          
          <h2 className={`text-xl font-bold text-slate-800 mb-4 transition-opacity duration-300 ${isInputMode ? 'opacity-100' : 'opacity-60'}`}>
            {activeRail === 'task' ? "Ưu tiên việc này thế nào?" : activeRail === 'mood' ? "Cảm xúc của bạn?" : "Điều gì đang diễn ra?"}
          </h2>
          
          {/* 1. TEXTAREA CONTAINER (SẠCH SẼ) */}
          <div className="relative w-full"> 
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Gõ phím bất kỳ..."
              // Min-height vừa phải, padding chuẩn, không bị độn đáy
              className={`w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none 
                transition-all duration-300 shadow-xl
                ${isInputMode ? 'shadow-2xl ring-4 ring-blue-50' : ''}
                ${activeRail !== 'none' ? 'opacity-40 blur-[1px]' : 'opacity-100'} 
              `} 
              onFocus={() => setIsInputMode(true)}
              onBlur={() => content.length === 0 && setIsInputMode(false)}
            />
          </div>

          {/* 2. CONTROL DECK (BẢNG ĐIỀU KHIỂN RIÊNG BIỆT BÊN DƯỚI) */}
          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                animate={{ opacity: 1, height: 80, marginTop: 16 }} 
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="relative w-full flex items-center justify-center"
              >
                
                {/* --- A. TASK BUTTON: CENTER --- */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-16 h-16">
                  {/* X-Rail Visuals */}
                  <AnimatePresence>
                    {activeRail === 'task' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"
                      >
                        <div className="absolute inset-0 border border-blue-200 rounded-full rotate-45" />
                        <div className="absolute inset-0 border border-blue-200 rounded-full -rotate-45" />
                        
                        <motion.div style={{ scale: scaleTL }} className="absolute -top-2 -left-2 bg-white p-2 rounded-full shadow text-blue-500"><Check size={20}/></motion.div>
                        <motion.div style={{ scale: scaleTR }} className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow text-yellow-500"><Star size={20}/></motion.div>
                        <motion.div style={{ scale: scaleBL }} className="absolute -bottom-2 -left-2 bg-white p-2 rounded-full shadow text-orange-500"><Clock size={20}/></motion.div>
                        <motion.div style={{ scale: scaleBR }} className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow text-red-600"><Flame size={20}/></motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Draggable Task Button */}
                  <motion.div
                    drag
                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    dragElastic={0.6}
                    style={{ x: taskDragX, y: taskDragY }}
                    onDragStart={() => setActiveRail('task')}
                    onDragEnd={(_, info) => {
                      const { x, y } = info.offset;
                      if (x < -THRESHOLD && y < -THRESHOLD) handleSave('task', 'TL');
                      else if (x > THRESHOLD && y < -THRESHOLD) handleSave('task', 'TR');
                      else if (x < -THRESHOLD && y > THRESHOLD) handleSave('task', 'BL');
                      else if (x > THRESHOLD && y > THRESHOLD) handleSave('task', 'BR');
                      else setActiveRail('none');
                    }}
                    animate={{ 
                      opacity: activeRail === 'mood' ? 0.2 : 1, 
                      scale: activeRail === 'task' ? 1.1 : 1
                    }}
                    className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing border-2 border-white z-30"
                  >
                    <span className="font-black text-[10px] uppercase tracking-wider">TASK</span>
                  </motion.div>
                </div>

                {/* --- B. SAVE BUTTON: RIGHT --- */}
                <div className="absolute right-0 z-20 flex items-center justify-center w-16 h-16">
                  {/* T-Rail Visuals */}
                  <AnimatePresence>
                    {activeRail === 'mood' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"
                      >
                        <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-200 -translate-x-1/2 rounded-full" />
                        
                        <motion.div style={{ scale: scaleLeft }} className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white p-2 rounded-full shadow text-slate-500">😐</motion.div>
                        <motion.div style={{ scale: scaleUp }} className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-green-500">😃</motion.div>
                        <motion.div style={{ scale: scaleDown }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-rose-500">😔</motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Draggable Save Button */}
                  <motion.div
                    drag
                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    dragElastic={0.6}
                    style={{ x: moodDragX, y: moodDragY }}
                    onDragStart={() => setActiveRail('mood')}
                    onDragEnd={(_, info) => {
                      const { x, y } = info.offset;
                      if (x < -THRESHOLD) handleSave('mood', 'L');
                      else if (y < -THRESHOLD) handleSave('mood', 'U');
                      else if (y > THRESHOLD) handleSave('mood', 'D');
                      else setActiveRail('none');
                    }}
                    animate={{ 
                      opacity: activeRail === 'task' ? 0.2 : 1, 
                      scale: activeRail === 'mood' ? 1.1 : 1
                    }}
                    className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 shadow-lg cursor-grab active:cursor-grabbing border-2 border-white hover:bg-blue-50 hover:text-blue-600 z-30"
                  >
                    <Send size={20} className="ml-0.5" />
                  </motion.div>
                </div>
                
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* === FOCUS LIST === */}
        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm flex items-center gap-2">
              <Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)
            </h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {focusTasks.map(task => (
                <motion.div 
                  key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative p-6 rounded-[2rem] bg-white shadow-lg border-l-8 ${
                    task.priority === 'hỏa-tốc' ? 'border-red-500' : 
                    task.priority === 'urgent' ? 'border-orange-500' :
                    task.priority === 'important' ? 'border-yellow-400' : 'border-blue-400'
                  }`}
                >
                  <p className="text-slate-800 font-medium text-lg mb-4">{task.content}</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => removeFocusTask(task)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-xs font-bold hover:bg-slate-100"><X size={16}/> GỠ BỎ</button>
                    <button onClick={() => completeFocusTask(task)} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold hover:bg-green-100"><CheckCircle2 size={16}/> HOÀN THÀNH</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Mind;