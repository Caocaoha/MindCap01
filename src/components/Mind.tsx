import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, Send, X, CheckCircle2, Zap, Scale, Repeat, Save } from 'lucide-react';
import { db, type Entry, type Mood, type Frequency } from '../utils/db';
import { getDateString } from '../utils/date';
import { parseInputText, type ParseResult } from '../utils/smartParser';

// --- IMPORT UI COMPONENTS MỚI ---
import SmartChip from './ui/SmartChip';
import ActionToast from './ui/ActionToast';
import QuickEditModal from './ui/QuickEditModal';

const THRESHOLD = 50; 
const V_THRESHOLD = 120;

const Mind: React.FC = () => {
  // State cơ bản
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // State cho UX nâng cao
  const [isDraggingTask, setIsDraggingTask] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Entry | null>(null); // Lưu vết để Undo/Edit
  const [prevContent, setPrevContent] = useState(''); // Lưu nội dung cũ để Undo
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Thay thế Toast cũ bằng Action Toast state
  const [toastData, setToastData] = useState<{ message: string; id: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [moodLevel, setMoodLevel] = useState<number>(0);
  const [progressInputs, setProgressInputs] = useState<Record<number, number>>({});

  // Motion
  const taskDragX = useMotionValue(0); const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0); const moodDragY = useMotionValue(0);
  const scaleTL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleTR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  const scaleBL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleBR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);

  const triggerHaptic = (type: 'success' | 'error' | 'click' | 'thump' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(15);
      else if (type === 'error') navigator.vibrate([50, 30, 50]);
      else if (type === 'click') navigator.vibrate(5);
      else if (type === 'thump') navigator.vibrate(10);
      else if (type === 'impact') navigator.vibrate(30);
    }
  };

  // --- KEYBOARD & NLP LOGIC (GIỮ NGUYÊN) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave('mood', 'neutral'); return; }
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { setIsInputMode(true); textareaRef.current?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputMode, content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim().length > 2) {
        const result = parseInputText(content); setParsedData(result);
        if (result.suggestion_label && !result.is_detected) setShowSuggestion(true); else setShowSuggestion(false);
      } else { setParsedData(null); setShowSuggestion(false); }
    }, 300); return () => clearTimeout(timer);
  }, [content]);

  const applySuggestion = () => { if (parsedData?.suggestion_label) { triggerHaptic('success'); setContent(prev => prev + ` ${parsedData.quantity} ${parsedData.unit}`); setShowSuggestion(false); } };
  
  const handleMoodDrag = (_: any, info: any) => {
    const y = info.offset.y; let newLevel = 0;
    if (y < -V_THRESHOLD) newLevel = 2; else if (y < -THRESHOLD) newLevel = 1; else if (y > V_THRESHOLD) newLevel = -2; else if (y > THRESHOLD) newLevel = -1;
    if (newLevel !== moodLevel) { setMoodLevel(newLevel); if (Math.abs(newLevel) === 1) triggerHaptic('thump'); if (Math.abs(newLevel) === 2) triggerHaptic('impact'); }
  };
  const getMoodIcon = () => { switch (moodLevel) { case 2: return '🤩'; case 1: return '😃'; case -1: return '😔'; case -2: return '😫'; default: return '😐'; } };

  const fetchFocusTasks = async () => {
    try {
      const tasks = await db.entries.filter(e => e.is_focus === true && e.status === 'active').toArray();
      setFocusTasks(tasks);
      const inputs: Record<number, number> = {};
      tasks.forEach(t => { if(t.id) inputs[t.id] = t.progress || 0; });
      setProgressInputs(inputs);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { fetchFocusTasks(); }, []);

  // --- SAVE LOGIC NÂNG CẤP (UNDO SUPPORT) ---
  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim() || isSaving) return; 
    setIsSaving(true); 
    setActiveRail('none');
    
    // Lưu lại nội dung cũ để dùng cho tính năng Undo
    setPrevContent(content);

    try {
      let finalQty = 1, finalUnit = 'lần', finalFreq: Frequency = 'once';
      if (parsedData) { finalQty = parsedData.quantity; finalUnit = parsedData.unit; finalFreq = parsedData.frequency; }
      
      let finalMood: Mood = 'neutral'; let finalMoodScore = 0;
      if (type === 'mood') {
        finalMoodScore = moodLevel;
        if (moodLevel === 2) finalMood = 'v-positive'; else if (moodLevel === 1) finalMood = 'positive'; else if (moodLevel === -1) finalMood = 'negative'; else if (moodLevel === -2) finalMood = 'v-negative'; else if (direction === 'U') { finalMood = 'positive'; finalMoodScore = 1; }
      }

      const newEntry: Entry = {
        content: content, created_at: Date.now(), date_str: getDateString(), status: 'active', lifecycle_logs: [{ action: 'created', timestamp: Date.now() }],
        is_task: type === 'task', is_focus: false, priority: 'normal',
        mood: finalMood, mood_score: finalMoodScore, quantity: finalQty, progress: 0, unit: finalUnit, frequency: finalFreq,
        nlp_metadata: { original_text: content, extracted_qty: finalQty, extracted_unit: finalUnit, extracted_freq: finalFreq }
      };

      if (type === 'task') { 
          if (direction === 'TL') newEntry.priority = 'normal'; 
          if (direction === 'TR') newEntry.priority = 'important'; 
          if (direction === 'BL') newEntry.priority = 'urgent'; 
          if (direction === 'BR') newEntry.priority = 'hỏa-tốc'; 
      }

      const id = await db.entries.add(newEntry);
      
      // Lưu thông tin bản ghi vừa tạo vào State
      setLastSavedEntry({ ...newEntry, id: id as number });
      
      triggerHaptic('success');
      
      // Hiện Action Toast thay vì Toast thường
      const msg = type === 'task' 
        ? `Đã lưu: ${content.length > 20 ? content.slice(0,20)+'...' : content} (${finalQty} ${finalUnit})`
        : `Đã lưu cảm xúc: ${getMoodIcon()}`;
      
      setToastData({ message: msg, id: id as number });

      // Reset
      setContent('');
      setParsedData(null);
      setMoodLevel(0);
      setIsInputMode(false);
      fetchFocusTasks();

    } catch (error: any) { console.error(error); triggerHaptic('error'); } 
    finally { 
        setIsSaving(false); setIsDraggingTask(false);
        taskDragX.set(0); taskDragY.set(0); moodDragX.set(0); moodDragY.set(0); 
    }
  };

  // --- LOGIC HOÀN TÁC (UNDO) ---
  const handleUndo = async () => {
    if (!lastSavedEntry?.id) return;
    try {
        await db.entries.delete(lastSavedEntry.id);
        setContent(prevContent); // Trả lại text cũ vào ô nhập
        setIsInputMode(true);
        triggerHaptic('thump');
        setToastData(null); // Tắt Toast
        setLastSavedEntry(null);
        fetchFocusTasks();
    } catch (e) { console.error(e); }
  };

  // --- LOGIC SỬA NHANH (QUICK EDIT) ---
  const handleQuickEditSave = async (updates: Partial<Entry>) => {
    if (!lastSavedEntry?.id) return;
    try {
        await db.entries.update(lastSavedEntry.id, updates);
        triggerHaptic('success');
        setShowEditModal(false);
        setToastData(null);
        fetchFocusTasks();
    } catch (e) { console.error(e); }
  };

  const handleProgress = async (task: Entry, isComplete: boolean) => {
      if (!task.id) return;
      if (isComplete) { await db.entries.update(task.id, { progress: task.quantity, status: 'completed', is_focus: false, completed_at: Date.now() }); } 
      else { await db.entries.update(task.id, { is_focus: false }); }
      triggerHaptic('success'); fetchFocusTasks();
  };

  const saveProgressManual = async (task: Entry) => {
      if(!task.id) return;
      const newVal = progressInputs[task.id] || 0;
      await db.entries.update(task.id, { progress: newVal });
      triggerHaptic('success');
      fetchFocusTasks();
  }

  const onInputChange = (id: number, val: string) => { setProgressInputs(prev => ({ ...prev, [id]: parseInt(val) || 0 })); }

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-4 h-full relative">
        
        {/* SMART CHIP (BAY THEO NGÓN TAY) */}
        <SmartChip x={taskDragX} y={taskDragY} data={parsedData} isDragging={isDraggingTask} />

        {/* ACTION TOAST */}
        <AnimatePresence>
          {toastData && (
            <ActionToast 
                message={toastData.message}
                onUndo={handleUndo}
                onEdit={() => setShowEditModal(true)}
                onClose={() => setToastData(null)}
            />
          )}
        </AnimatePresence>

        {/* QUICK EDIT MODAL */}
        <AnimatePresence>
            {showEditModal && lastSavedEntry && (
                <QuickEditModal 
                    task={lastSavedEntry}
                    onSave={handleQuickEditSave}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </AnimatePresence>

        {/* INPUT SECTION */}
        <section className={`relative transition-all duration-500 z-30 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 opacity-100 flex justify-between items-center">
             <span>{activeRail === 'task' ? "Lưu vào Kho trí nhớ" : activeRail === 'mood' ? "Lưu vào Nhật ký" : "Điều gì đang diễn ra?"}</span>
             {parsedData?.is_detected && activeRail === 'task' && !isDraggingTask && (<motion.span initial={{opacity:0, x: 10}} animate={{opacity:1, x:0}} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Scale size={10}/> {parsedData.quantity} {parsedData.unit} {parsedData.frequency !== 'once' && <span className="flex items-center gap-0.5 ml-1 border-l border-blue-200 pl-1"><Repeat size={10}/> {parsedData.frequency}</span>}</motion.span>)}
          </h2>
          <div className="relative w-full"> 
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Gõ phím bất kỳ (vd: Chạy bộ 5km)..." disabled={isSaving} className={`w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none transition-all duration-300 shadow-xl ${isInputMode ? 'shadow-2xl ring-4 ring-blue-50' : ''} ${activeRail !== 'none' || isSaving ? 'opacity-40 blur-[1px]' : 'opacity-100'} `} onFocus={() => setIsInputMode(true)} onBlur={() => content.length === 0 && !isSaving && setIsInputMode(false)}/>
            <AnimatePresence>{showSuggestion && (<motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} onClick={applySuggestion} className="absolute bottom-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 hover:bg-purple-700 active:scale-95 z-50"><Zap size={12} className="fill-yellow-400 text-yellow-400"/> {parsedData?.suggestion_label}</motion.button>)}</AnimatePresence>
          </div>
          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 80 }} exit={{ opacity: 0, height: 0 }} className="relative w-full flex items-center justify-center mt-4">
                {/* TASK DRAG */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-16 h-16"><AnimatePresence>{activeRail === 'task' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"><div className="absolute inset-0 border border-blue-200 rounded-full rotate-45" /><div className="absolute inset-0 border border-blue-200 rounded-full -rotate-45" /><motion.div style={{ scale: scaleTL }} className="absolute -top-2 -left-2 bg-white p-2 rounded-full shadow text-blue-500"><Check size={20}/></motion.div><motion.div style={{ scale: scaleTR }} className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow text-yellow-500"><Star size={20}/></motion.div><motion.div style={{ scale: scaleBL }} className="absolute -bottom-2 -left-2 bg-white p-2 rounded-full shadow text-orange-500"><Clock size={20}/></motion.div><motion.div style={{ scale: scaleBR }} className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow text-red-600"><Flame size={20}/></motion.div></motion.div>)}</AnimatePresence>
                    <motion.div 
                        drag={!isSaving} dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} dragElastic={0.4} 
                        onDragStart={() => { setActiveRail('task'); setIsDraggingTask(true); triggerHaptic('click'); }} 
                        onDragEnd={(_, info) => { 
                            const { x, y } = info.offset; 
                            setIsDraggingTask(false);
                            if (x < -THRESHOLD && y < -THRESHOLD) handleSave('task', 'TL'); 
                            else if (x > THRESHOLD && y < -THRESHOLD) handleSave('task', 'TR'); 
                            else if (x < -THRESHOLD && y > THRESHOLD) handleSave('task', 'BL'); 
                            else if (x > THRESHOLD && y > THRESHOLD) handleSave('task', 'BR'); 
                            else setActiveRail('none'); 
                        }} 
                        style={{ x: taskDragX, y: taskDragY }} animate={{ opacity: activeRail === 'mood' || isSaving ? 0.2 : 1, scale: activeRail === 'task' ? 1.1 : 1 }} className="touch-none w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white z-30 cursor-grab active:cursor-grabbing"><span className="font-black text-[10px]">TASK</span></motion.div>
                </div>

                {/* MOOD DRAG */}
                <div className="absolute right-0 z-20 flex items-center justify-center w-16 h-16"><AnimatePresence>{activeRail === 'mood' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-48 h-48 -top-16 -left-16 pointer-events-none"><div className="absolute top-1/2 left-0 right-1/2 h-1 bg-slate-200 -translate-y-1/2 rounded-full" /><div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-200 -translate-x-1/2 rounded-full" /></motion.div>)}</AnimatePresence><motion.div drag={!isSaving} dragConstraints={{ top: -200, left: 0, right: 0, bottom: 200 }} dragElastic={0.4} onDragStart={() => { setActiveRail('mood'); triggerHaptic('click'); }} onDrag={handleMoodDrag} onDragEnd={(_, info) => { const { y } = info.offset; if (Math.abs(y) > THRESHOLD) handleSave('mood', 'CUSTOM'); else setActiveRail('none'); setMoodLevel(0); }} style={{ x: moodDragX, y: moodDragY }} animate={{ opacity: activeRail === 'task' || isSaving ? 0.2 : 1, scale: activeRail === 'mood' ? 1.2 : 1 }} className={`touch-none w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-100 z-30 cursor-grab active:cursor-grabbing transition-colors duration-300 ${moodLevel === 2 ? 'bg-green-100 text-green-600 border-green-300' : moodLevel === 1 ? 'bg-green-50 text-green-500' : moodLevel === -1 ? 'bg-red-50 text-red-500' : moodLevel === -2 ? 'bg-red-100 text-red-600 border-red-300' : 'bg-white text-slate-600'}`}><span className="text-2xl transition-all duration-200" style={{ transform: `scale(${1 + Math.abs(moodLevel) * 0.2})` }}>{getMoodIcon()}</span></motion.div></div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* FOCUS LIST (GIỮ NGUYÊN) */}
        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2"><h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)</h3></div>
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {focusTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative p-5 rounded-[2rem] bg-white shadow-md border-l-4 ${task.priority === 'hỏa-tốc' ? 'border-red-500' : task.priority === 'urgent' ? 'border-orange-500' : task.priority === 'important' ? 'border-yellow-400' : 'border-blue-400'}`}>
                  <p className="text-slate-800 font-medium text-base mb-3 leading-snug">{task.content}</p>
                  {task.quantity > 1 && (
                      <div className="mb-3">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                              <span>TIẾN ĐỘ:</span>
                              <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md"><input type="number" value={progressInputs[task.id!] ?? 0} onChange={(e) => onInputChange(task.id!, e.target.value)} className="w-8 text-right bg-transparent outline-none text-slate-700"/><span>/ {task.quantity} {task.unit}</span></div>
                                  <button onClick={() => saveProgressManual(task)} className="bg-blue-100 text-blue-600 p-1 rounded-md hover:bg-blue-200 active:scale-95 transition-transform"><Save size={14}/></button>
                              </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(((progressInputs[task.id!] || 0) / task.quantity) * 100, 100)}%` }} /></div>
                      </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleProgress(task, false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                    <button onClick={() => handleProgress(task, true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold hover:bg-green-100 transition-colors shadow-sm"><CheckCircle2 size={14}/> XONG</button>
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