import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { db, type Entry, type Mood, type Frequency } from '../utils/db';
import { getDateString } from '../utils/date';
import { parseInputText, type ParseResult } from '../utils/smartParser';

import SmartChip from './ui/SmartChip';
import ActionToast from './ui/ActionToast';
import QuickEditModal from './ui/QuickEditModal';
import DeepDive from './DeepDive';

const THRESHOLD = 60; 
const V_THRESHOLD = 120;

const Mind: React.FC = () => {
  // --- 1. KHAI BÁO HOOKS (Tuyệt đối giữ nguyên vị trí đầu file) ---
  const [content, setContent] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [activeRail, setActiveRail] = useState<'none' | 'task' | 'mood'>('none');
  const [focusTasks, setFocusTasks] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<Entry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastData, setToastData] = useState<{ message: string; id: number } | null>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [moodLevel, setMoodLevel] = useState<number>(0);
  const [showDeepDive, setShowDeepDive] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // MOTION VALUES: Lưu tọa độ vật lý của núm kéo
  const taskDragX = useMotionValue(0); 
  const taskDragY = useMotionValue(0);
  const moodDragY = useMotionValue(0);

  // --- 2. LOGIC BỔ TRỢ ---
  
  // [FIX 1] Hàm cưỡng ép reset vị trí núm về tâm (0,0)
  const resetMotionValues = () => {
    taskDragX.set(0);
    taskDragY.set(0);
    moodDragY.set(0);
  };

  const triggerHaptic = (type: 'success' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'impact' ? 40 : 20);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (content.trim()) handleSave('mood', 'CENTER');
        return;
      }
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsInputMode(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputMode, content]);

  useEffect(() => {
    if (content.length > 2) {
      const result = parseInputText(content);
      setParsedData(result);
    }
  }, [content]);

  const fetchFocusTasks = async () => {
    const tasks = await db.entries.filter(e => e.is_focus && e.status === 'active').toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => { fetchFocusTasks(); }, []);

  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim() || isSaving) return;
    setIsSaving(true);
    
    // Tắt Toast cũ ngay khi bắt đầu lưu mới
    setToastData(null); 

    try {
      const entry: Entry = {
        content, created_at: Date.now(), date_str: getDateString(), status: 'active',
        is_task: type === 'task', is_focus: false, priority: 'normal',
        mood: moodLevel > 0 ? 'positive' : moodLevel < 0 ? 'negative' : 'neutral',
        mood_score: moodLevel,
        quantity: parsedData?.quantity || 1, progress: 0,
        unit: parsedData?.unit || 'lần', frequency: parsedData?.frequency || 'once',
        lifecycle_logs: [{ action: 'created', timestamp: Date.now() }]
      };

      if (type === 'task') {
        if (direction === 'TL') entry.priority = 'normal';
        else if (direction === 'TR') entry.priority = 'important';
        else if (direction === 'BL') entry.priority = 'urgent';
        else if (direction === 'BR') entry.priority = 'hỏa-tốc';
      }

      const id = await db.entries.add(entry);
      setLastSavedEntry({ ...entry, id: id as number });
      setToastData({ message: `Đã lưu thành công`, id: id as number });
      triggerHaptic('success');
      
      // Reset form
      setContent(''); 
      setIsInputMode(false); 
      fetchFocusTasks();
      
    } finally { 
      setIsSaving(false); 
      setIsDragging(false); 
      setActiveRail('none'); 
      setMoodLevel(0);
      
      // [FIX 1] Reset vị trí núm ngay lập tức sau khi lưu xong
      resetMotionValues();
    }
  };

  // --- 3. GIAO DIỆN (UI) ---
  return (
    <div className="p-4 flex flex-col items-center">
      <AnimatePresence>{showDeepDive && <DeepDive onClose={() => setShowDeepDive(false)} />}</AnimatePresence>
      
      <SmartChip 
        x={activeRail === 'task' ? taskDragX : useMotionValue(0)} 
        y={activeRail === 'task' ? taskDragY : moodDragY} 
        mode={activeRail === 'mood' ? 'mood' : 'task'} 
        taskData={parsedData} moodLevel={moodLevel} isDragging={isDragging} 
      />

      <AnimatePresence>
        {toastData && (
          <ActionToast 
            message={toastData.message} 
            onUndo={async () => { await db.entries.delete(toastData.id); setContent(lastSavedEntry?.content || ''); fetchFocusTasks(); setToastData(null); }} 
            onEdit={() => setShowEditModal(true)} onClose={() => setToastData(null)}
          />
        )}
      </AnimatePresence>

      {showEditModal && lastSavedEntry && (
        <QuickEditModal task={lastSavedEntry} onSave={async (u) => { await db.entries.update(lastSavedEntry.id!, u); setShowEditModal(false); fetchFocusTasks(); }} onClose={() => setShowEditModal(false)} />
      )}

      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="pt-2 mb-2">
           <h2 className="text-2xl font-black text-blue-600 uppercase tracking-[0.2em]">HIỆN TẠI</h2>
        </header>

        <section className={`relative transition-all duration-500 z-30 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          <h2 
            onTouchStart={() => { longPressTimer.current = setTimeout(() => { triggerHaptic('impact'); setShowDeepDive(true); }, 1500); }}
            onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
            className="text-xl font-bold text-slate-800 mb-4 select-none cursor-pointer"
          >
            {activeRail === 'task' ? "Lưu vào Sa bàn..." : activeRail === 'mood' ? "Lưu vào Nhật ký..." : "Điều gì đang diễn ra?"}
          </h2>
          
          <textarea 
            ref={textareaRef} 
            value={content} 
            // [FIX 2] Tắt Toast ngay khi có tương tác nhập liệu
            onChange={(e) => { 
                setContent(e.target.value); 
                if (toastData) setToastData(null); 
            }} 
            onFocus={() => { 
                setIsInputMode(true); 
                if (toastData) setToastData(null); 
            }}
            placeholder="Gõ để bắt đầu..." 
            className="w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none shadow-xl focus:shadow-2xl transition-all" 
          />

          {/* KHU VỰC ĐIỀU KHIỂN RAIL */}
          <AnimatePresence>
            {isInputMode && content.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="relative w-full h-32 mt-4 overflow-visible" // overflow-visible để núm không bị cắt nếu nảy
              >
                {/* 1. X-RAIL (TASK): CHÍNH GIỮA */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-dashed border-blue-100 rounded-full scale-125 opacity-50" />
                    <div className="absolute top-0 text-[8px] font-bold text-slate-300 pointer-events-none">QUAN TRỌNG</div>
                    <div className="absolute bottom-0 text-[8px] font-bold text-slate-300 pointer-events-none">KHẨN CẤP</div>
                    
                    <motion.div 
                      drag 
                      dragConstraints={{ top: -THRESHOLD-20, left: -THRESHOLD-20, right: THRESHOLD+20, bottom: THRESHOLD+20 }} 
                      dragElastic={0.1} // Giảm độ nảy để dễ kiểm soát
                      style={{ x: taskDragX, y: taskDragY }}
                      onDragStart={() => { setActiveRail('task'); setIsDragging(true); }}
                      onDragEnd={(_, info) => {
                        const { x, y } = info.offset;
                        if (x < -THRESHOLD && y < -THRESHOLD) handleSave('task', 'TL');
                        else if (x > THRESHOLD && y < -THRESHOLD) handleSave('task', 'TR');
                        else if (x < -THRESHOLD && y > THRESHOLD) handleSave('task', 'BL');
                        else if (x > THRESHOLD && y > THRESHOLD) handleSave('task', 'BR');
                        else { 
                            setActiveRail('none'); 
                            setIsDragging(false); 
                            // Nếu thả tay mà không lưu, cũng cần reset về tâm
                            resetMotionValues();
                        }
                      }}
                      className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white z-50 font-black text-xs cursor-grab active:cursor-grabbing"
                    >
                      TASK
                    </motion.div>
                </div>

                {/* 2. T-RAIL (MOOD): BÊN PHẢI */}
                <div className="absolute right-4 top-4 w-16 h-32 flex flex-col items-center justify-center">
                    <div className="absolute h-full w-1 bg-slate-100 rounded-full" />
                    <motion.div 
                      drag="y" 
                      dragConstraints={{ top: -V_THRESHOLD, bottom: V_THRESHOLD }}
                      style={{ y: moodDragY }}
                      onDragStart={() => { setActiveRail('mood'); setIsDragging(true); }}
                      onDrag={(_, info) => {
                        const y = info.offset.y;
                        if (y < -V_THRESHOLD) setMoodLevel(2); else if (y < -THRESHOLD) setMoodLevel(1);
                        else if (y > V_THRESHOLD) setMoodLevel(-2); else if (y > THRESHOLD) setMoodLevel(-1);
                        else setMoodLevel(0);
                      }}
                      onDragEnd={(_, info) => {
                        if (Math.abs(info.offset.y) > THRESHOLD) handleSave('mood', 'CENTER');
                        else { 
                            setActiveRail('none'); 
                            setIsDragging(false); 
                            setMoodLevel(0); 
                            resetMotionValues();
                        }
                      }}
                      className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-xl border-2 border-slate-50 z-50 cursor-grab active:cursor-grabbing relative"
                    >
                      {moodLevel === 2 ? '🤩' : moodLevel === 1 ? '😃' : moodLevel === -1 ? '😔' : moodLevel === -2 ? '😫' : '😐'}
                    </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className={`${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'} transition-all`}>
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)</h3>
           <div className="flex flex-col gap-4">
              {focusTasks.map(task => (
                <div key={task.id} className="p-5 rounded-[2rem] bg-white shadow-md border-l-4 border-blue-400 flex justify-between items-center">
                   <p className="text-slate-800 font-medium">{task.content}</p>
                   <button onClick={async () => { await db.entries.update(task.id!, { status: 'completed', is_focus: false }); fetchFocusTasks(); triggerHaptic('success'); }} className="p-2 text-slate-300 hover:text-green-500"><CheckCircle2 size={20}/></button>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default Mind;