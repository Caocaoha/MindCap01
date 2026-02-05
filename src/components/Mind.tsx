import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, Send, X, CheckCircle2, Zap } from 'lucide-react';
import { db, type Entry, addLog } from '../utils/db';
import { getDateString } from '../utils/date';

const THRESHOLD = 60; // Khoảng cách kéo để kích hoạt (giảm nhẹ cho dễ thao tác)

const Mind: React.FC = () => {
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- MOTION VALUES RIÊNG BIỆT CHO 2 NÚT ---
  const taskDragX = useMotionValue(0);
  const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0);
  const moodDragY = useMotionValue(0);

  // --- TRANSFORMS: PHÓNG ĐẠI ICON (MAGNIFY) ---
  
  // 1. X-RAIL (Cho nút Task)
  const scaleTL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]); // Normal
  const scaleTR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]); // Important
  const scaleBL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]); // Urgent
  const scaleBR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]); // Hỏa tốc (phối hợp Y sau)

  // 2. T-RAIL (Cho nút Lưu/Máy bay) - Logic T: Trái, Lên, Xuống
  const scaleLeft = useTransform(moodDragX, [-THRESHOLD, 0], [1.5, 1]); // Neutral
  const scaleUp = useTransform(moodDragY, [-THRESHOLD, 0], [1.5, 1]);   // Positive
  const scaleDown = useTransform(moodDragY, [0, THRESHOLD], [1, 1.5]);  // Negative

  // --- DATA FETCHING ---
  const fetchFocusTasks = async () => {
    const tasks = await db.entries
      .where({ is_focus: 1, status: 'active' })
      .toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => {
    fetchFocusTasks();

    // Auto-focus Logic: Hỗ trợ bàn phím cứng
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ focus nếu chưa focus, không phải phím chức năng
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsInputMode(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputMode]);

  // --- HANDLERS LƯU DỮ LIỆU ---

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
    taskDragX.set(0);
    taskDragY.set(0);
    moodDragX.set(0);
    moodDragY.set(0);
  };

  // --- HANDLERS FOCUS TASKS ---
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
      is_focus: false,
      lifecycle_logs: addLog(task.lifecycle_logs, 'focus_exit_manual')
    });
    fetchFocusTasks();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-6 h-full">
        
        {/* === PHẦN TRÊN: INPUT & DUAL RAIL SYSTEM === */}
        <section className={`relative transition-all duration-500 z-50 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          
          {/* Header Prompt */}
          <h2 className={`text-xl font-bold text-slate-800 mb-4 transition-opacity duration-300 ${isInputMode ? 'opacity-100' : 'opacity-60'}`}>
            {activeRail === 'task' ? "Ưu tiên việc này thế nào?" : activeRail === 'mood' ? "Cảm xúc của bạn ra sao?" : "Điều gì đang diễn ra?"}
          </h2>
          
          <div className="relative">
            {/* Ô Nhập Liệu */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Gõ phím bất kỳ để bắt đầu..."
              className={`w-full min-h-[140px] p-6 rounded-[2rem] bg-white text-lg resize-none transition-all duration-300 outline-none
                ${isInputMode 
                  ? 'shadow-2xl ring-4 ring-blue-100 border-transparent' 
                  : 'shadow-xl border-transparent opacity-90'}`}
              onFocus={() => setIsInputMode(true)}
              onBlur={() => content.length === 0 && setIsInputMode(false)}
            />

            {/* DUAL CONTROL AREA (TASK & SAVE) */}
            <AnimatePresence>
              {isInputMode && content.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-8 flex justify-between items-center px-8 relative h-40"
                >
                  
                  {/* --- NÚT TRÁI: TASK BUTTON & X-RAIL --- */}
                  <div className="relative flex items-center justify-center w-20 h-20">
                    {/* X-Rail Visualization (Chỉ hiện khi Active) */}
                    <AnimatePresence>
                      {activeRail === 'task' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 w-48 h-48 -top-14 -left-14 pointer-events-none"
                        >
                          <div className="absolute inset-0 border border-blue-200 rounded-full rotate-45" />
                          <div className="absolute inset-0 border border-blue-200 rounded-full -rotate-45" />
                          
                          {/* Icons 4 góc */}
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
                        else setActiveRail('none'); // Reset nếu chưa chọn
                      }}
                      animate={{ 
                        opacity: activeRail === 'mood' ? 0.3 : 1, // Mờ đi nếu đang dùng nút kia
                        scale: activeRail === 'task' ? 1.1 : 1
                      }}
                      className="relative z-10 w-16 h-16 bg-blue-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl cursor-grab active:cursor-grabbing border-4 border-white"
                    >
                      <span className="font-black text-xs uppercase tracking-wider">TASK</span>
                    </motion.div>
                  </div>


                  {/* --- NÚT PHẢI: SAVE BUTTON & T-RAIL --- */}
                  <div className="relative flex items-center justify-center w-20 h-20">
                    {/* T-Rail Visualization (Chỉ hiện khi Active) */}
                    <AnimatePresence>
                      {activeRail === 'mood' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 w-48 h-48 -top-14 -left-14 pointer-events-none"
                        >
                          {/* T-Shape Lines */}
                          <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
                          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-200 -translate-x-1/2 rounded-full" />
                          
                          {/* Icons 3 hướng */}
                          <motion.div style={{ scale: scaleLeft }} className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white p-2 rounded-full shadow text-slate-500">😐</motion.div>
                          <motion.div style={{ scale: scaleUp }} className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-green-500">😃</motion.div>
                          <motion.div style={{ scale: scaleDown }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-rose-500">😔</motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Draggable Save Button (Paper Plane) */}
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
                        opacity: activeRail === 'task' ? 0.3 : 1, // Mờ đi nếu đang dùng nút kia
                        scale: activeRail === 'mood' ? 1.1 : 1
                      }}
                      className="relative z-10 w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-slate-700 shadow-xl cursor-grab active:cursor-grabbing border-4 border-slate-50"
                    >
                      <Send size={24} className="ml-1" /> {/* Icon Máy bay giấy */}
                    </motion.div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* === PHẦN DƯỚI: TIÊU ĐIỂM (CONSCIOUSNESS) === */}
        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm flex items-center gap-2">
              <Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)
            </h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {focusTasks.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                <p className="text-slate-400 italic">"Tâm trí đang tĩnh lặng."</p>
                <p className="text-slate-300 text-sm mt-2">Chọn việc từ Kho Trí Nhớ (Todo) để bắt đầu.</p>
              </div>
            ) : (
              <AnimatePresence>
                {focusTasks.map(task => (
                  <motion.div 
                    key={task.id} 
                    layout 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative p-6 rounded-[2rem] bg-white shadow-lg border-l-8 ${
                      task.priority === 'hỏa-tốc' ? 'border-red-500' : 
                      task.priority === 'urgent' ? 'border-orange-500' :
                      task.priority === 'important' ? 'border-yellow-400' : 'border-blue-400'
                    }`}
                  >
                    <p className="text-slate-800 font-medium text-lg mb-4 leading-relaxed">{task.content}</p>
                    
                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => removeFocusTask(task)} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-xs font-bold hover:bg-slate-100 transition-colors"
                      >
                        <X size={16}/> GỠ BỎ
                      </button>
                      <button 
                        onClick={() => completeFocusTask(task)} 
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold hover:bg-green-100 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={16}/> HOÀN THÀNH
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Mind;