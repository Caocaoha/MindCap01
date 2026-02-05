import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, Send, X, CheckCircle2, Zap, AlertCircle, PartyPopper } from 'lucide-react';
import { db, type Entry } from '../utils/db';
import { getDateString } from '../utils/date';

const THRESHOLD = 60;

const Mind: React.FC = () => {
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- MOTION SETUP ---
  const taskDragX = useMotionValue(0);
  const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0);
  const moodDragY = useMotionValue(0);

  const scaleTL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleTR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  const scaleBL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleBR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  const scaleLeft = useTransform(moodDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleUp = useTransform(moodDragY, [-THRESHOLD, 0], [1.5, 1]);
  const scaleDown = useTransform(moodDragY, [0, THRESHOLD], [1, 1.5]);

  // Haptic Feedback
  const triggerHaptic = (type: 'success' | 'error' | 'click') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(15);
      else if (type === 'error') navigator.vibrate([50, 30, 50]);
      else if (type === 'click') navigator.vibrate(5);
    }
  };

  const fetchFocusTasks = async () => {
    try {
      // Lấy danh sách tiêu điểm (Boolean chuẩn)
      const tasks = await db.entries
        .filter(e => e.is_focus === true && e.status === 'active')
        .toArray();
      setFocusTasks(tasks);
    } catch (e) { console.error("Lỗi lấy Tiêu điểm:", e); }
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

  // --- HÀM LƯU DỮ LIỆU (CÓ ALERT DEBUG) ---
  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim() || isSaving) return;

    setIsSaving(true);
    setActiveRail('none');

    try {
      // 1. Tạo Object dữ liệu chuẩn
      const newEntry: Entry = {
        content: content,
        created_at: Date.now(),
        date_str: getDateString(),
        status: 'active',
        lifecycle_logs: [{ action: 'created', timestamp: Date.now() }],
        
        // Gán cứng True/False (Tránh undefined)
        is_task: type === 'task', 
        is_focus: false, 
        
        // Giá trị mặc định
        priority: 'normal',
        mood: 'neutral'
      };

      // 2. Gán chi tiết theo hướng kéo
      if (type === 'task') {
        if (direction === 'TL') newEntry.priority = 'normal';
        if (direction === 'TR') newEntry.priority = 'important';
        if (direction === 'BL') newEntry.priority = 'urgent';
        if (direction === 'BR') newEntry.priority = 'hỏa-tốc';
      } else {
        if (direction === 'L') newEntry.mood = 'neutral';
        if (direction === 'U') newEntry.mood = 'positive';
        if (direction === 'D') newEntry.mood = 'negative';
      }

      console.log("MIND: Đang lưu...", newEntry);

      // 3. Ghi vào DB
      const savedId = await db.entries.add(newEntry);

      if (savedId) {
        triggerHaptic('success');
        const destination = type === 'task' ? 'Kho trí nhớ' : 'Nhật ký';
        
        setToast({ message: `Đã lưu vào ${destination} (ID: #${savedId})`, type: 'success' });
        setTimeout(() => setToast(null), 3000);

        setContent('');
        setIsInputMode(false);
      }
    } catch (error: any) {
      console.error("MIND Error:", error);
      triggerHaptic('error');
      
      // === DEBUG: BẬT CỬA SỔ LỖI TRÊN ĐIỆN THOẠI ===
      alert("LỖI LƯU DB: " + (error.message || JSON.stringify(error))); 
      // ===========================================

      setToast({ message: "Lỗi lưu trữ!", type: 'error' });
    } finally {
      setIsSaving(false);
      taskDragX.set(0); taskDragY.set(0);
      moodDragX.set(0); moodDragY.set(0);
    }
  };

  const completeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { status: 'completed', is_focus: false, completed_at: Date.now() });
    triggerHaptic('success');
    fetchFocusTasks();
  };

  const removeFocusTask = async (task: Entry) => {
    if (!task.id) return;
    await db.entries.update(task.id, { is_focus: false });
    fetchFocusTasks();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-4 h-full relative">
        
        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-white whitespace-nowrap ${toast.type === 'success' ? 'bg-green-600' : 'bg-rose-600'}`}>
              {toast.type === 'success' ? <PartyPopper size={18}/> : <AlertCircle size={18}/>}
              <span className="text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INPUT SECTION */}
        <section className={`relative transition-all duration-500 z-50 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 opacity-100">
            {activeRail === 'task' ? "Ghi vào Kho trí nhớ?" : activeRail === 'mood' ? "Ghi vào Nhật ký?" : "Điều gì đang diễn ra?"}
          </h2>
          <div className="relative w-full"> 
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Gõ phím bất kỳ..." disabled={isSaving} className={`w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none transition-all duration-300 shadow-xl ${isInputMode ? 'shadow-2xl ring-4 ring-blue-50' : ''} ${activeRail !== 'none' || isSaving ? 'opacity-40 blur-[1px]' : 'opacity-100'} `} onFocus={() => setIsInputMode(true)} onBlur={() => content.length === 0 && !isSaving && setIsInputMode(false)}/>
          </div>

          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 80 }} exit={{ opacity: 0, height: 0 }} className="relative w-full flex items-center justify-center mt-4">
                {/* TASK BUTTON */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-16 h-16">
                  <AnimatePresence>{activeRail === 'task' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"><div className="absolute inset-0 border border-blue-200 rounded-full rotate-45" /><div className="absolute inset-0 border border-blue-200 rounded-full -rotate-45" /><motion.div style={{ scale: scaleTL }} className="absolute -top-2 -left-2 bg-white p-2 rounded-full shadow text-blue-500"><Check size={20}/></motion.div><motion.div style={{ scale: scaleTR }} className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow text-yellow-500"><Star size={20}/></motion.div><motion.div style={{ scale: scaleBL }} className="absolute -bottom-2 -left-2 bg-white p-2 rounded-full shadow text-orange-500"><Clock size={20}/></motion.div><motion.div style={{ scale: scaleBR }} className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow text-red-600"><Flame size={20}/></motion.div></motion.div>)}</AnimatePresence>
                  <motion.div drag={!isSaving} dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} dragElastic={0.6} onDragStart={() => { setActiveRail('task'); triggerHaptic('click'); }} onDragEnd={(_, info) => { const { x, y } = info.offset; if (x < -THRESHOLD && y < -THRESHOLD) handleSave('task', 'TL'); else if (x > THRESHOLD && y < -THRESHOLD) handleSave('task', 'TR'); else if (x < -THRESHOLD && y > THRESHOLD) handleSave('task', 'BL'); else if (x > THRESHOLD && y > THRESHOLD) handleSave('task', 'BR'); else setActiveRail('none'); }} style={{ x: taskDragX, y: taskDragY }} animate={{ opacity: activeRail === 'mood' || isSaving ? 0.2 : 1, scale: activeRail === 'task' ? 1.1 : 1 }} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white z-30 cursor-grab active:cursor-grabbing"><span className="font-black text-[10px]">TASK</span></motion.div>
                </div>
                {/* MOOD BUTTON */}
                <div className="absolute right-0 z-20 flex items-center justify-center w-16 h-16">
                  <AnimatePresence>{activeRail === 'mood' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"><div className="absolute top-1/2 left-0 right-1/2 h-1 bg-slate-200 -translate-y-1/2 rounded-full" /><div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-200 -translate-x-1/2 rounded-full" /><motion.div style={{ scale: scaleLeft }} className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white p-2 rounded-full shadow text-slate-500 text-xl">😐</motion.div><motion.div style={{ scale: scaleUp }} className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-green-500 text-xl">😃</motion.div><motion.div style={{ scale: scaleDown }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-rose-500 text-xl">😔</motion.div></motion.div>)}</AnimatePresence>
                  <motion.div drag={!isSaving} dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} dragElastic={0.6} onDragStart={() => { setActiveRail('mood'); triggerHaptic('click'); }} onDragEnd={(_, info) => { const { x, y } = info.offset; if (x < -THRESHOLD) handleSave('mood', 'L'); else if (y < -THRESHOLD) handleSave('mood', 'U'); else if (y > THRESHOLD) handleSave('mood', 'D'); else setActiveRail('none'); }} style={{ x: moodDragX, y: moodDragY }} animate={{ opacity: activeRail === 'task' || isSaving ? 0.2 : 1, scale: activeRail === 'mood' ? 1.1 : 1 }} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-lg border-2 border-slate-100 z-30 cursor-grab active:cursor-grabbing"><Send size={20} className="ml-0.5" /></motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* FOCUS LIST SECTION */}
        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)</h3>
          </div>
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {focusTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative p-5 rounded-[2rem] bg-white shadow-md border-l-4 ${task.priority === 'hỏa-tốc' ? 'border-red-500' : task.priority === 'urgent' ? 'border-orange-500' : task.priority === 'important' ? 'border-yellow-400' : 'border-blue-400'}`}>
                  <p className="text-slate-800 font-medium text-base mb-3 leading-snug">{task.content}</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => removeFocusTask(task)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                    <button onClick={() => completeFocusTask(task)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold hover:bg-green-100 transition-colors shadow-sm"><CheckCircle2 size={14}/> XONG</button>
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