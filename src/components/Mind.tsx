import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, Star, Clock, Flame, Send, X, CheckCircle2, Zap, Scale, Repeat, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { db, type Entry, type Mood, type Frequency } from '../utils/db';
import { getDateString } from '../utils/date';
import { parseInputText, type ParseResult } from '../utils/smartParser';

// IMPORT UI COMPONENTS
import SmartChip from './ui/SmartChip';
import ActionToast from './ui/ActionToast';
import QuickEditModal from './ui/QuickEditModal';

const THRESHOLD = 50; 
const V_THRESHOLD = 120;

const Mind: React.FC = () => {
  // --- STATE CƠ BẢN ---
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- UX STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Entry | null>(null);
  const [prevContent, setPrevContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastData, setToastData] = useState<{ message: string; id: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [moodLevel, setMoodLevel] = useState<number>(0);

  const [progressInputs, setProgressInputs] = useState<Record<number, number>>({});

  // --- MOTION SETUP ---
  const taskDragX = useMotionValue(0); 
  const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0); 
  const moodDragY = useMotionValue(0);

  const scaleTL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleTR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);
  const scaleBL = useTransform(taskDragX, [-THRESHOLD, 0], [1.5, 1]);
  const scaleBR = useTransform(taskDragX, [0, THRESHOLD], [1, 1.5]);

  const triggerHaptic = (type: 'success' | 'error' | 'click' | 'thump' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(30); 
      else if (type === 'error') navigator.vibrate([50, 30, 50]);
      else if (type === 'click') navigator.vibrate(10);
      else if (type === 'thump') navigator.vibrate(10);
      else if (type === 'impact') navigator.vibrate(30);
    }
  };

  // --- SHORTCUTS & AUTO FOCUS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
        e.preventDefault(); 
        handleSave('mood', 'neutral'); 
        return; 
      }
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && 
          document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsInputMode(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputMode, content]);

  // --- NLP & SUGGESTION ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim().length > 2) {
        const result = parseInputText(content);
        setParsedData(result);
        if (result.suggestion_label && !result.is_detected) setShowSuggestion(true);
        else setShowSuggestion(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [content]);

  const fetchFocusTasks = async () => {
    try {
      const tasks = await db.entries.filter(e => e.is_focus === true && e.status === 'active').toArray();
      setFocusTasks(tasks);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFocusTasks(); }, []);

  // 1. CƠ CHẾ VÒNG XOAY VÔ CỰC (DIAL) - ĐÃ THÊM KIỂU DỮ LIỆU
  const handleDialScroll = async (task: Entry, info: any) => {
      const yOffset = info.offset.y;
      const sensitivity = 20;
      const change = -Math.floor(yOffset / sensitivity);
      let newProgress = Math.max(0, Math.min(task.quantity, (task.progress || 0) + change));
      
      if (newProgress !== task.progress) {
          if (newProgress === task.quantity) triggerHaptic('impact');
          else triggerHaptic('thump');
          await db.entries.update(task.id!, { progress: newProgress });
          if (newProgress === task.quantity) handleComplete(task);
          fetchFocusTasks();
      }
  };

  // 2. CƠ CHẾ THANH LỎNG (LIQUID BAR) - ĐÃ THÊM KIỂU DỮ LIỆU
  const handleBarDrag = async (task: Entry, info: any, barWidth: number) => {
      const xPos = info.point.x;
      const barRect = info.target.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(barWidth, xPos - barRect.left));
      const percentage = relativeX / barWidth;
      let newProgress = Math.round(percentage * task.quantity);
      
      if (newProgress !== task.progress) {
          triggerHaptic('thump');
          await db.entries.update(task.id!, { progress: newProgress });
          if (newProgress === task.quantity) handleComplete(task);
          fetchFocusTasks();
      }
  };

  // 3. CƠ CHẾ CHẠM TÍCH LŨY (SMART TAP)
  const handleSmartTap = async (task: Entry) => {
      if (task.quantity > 10) {
          triggerHaptic('error');
          return;
      }
      const newProgress = Math.min(task.quantity, (task.progress || 0) + 1);
      triggerHaptic('thump');
      await db.entries.update(task.id!, { progress: newProgress });
      if (newProgress === task.quantity) handleComplete(task);
      fetchFocusTasks();
  };

  const handleComplete = async (task: Entry) => {
      triggerHaptic('success');
      setTimeout(async () => {
          await db.entries.update(task.id!, { status: 'completed', is_focus: false, completed_at: Date.now() });
          fetchFocusTasks();
      }, 800);
  };

  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim() || isSaving) return;
    setIsSaving(true); 
    setActiveRail('none'); 
    setPrevContent(content);

    try {
      let finalQty = 1, finalUnit = 'lần', finalFreq: Frequency = 'once';
      if (parsedData) { finalQty = parsedData.quantity; finalUnit = parsedData.unit; finalFreq = parsedData.frequency; }
      
      let finalMood: Mood = 'neutral'; let finalScore = 0;
      if (type === 'mood') {
        finalScore = moodLevel;
        if (moodLevel === 2) finalMood = 'v-positive'; 
        else if (moodLevel === 1) finalMood = 'positive';
        else if (moodLevel === -1) finalMood = 'negative'; 
        else if (moodLevel === -2) finalMood = 'v-negative';
      }

      const newEntry: Entry = {
        content, created_at: Date.now(), date_str: getDateString(), status: 'active', lifecycle_logs: [{ action: 'created', timestamp: Date.now() }],
        is_task: type === 'task', is_focus: false, priority: 'normal', mood: finalMood, mood_score: finalScore,
        quantity: finalQty, progress: 0, unit: finalUnit, frequency: finalFreq,
        nlp_metadata: { original_text: content, extracted_qty: finalQty, extracted_unit: finalUnit, extracted_freq: finalFreq }
      };

      if (type === 'task') {
        if (direction === 'TL') newEntry.priority = 'normal'; 
        if (direction === 'TR') newEntry.priority = 'important';
        if (direction === 'BL') newEntry.priority = 'urgent'; 
        if (direction === 'BR') newEntry.priority = 'hỏa-tốc';
      }

      const id = await db.entries.add(newEntry);
      setLastSavedEntry({ ...newEntry, id: id as number });
      triggerHaptic('success');
      setToastData({ message: `Đã lưu thành công`, id: id as number });
      setContent(''); setParsedData(null); setMoodLevel(0); setIsInputMode(false); fetchFocusTasks();
    } catch (e) { triggerHaptic('error'); } 
    finally { setIsSaving(false); setIsDragging(false); }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 overflow-hidden font-sans">
      <div className="w-full max-w-md flex flex-col gap-4 h-full relative">
        <SmartChip 
          x={activeRail === 'task' ? taskDragX : moodDragX} 
          y={activeRail === 'task' ? taskDragY : moodDragY} 
          mode={activeRail === 'mood' ? 'mood' : 'task'} 
          taskData={parsedData} 
          moodLevel={moodLevel} 
          isDragging={isDragging} 
        />
        
        <AnimatePresence>
          {toastData && (
            <ActionToast 
              message={toastData.message} 
              onUndo={async () => { 
                await db.entries.delete(lastSavedEntry!.id!); 
                setContent(prevContent); 
                setIsInputMode(true); 
                setToastData(null); 
                fetchFocusTasks(); 
              }} 
              onEdit={() => setShowEditModal(true)} 
              onClose={() => setToastData(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEditModal && lastSavedEntry && (
            <QuickEditModal 
              task={lastSavedEntry} 
              onSave={async (u) => { 
                await db.entries.update(lastSavedEntry.id!, u); 
                setShowEditModal(false); 
                fetchFocusTasks(); 
              }} 
              onClose={() => setShowEditModal(false)}
            />
          )}
        </AnimatePresence>

        <section className={`relative transition-all duration-500 z-30 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex justify-between items-center">
             <span>{activeRail === 'task' ? "Lưu vào Kho trí nhớ" : activeRail === 'mood' ? "Lưu vào Nhật ký" : "Điều gì đang diễn ra?"}</span>
          </h2>
          <div className="relative w-full"> 
            <textarea 
              ref={textareaRef} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Gõ phím bất kỳ..." 
              className="w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none shadow-xl focus:shadow-2xl transition-all" 
              onFocus={() => setIsInputMode(true)}
            />
            <AnimatePresence>
              {showSuggestion && (
                <motion.button 
                  onClick={() => { setContent(prev => prev + ` ${parsedData?.quantity} ${parsedData?.unit}`); triggerHaptic('success'); }} 
                  className="absolute bottom-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
                >
                  <Zap size={12}/> {parsedData?.suggestion_label}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 80 }} className="relative w-full flex items-center justify-center mt-4">
                <div className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-16 h-16">
                    <motion.div 
                      drag 
                      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} 
                      onDragStart={() => { setActiveRail('task'); setIsDragging(true); }} 
                      onDragEnd={(_: any, info: any) => { 
                        const { x, y } = info.offset; 
                        if (x < -THRESHOLD && y < -THRESHOLD) handleSave('task', 'TL'); 
                        else if (x > THRESHOLD && y < -THRESHOLD) handleSave('task', 'TR'); 
                        else if (x < -THRESHOLD && y > THRESHOLD) handleSave('task', 'BL'); 
                        else if (x > THRESHOLD && y > THRESHOLD) handleSave('task', 'BR'); 
                        else { setActiveRail('none'); setIsDragging(false); } 
                      }} 
                      className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white z-30 font-black text-[10px]"
                    >
                      TASK
                    </motion.div>
                </div>
                <div className="absolute right-0 z-20 flex items-center justify-center w-16 h-16">
                    <motion.div 
                      drag 
                      dragConstraints={{ top: -200, left: 0, right: 0, bottom: 200 }} 
                      onDragStart={() => { setActiveRail('mood'); setIsDragging(true); }} 
                      onDragEnd={(_: any, info: any) => { 
                        if (Math.abs(info.offset.y) > THRESHOLD) handleSave('mood', 'CUSTOM'); 
                        else { setActiveRail('none'); setIsDragging(false); } 
                      }} 
                      onDrag={(_: any, i: any) => { 
                        const y = i.offset.y; 
                        if (y < -V_THRESHOLD) setMoodLevel(2); 
                        else if (y < -THRESHOLD) setMoodLevel(1); 
                        else if (y > V_THRESHOLD) setMoodLevel(-2); 
                        else if (y > THRESHOLD) setMoodLevel(-1); 
                        else setMoodLevel(0); 
                      }} 
                      className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-slate-100 z-30"
                    >
                      {moodLevel === 2 ? '🤩' : moodLevel === 1 ? '😃' : moodLevel === -1 ? '😔' : moodLevel === -2 ? '😫' : '😐'}
                    </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className={`flex-1 transition-all duration-500 ${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2"><h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)</h3></div>
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {focusTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`relative p-5 rounded-[2rem] bg-white shadow-md border-l-4 ${task.priority === 'hỏa-tốc' ? 'border-red-500' : 'border-blue-400'}`}>
                  <p className="text-slate-800 font-medium text-base mb-3 leading-snug">{task.content}</p>
                  
                  {task.quantity > 1 && (
                      <div className="mb-3 select-none">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
                              <span className="flex items-center gap-1"><Scale size={10}/> TIẾN ĐỘ</span>
                              {/* FIX LỖI: THÊM KIỂU DỮ LIỆU CHO THAM SỐ PAN */}
                              <motion.div 
                                onPan={(_: any, info: any) => handleDialScroll(task, info)}
                                whileHover={{ scale: 1.2 }}
                                className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl cursor-ns-resize shadow-inner active:bg-blue-50 active:text-blue-600 transition-colors"
                              >
                                  <ChevronUp size={10} className="opacity-40" />
                                  <span className="text-lg font-black text-slate-700 tabular-nums">{task.progress || 0}</span>
                                  <span className="opacity-40">/ {task.quantity} {task.unit}</span>
                                  <ChevronDown size={10} className="opacity-40" />
                              </motion.div>
                          </div>

                          <div className="relative group pt-2 pb-4">
                              {/* FIX LỖI: CHUYỂN div THÀNH motion.div ĐỂ HIỂU onPan */}
                              <motion.div 
                                onClick={() => handleSmartTap(task)}
                                onPan={(_: any, info: any) => handleBarDrag(task, info, 300)}
                                className="h-4 w-full bg-slate-100 rounded-full overflow-hidden cursor-pointer relative shadow-inner"
                              >
                                  <motion.div 
                                    className={`h-full transition-all duration-300 ${task.progress === task.quantity ? 'bg-green-500' : 'bg-blue-500'}`}
                                    animate={{ width: `${Math.min(((task.progress || 0) / task.quantity) * 100, 100)}%` }} 
                                  />
                              </motion.div>
                          </div>
                      </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button onClick={async () => { await db.entries.update(task.id!, { is_focus: false }); fetchFocusTasks(); }} className="p-2 text-slate-300 hover:text-slate-500"><X size={18}/></button>
                    <button onClick={() => handleComplete(task)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${task.progress === task.quantity ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <CheckCircle2 size={16}/> {task.progress === task.quantity ? 'HOÀN TẤT' : 'XONG'}
                    </button>
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