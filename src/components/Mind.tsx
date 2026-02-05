import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  X, CheckCircle2, Zap, Scale, Waves, History as HistoryIcon, ChevronUp, ChevronDown 
} from 'lucide-react';
import { db, type Entry, type Mood, type Frequency, getTriggerEchoes } from '../utils/db';
import { getDateString } from '../utils/date';
import { parseInputText, type ParseResult } from '../utils/smartParser';

import SmartChip from './ui/SmartChip';
import ActionToast from './ui/ActionToast';
import QuickEditModal from './ui/QuickEditModal';
import DeepDive from './DeepDive';

const THRESHOLD = 50; 
const V_THRESHOLD = 120;

const Mind: React.FC = () => {
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Entry | null>(null);
  const [prevContent, setPrevContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastData, setToastData] = useState<{ message: string; id: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [moodLevel, setMoodLevel] = useState<number>(0);
  const [rippleId, setRippleId] = useState<number | null>(null);
  const [echoMemory, setEchoMemory] = useState<Entry | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const taskDragX = useMotionValue(0); const taskDragY = useMotionValue(0);
  const moodDragX = useMotionValue(0); const moodDragY = useMotionValue(0);

  const triggerHaptic = (type: 'success' | 'error' | 'click' | 'thump' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') navigator.vibrate(30); 
      else if (type === 'impact') navigator.vibrate(30);
      else navigator.vibrate(10);
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('impact');
      setShowDeepDive(true);
    }, 1500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const fetchFocusTasks = async () => {
    const tasks = await db.entries.filter(e => e.is_focus === true && e.status === 'active').toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => { fetchFocusTasks(); }, []);

  const triggerRipple = async (task: Entry) => {
    if (rippleId === task.id) { setRippleId(null); return; }
    const results = await getTriggerEchoes(task.content, 1);
    if (results.length > 0) {
      setEchoMemory(results[0]);
      setRippleId(task.id!);
      triggerHaptic('click');
    }
  };

  const handleDialScroll = async (task: Entry, info: any) => {
    const change = -Math.floor(info.offset.y / 20);
    let newProgress = Math.max(0, Math.min(task.quantity, (task.progress || 0) + change));
    if (newProgress !== task.progress) {
      triggerHaptic('thump');
      await db.entries.update(task.id!, { progress: newProgress });
      if (newProgress === task.quantity) handleComplete(task);
      fetchFocusTasks();
    }
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
    setIsSaving(true); setPrevContent(content);
    try {
      let finalQty = 1, finalUnit = 'lần', finalFreq: Frequency = 'once';
      if (parsedData) { finalQty = parsedData.quantity; finalUnit = parsedData.unit; finalFreq = parsedData.frequency; }
      let finalMood: Mood = 'neutral'; let finalScore = 0;
      if (type === 'mood') {
        finalScore = moodLevel;
        if (moodLevel === 2) finalMood = 'v-positive'; else if (moodLevel === 1) finalMood = 'positive';
        else if (moodLevel === -1) finalMood = 'negative'; else if (moodLevel === -2) finalMood = 'v-negative';
      }
      const newEntry: Entry = {
        content, created_at: Date.now(), date_str: getDateString(), status: 'active', lifecycle_logs: [{ action: 'created', timestamp: Date.now() }],
        is_task: type === 'task', is_focus: false, priority: 'normal', mood: finalMood, mood_score: finalScore,
        quantity: finalQty, progress: 0, unit: finalUnit, frequency: finalFreq,
      };
      if (type === 'task') {
        if (direction === 'TL') newEntry.priority = 'normal'; if (direction === 'TR') newEntry.priority = 'important';
        if (direction === 'BL') newEntry.priority = 'urgent'; if (direction === 'BR') newEntry.priority = 'hỏa-tốc';
      }
      const id = await db.entries.add(newEntry);
      setLastSavedEntry({ ...newEntry, id: id as number });
      triggerHaptic('success');
      setToastData({ message: `Đã lưu thành công`, id: id as number });
      setContent(''); setMoodLevel(0); setIsInputMode(false); fetchFocusTasks();
    } catch (e) { triggerHaptic('error'); } finally { setIsSaving(false); setIsDragging(false); }
  };

  return (
    <div className="p-4 pb-24">
      <AnimatePresence>{showDeepDive && <DeepDive onClose={() => setShowDeepDive(false)} />}</AnimatePresence>
      <header className="mb-6 pt-4">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Hiện tại</h2>
      </header>
      <div className="w-full max-w-md flex flex-col gap-4 relative">
        <SmartChip x={activeRail === 'task' ? taskDragX : moodDragX} y={activeRail === 'task' ? taskDragY : moodDragY} mode={activeRail === 'mood' ? 'mood' : 'task'} taskData={parsedData} moodLevel={moodLevel} isDragging={isDragging} />
        <section className={`relative z-30 ${isInputMode ? 'scale-105' : 'scale-100'} transition-all`}>
          <h2 
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd}
            className="text-xl font-bold text-slate-800 mb-4 select-none cursor-pointer"
          >
            {activeRail === 'task' ? "Ghi nhớ việc" : activeRail === 'mood' ? "Nhật ký tâm trí" : "Điều gì đang diễn ra?"}
          </h2>
          <textarea 
            ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} 
            placeholder="Chạm để bắt đầu..." onFocus={() => setIsInputMode(true)}
            className="w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none shadow-xl focus:shadow-2xl transition-all" 
          />
          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <div className="relative w-full h-20 mt-4 flex justify-center items-center">
                <motion.div drag dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} onDragStart={() => {setActiveRail('task'); setIsDragging(true)}} onDragEnd={(_, i) => { if(Math.abs(i.offset.x) > 50 || Math.abs(i.offset.y) > 50) handleSave('task', 'TL'); else {setActiveRail('none'); setIsDragging(false)}}} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-black z-30">TASK</motion.div>
                <motion.div drag dragConstraints={{ top: -100, bottom: 100 }} onDragStart={() => {setActiveRail('mood'); setIsDragging(true)}} onDragEnd={(_, i) => { if(Math.abs(i.offset.y) > 50) handleSave('mood', 'C'); else {setActiveRail('none'); setIsDragging(false)}}} onDrag={(_, i) => setMoodLevel(i.offset.y < -50 ? 2 : i.offset.y > 50 ? -2 : 0)} className="absolute right-0 w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-slate-100 z-30">{moodLevel === 2 ? '🤩' : moodLevel === -2 ? '😫' : '😐'}</motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>

        <section className={`${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'} transition-all`}>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Tiêu điểm ({focusTasks.length}/4)</h3>
          <div className="flex flex-col gap-4">
            {focusTasks.map(task => (
              <motion.div key={task.id} className="p-5 rounded-[2rem] bg-white shadow-md border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-800 font-medium leading-snug">{task.content}</p>
                  <button onClick={() => triggerRipple(task)} className="p-1 text-blue-300 hover:text-blue-600"><Waves size={16} className={rippleId === task.id ? "animate-pulse" : ""}/></button>
                </div>
                <AnimatePresence>
                  {rippleId === task.id && echoMemory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-3 bg-blue-50/50 p-3 rounded-2xl border-l-2 border-blue-300 overflow-hidden">
                      <p className="text-[11px] text-slate-500 italic">" {echoMemory.content} "</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {task.quantity > 1 && (
                  <div className="mb-3 select-none">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
                      <span className="flex items-center gap-1"><Scale size={10}/> TIẾN ĐỘ</span>
                      <motion.div onPan={(_: any, i: any) => handleDialScroll(task, i)} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl cursor-ns-resize shadow-inner">
                        <ChevronUp size={10} className="opacity-40" />
                        <span className="text-lg font-black text-slate-700">{task.progress || 0}</span>
                        <span className="opacity-40">/ {task.quantity} {task.unit}</span>
                      </motion.div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleComplete(task)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-xs font-bold"><CheckCircle2 size={16}/> XONG</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
export default Mind;