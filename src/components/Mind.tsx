import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { X, CheckCircle2, Zap, Scale, Waves, ChevronUp, History as HistoryIcon } from 'lucide-react';
import { db, type Entry, type Mood, type Frequency, getTriggerEchoes } from '../utils/db';
import { getDateString } from '../utils/date';
import { parseInputText, type ParseResult } from '../utils/smartParser';

// Khôi phục các thành phần cảm biến
import SmartChip from './ui/SmartChip';
import ActionToast from './ui/ActionToast';
import QuickEditModal from './ui/QuickEditModal';
import DeepDive from './DeepDive';

const Mind: React.FC = () => {
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
  const taskDragX = useMotionValue(0); 
  const moodDragX = useMotionValue(0);

  const triggerHaptic = (type: 'success' | 'click' | 'impact') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'impact' ? 40 : 15);
    }
  };

  // --- [MỚI] HỖ TRỢ BÀN PHÍM CỨNG & AUTO-FOCUS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Lệnh Ctrl+S / Cmd+S để lưu trung tính
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (content.trim()) handleSave('mood', 'neutral');
        return;
      }

      // 2. Tự động focus khi gõ phím chữ/số (nếu chưa focus)
      if (!isInputMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsInputMode(true);
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInputMode, content]);

  const fetchFocusTasks = async () => {
    const tasks = await db.entries.filter(e => e.is_focus && e.status === 'active').toArray();
    setFocusTasks(tasks);
  };

  useEffect(() => { fetchFocusTasks(); }, []);

  const handleSave = async (type: 'task' | 'mood', direction: string) => {
    if (!content.trim() || isSaving) return;
    setIsSaving(true);
    const prevContent = content;

    try {
      let finalQty = 1, finalUnit = 'lần', finalFreq: Frequency = 'once';
      if (parsedData) { finalQty = parsedData.quantity; finalUnit = parsedData.unit; finalFreq = parsedData.frequency; }
      
      const newEntry: Entry = {
        content, created_at: Date.now(), date_str: getDateString(), status: 'active',
        is_task: type === 'task', is_focus: false, priority: 'normal',
        mood: moodLevel > 0 ? 'positive' : moodLevel < 0 ? 'negative' : 'neutral',
        mood_score: moodLevel, quantity: finalQty, progress: 0, unit: finalUnit, frequency: finalFreq,
        lifecycle_logs: [{ action: 'created', timestamp: Date.now() }]
      };

      const id = await db.entries.add(newEntry);
      setLastSavedEntry({ ...newEntry, id: id as number });
      setToastData({ message: `Đã ghi nhận vào ${type === 'task' ? 'Sa bàn' : 'Nhật ký'}`, id: id as number });
      
      triggerHaptic('success');
      setContent('');
      setIsInputMode(false);
      fetchFocusTasks();
    } catch (e) { triggerHaptic('click'); } 
    finally { setIsSaving(false); setIsDragging(false); setActiveRail('none'); }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <AnimatePresence>{showDeepDive && <DeepDive onClose={() => setShowDeepDive(false)} />}</AnimatePresence>
      
      {/* TOAST PHẢN HỒI */}
      <AnimatePresence>
        {toastData && (
          <ActionToast 
            message={toastData.message} 
            onUndo={async () => { await db.entries.delete(toastData.id); setContent(lastSavedEntry?.content || ''); setToastData(null); fetchFocusTasks(); }} 
            onEdit={() => setShowEditModal(true)}
            onClose={() => setToastData(null)}
          />
        )}
      </AnimatePresence>

      {/* QUICK EDIT MODAL */}
      {showEditModal && lastSavedEntry && (
        <QuickEditModal task={lastSavedEntry} onSave={async (u) => { await db.entries.update(lastSavedEntry.id!, u); setShowEditModal(false); fetchFocusTasks(); }} onClose={() => setShowEditModal(false)} />
      )}

      {/* SMART CHIP SENSORS */}
      <SmartChip x={activeRail === 'task' ? taskDragX : moodDragX} y={useMotionValue(0)} mode={activeRail === 'mood' ? 'mood' : 'task'} taskData={parsedData} moodLevel={moodLevel} isDragging={isDragging} />

      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="pt-6 mb-2">
           {/* Style Label HIỆN TẠI to mạnh mẽ */}
           <h2 className="text-2xl font-black text-blue-600 uppercase tracking-[0.2em]">HIỆN TẠI</h2>
        </header>

        <section className={`relative transition-all duration-500 z-30 ${isInputMode ? 'scale-105' : 'scale-100'}`}>
          <h2 
            onTouchStart={() => { longPressTimer.current = setTimeout(() => setShowDeepDive(true), 1500); }}
            onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
            className="text-xl font-bold text-slate-800 mb-4 select-none cursor-pointer"
          >
            {activeRail === 'task' ? "Ghi nhớ việc..." : activeRail === 'mood' ? "Ghi lại tâm trí..." : "Điều gì đang diễn ra?"}
          </h2>
          <textarea 
            ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} 
            placeholder="Gõ để bắt đầu hành động..." onFocus={() => setIsInputMode(true)}
            className="w-full min-h-[160px] p-6 rounded-[2rem] bg-white text-lg resize-none outline-none shadow-xl focus:shadow-2xl transition-all" 
          />
          {/* Nút kéo Task/Mood khôi phục tại đây... */}
        </section>

        <section className={`${isInputMode ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'} transition-all`}>
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> Tiêu điểm ({focusTasks.length}/4)</h3>
           {/* Render danh sách Tiêu điểm với Gợn sóng ký ức... */}
        </section>
      </div>
    </div>
  );
};
export default Mind;