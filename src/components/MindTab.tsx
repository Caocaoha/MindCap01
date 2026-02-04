import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Entry } from '../db';
import { usePrompts } from '../hooks/usePrompts';
import { getDateMetadata } from '../utils/date';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Send, Zap, Square, Smile, Frown, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export const MindTab = () => {
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState<'none' | 'input' | 'focus'>('none');
  const [dragMode, setDragMode] = useState<'none' | 'todo' | 'mood'>('none');
  
  const { currentPrompt, refreshPrompt } = usePrompts();
  const [lockedPrompt, setLockedPrompt] = useState('');
  const dateMeta = getDateMetadata();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. TỰ ĐỘNG FOCUS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSection === 'none' && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

  useEffect(() => {
    if (currentPrompt && !lockedPrompt) setLockedPrompt(currentPrompt);
  }, [currentPrompt, lockedPrompt]);

  const focusList = useLiveQuery(() => 
    db.entries.filter((e: Entry) => e.status === 'active' && !!e.is_focus).toArray()
  , []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const saveEntry = async (isTask: boolean, extra: { priority?: Entry['priority'], mood?: Entry['mood'] } = {}) => {
    if (!content.trim()) return;
    await db.entries.add({
      id: uuidv4(),
      content: content.trim(),
      created_at: Date.now(),
      date_str: new Date().toISOString().split('T')[0],
      type: 'text',
      is_task: isTask,
      is_focus: false,
      status: isTask ? 'active' : undefined,
      priority: extra.priority || 'normal',
      mood: extra.mood || 'neutral'
    });
    setContent('');
    setActiveSection('none');
    setDragMode('none');
    setLockedPrompt('');
    refreshPrompt();
  };

  // --- COMPONENT 1: L-TRACK (CÔNG VIỆC) ---
  const TodoRailSlider = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleDrag = (_: any, info: any) => {
      // Khóa trục L: Phải chạm Phải mới được xuống Dưới
      if (info.offset.x < 100) { y.set(0); } 
      else { x.set(120); }
    };

    return (
      <div className="relative w-full flex flex-col items-center h-[180px]">
        <div className="absolute top-0 w-full h-full pointer-events-none px-4">
          <svg width="100%" height="100%" viewBox="0 0 360 180">
            <rect x="20" y="20" width="320" height="48" rx="24" className="fill-slate-100/40 stroke-slate-200" />
            <rect x="292" y="20" width="48" height="140" rx="24" className="fill-slate-100/40 stroke-slate-200" />
            <line x1="180" y1="44" x2="280" y2="140" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
        </div>
        <motion.div
          drag dragConstraints={{ left: -140, right: 140, top: 0, bottom: 120 }}
          onDragStart={() => setDragMode('todo')}
          onDrag={handleDrag}
          onDragEnd={(_, info) => {
            const { offset } = info;
            if (offset.x < -100) saveEntry(true, { priority: 'normal' });
            else if (offset.x > 100 && offset.y > 80) saveEntry(true, { priority: 'hỏa-tốc' });
            else if (offset.x > 100) saveEntry(true, { priority: 'important' });
            else if (offset.y > 80) saveEntry(true, { priority: 'urgent' });
            x.set(0); y.set(0); setDragMode('none');
          }}
          style={{ x, y }}
          className="z-30 w-36 h-12 bg-white shadow-2xl rounded-full border border-slate-100 flex items-center justify-center cursor-grab"
        >
          <span className="text-[10px] font-black uppercase text-slate-700">Việc cần làm</span>
        </motion.div>
      </div>
    );
  };

  // --- COMPONENT 2: T-TRACK (CẢM XÚC - $\vdash$) ---
  const MoodRailSlider = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleDrag = (_: any, info: any) => {
      // Khóa trục T: Nếu kéo Ngang (X > 30) thì khóa Y. Nếu kéo Dọc (|Y| > 30) thì khóa X.
      if (Math.abs(info.offset.y) > 30) { x.set(0); }
      else if (info.offset.x > 30) { y.set(0); }
    };

    return (
      <div className="relative">
        <AnimatePresence>
          {dragMode === 'mood' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute right-0 bottom-0 w-[120px] h-[160px] pointer-events-none"
            >
              {/* Vẽ hình chữ T xoay ngang */}
              <svg width="100%" height="100%" viewBox="0 0 120 160">
                <rect x="20" y="10" width="30" height="140" rx="15" className="fill-slate-100/60" />
                <rect x="20" y="65" width="80" height="30" rx="15" className="fill-slate-100/60" />
                <text x="35" y="35" className="fill-yellow-500 font-bold text-[12px]">VUI</text>
                <text x="35" y="145" className="fill-indigo-500 font-bold text-[12px]">BUỒN</text>
                <text x="75" y="85" className="fill-slate-400 font-bold text-[12px]">LƯU</text>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          drag dragConstraints={{ left: 0, right: 80, top: -70, bottom: 70 }}
          onDragStart={() => setDragMode('mood')}
          onDrag={handleDrag}
          onDragEnd={(_, info) => {
            if (info.offset.y < -50) saveEntry(false, { mood: 'positive' });
            else if (info.offset.y > 50) saveEntry(false, { mood: 'negative' });
            else if (info.offset.x > 50) saveEntry(false, { mood: 'neutral' });
            x.set(0); y.set(0); setDragMode('none');
          }}
          style={{ x, y, backgroundColor: useTransform(y, [-40, 0, 40], ["#eab308", "#0f172a", "#6366f1"]) }}
          className="p-4 text-white rounded-full shadow-2xl z-40 relative"
        >
          {y.get() < -20 ? <Smile size={24}/> : y.get() > 20 ? <Frown size={24}/> : <Send size={24}/>}
        </motion.button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-10 overflow-hidden pt-8 px-4" onClick={() => textareaRef.current?.focus()}>
      <motion.div animate={{ opacity: activeSection === 'focus' ? 0.2 : 1 }}>
        <h2 className="text-3xl font-serif font-bold text-slate-900">{dateMeta.dayOfWeek}</h2>
        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] mt-1">{dateMeta.fullDate}</p>
        <h3 className="text-xl font-medium text-slate-700 leading-snug min-h-[3.5rem] mt-4">{lockedPrompt}</h3>
      </motion.div>

      <div className="relative z-20">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef} value={content}
            onFocus={() => setActiveSection('input')}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chạm để viết..."
            className="flex-1 bg-transparent text-xl text-slate-800 focus:outline-none min-h-[48px] py-2"
          />
          <AnimatePresence>{content.length > 0 && <MoodRailSlider />}</AnimatePresence>
        </div>

        <AnimatePresence>
          {activeSection === 'input' && content.length > 0 && dragMode !== 'mood' && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-12">
              <TodoRailSlider />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        animate={{ opacity: activeSection === 'input' ? 0.05 : 1, filter: activeSection === 'input' ? 'blur(8px)' : 'none' }}
        className="flex-1 pt-6 border-t border-slate-100 transition-all duration-700"
        onClick={(e) => { e.stopPropagation(); setActiveSection('focus'); }}
      >
        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">TIÊU ĐIỂM ({focusList?.length || 0}/4)</h3>
        <div className="space-y-4">
          {focusList?.map((task: Entry) => (
            <div key={task.id} className="flex items-start gap-4 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
              {task.priority === 'hỏa-tốc' && <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500" />}
              <button onClick={async (e) => { e.stopPropagation(); await db.entries.update(task.id, { status: 'completed', is_focus: false, completed_at: Date.now() }); }}
                className="mt-0.5 text-slate-200 hover:text-blue-500"><Square size={24} /></button>
              <p className="flex-1 text-slate-700 text-base font-medium">{task.content}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};