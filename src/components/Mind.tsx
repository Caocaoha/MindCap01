import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, MessageSquare, PenTool, X, CheckCircle2 } from 'lucide-react';
import { db, type Entry, addLog } from '../utils/db'; // Đảm bảo db.ts đã có addLog
import { getDateString } from '../utils/date';

const THRESHOLD = 80; // Ngưỡng kéo để kích hoạt lưu

const Mind: React.FC = () => {
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [mode, setMode] = useState<'task' | 'mood'>('task'); // Chuyển đổi giữa Task (X-Rail) và Mood (T-Rail)
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- SETUP ANIMATION VALUES ---
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Hiệu ứng Phóng đại (Magnify) cho các đầu mút
  // X-Rail Transforms
  const scaleTL = useTransform(dragX, [-THRESHOLD, 0], [1.5, 1]); // Chéo Lên-Trái
  const scaleTR = useTransform(dragX, [0, THRESHOLD], [1, 1.5]); // Chéo Lên-Phải
  const scaleBL = useTransform(dragX, [-THRESHOLD, 0], [1.5, 1]); // Chéo Xuống-Trái
  const scaleBR = useTransform(dragX, [0, THRESHOLD], [1, 1.5]); // Chéo Xuống-Phải
  
  // T-Rail Transforms
  const scaleLeft = useTransform(dragX, [-THRESHOLD, 0], [1.5, 1]); // Sang Trái
  const scaleUp = useTransform(dragY, [-THRESHOLD, 0], [1.5, 1]);   // Lên trên
  const scaleDown = useTransform(dragY, [0, THRESHOLD], [1, 1.5]);  // Xuống dưới

  // --- DATA FETCHING ---
  const fetchFocusTasks = async () => {
    // Lấy các task đang nằm trong "Ý thức" (is_focus = true)
    const tasks = await db.entries
      .where({ is_focus: 1, status: 'active' })
      .toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => {
    fetchFocusTasks();

    // Auto-focus logic: Bắt đầu gõ là focus vào ô input
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

  // 1. Lưu mới từ Input (X-Rail / T-Rail) -> Luôn đi vào Kho việc (Todo) trước
  const handleSaveNew = async (direction: string) => {
    if (!content.trim()) return;

    // Tạo log khởi tạo
    const initialLogs = [{ action: 'created', timestamp: Date.now() }];

    const entryData: any = {
      content,
      created_at: Date.now(),
      date_str: getDateString(),
      status: 'active',
      is_focus: false, // Mặc định vào Todo, không vào Focus ngay
      lifecycle_logs: initialLogs,
    };

    if (mode === 'task') {
      entryData.is_task = true;
      entryData.mood = 'neutral';
      // Map hướng kéo X-Rail sang Priority
      if (direction === 'TL') entryData.priority = 'normal';
      if (direction === 'TR') entryData.priority = 'important';
      if (direction === 'BL') entryData.priority = 'urgent';
      if (direction === 'BR') entryData.priority = 'hỏa-tốc';
    } else {
      entryData.is_task = false;
      entryData.priority = 'normal';
      // Map hướng kéo T-Rail sang Mood
      if (direction === 'L') entryData.mood = 'neutral';
      if (direction === 'U') entryData.mood = 'positive';
      if (direction === 'D') entryData.mood = 'negative';
    }

    await db.entries.add(entryData);
    
    // Reset UI
    setContent('');
    setIsInputMode(false);
    dragX.set(0);
    dragY.set(0);
  };

  // 2. Hoàn thành task ngay tại Tiêu điểm
  const completeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { 
      status: 'completed', 
      is_focus: false, // Rời khỏi Ý thức
      completed_at: Date.now(),
      lifecycle_logs: addLog(task.lifecycle_logs, 'completed') // Ghi log hành trình
    });
    fetchFocusTasks();
  };

  // 3. Gỡ bỏ khỏi Tiêu điểm (Trả về Todo)
  const removeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { 
      is_focus: false, // Rời khỏi Ý thức về Kho việc
      lifecycle_logs: addLog(task.lifecycle_logs, 'focus_exit_manual') // Ghi log
    });
    fetchFocusTasks();
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-8 h-full">
        
        {/* === PHẦN TRÊN: INPUT & RAIL SYSTEM === */}
        <section className={`relative transition-all duration-500 z-50 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          {/* Socratic Prompt */}
          <h2 className={`text-xl font-bold text-slate-800 mb-4 transition-opacity duration-300 ${isInputMode ? 'opacity-100' : 'opacity-60'}`}>
            {mode === 'task' ? "Hành động tiếp theo là gì?" : "Điều gì đang diễn ra trong đầu bạn?"}
          </h2>
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chạm phím bất kỳ để bắt đầu..."
              className="w-full min-h-[140px] p-6 rounded-[2rem] bg-white shadow-xl outline-none text-lg resize-none transition-shadow duration-300 focus:shadow-2xl"
              onFocus={() => setIsInputMode(true)}
              onBlur={() => content.length === 0 && setIsInputMode(false)}
            />

            {/* Rails UI Overlay */}
            <AnimatePresence>
              {isInputMode && content.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="mt-6 relative h-64 flex items-center justify-center"
                >
                  {/* Switch Button */}
                  <button 
                    onClick={() => setMode(mode === 'task' ? 'mood' : 'task')} 
                    className="absolute -top-12 right-2 p-3 bg-slate-100 rounded-full text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  >
                    {mode === 'task' ? <MessageSquare size={20}/> : <PenTool size={20}/>}
                  </button>

                  <div className="relative w-48 h-48">
                    {mode === 'task' ? (
                      /* X-RAIL (Tasks) */
                      <>
                        <div className="absolute inset-0 border border-red-200/50 rounded-full rotate-45" />
                        <div className="absolute inset-0 border border-red-200/50 rounded-full -rotate-45" />
                        
                        {/* 4 Directions Icons with Magnify */}
                        <motion.div style={{ scale: scaleTL }} className="absolute -top-4 -left-4 bg-white p-3 rounded-full shadow-lg text-blue-500 border border-blue-100">
                          <Check size={24}/>
                          <span className="absolute top-full left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold mt-1 whitespace-nowrap opacity-0 group-hover:opacity-100">Bình thường</span>
                        </motion.div>
                        <motion.div style={{ scale: scaleTR }} className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg text-yellow-500 border border-yellow-100"><Star size={24}/></motion.div>
                        <motion.div style={{ scale: scaleBL }} className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg text-orange-500 border border-orange-100"><Clock size={24}/></motion.div>
                        <motion.div style={{ scale: scaleBR }} className="absolute -bottom-4 -right-4 bg-white p-3 rounded-full shadow-lg text-red-600 border border-red-100"><Flame size={24}/></motion.div>
                      </>
                    ) : (
                      /* T-RAIL (Moods) */
                      <>
                        <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-blue-200/50 -translate-y-1/2" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-blue-200/50 -translate-x-1/2" />
                        
                        <motion.div style={{ scale: scaleLeft }} className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg text-slate-500 border border-slate-100">😐</motion.div>
                        <motion.div style={{ scale: scaleUp }} className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-3 rounded-full shadow-lg text-green-500 border border-green-100">😃</motion.div>
                        <motion.div style={{ scale: scaleDown }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-3 rounded-full shadow-lg text-rose-400 border border-rose-100">😔</motion.div>
                      </>
                    )}
                  </div>

                  {/* Central Draggable Hub */}
                  <motion.div
                    drag
                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    dragElastic={0.6}
                    style={{ x: dragX, y: dragY }}
                    onDragEnd={(_, info) => {
                      const { x, y } = info.offset;
                      if (mode === 'task') {
                        // X-Rail Logic
                        if (x < -THRESHOLD && y < -THRESHOLD) handleSaveNew('TL');
                        else if (x > THRESHOLD && y < -THRESHOLD) handleSaveNew('TR');
                        else if (x < -THRESHOLD && y > THRESHOLD) handleSaveNew('BL');
                        else if (x > THRESHOLD && y > THRESHOLD) handleSaveNew('BR');
                      } else {
                        // T-Rail Logic
                        if (x < -THRESHOLD) handleSaveNew('L');
                        else if (y < -THRESHOLD) handleSaveNew('U');
                        else if (y > THRESHOLD) handleSaveNew('D');
                      }
                    }}
                    className="absolute z-30 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xl cursor-grab active:cursor-grabbing border-4 border-white"
                  >
                    {mode === 'task' ? 'TASK' : 'LƯU'}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* === PHẦN DƯỚI: TIÊU ĐIỂM (CONSCIOUSNESS) === */}
        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-md opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm">Tiêu điểm ({focusTasks.length}/4)</h3>
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