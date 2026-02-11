// src/components/Input/InputBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Plus, Save, Smile, Frown, Minus, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../../database/db';
import { useUserStore } from '../../store/userStore';
import { parseInputText, getPriorityFromAngle } from '../../utils/nlpEngine';
import { ActionToast } from './ActionToast';
import { QuickEditModal } from './QuickEditModal';
import { useUIStore } from '../../store/uiStore';

export const InputBar: React.FC = () => {
  // --- STATE ---
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRail, setActiveRail] = useState<'task' | 'mood' | null>(null);
  
  // Feedback UI
  const [toast, setToast] = useState<{ visible: boolean; msg: string; lastId?: string; type?: 'task'|'thought' }>({ visible: false, msg: '' });
  const [modalOpen, setModalOpen] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // --- GESTURE LOGIC ---
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 })); // Button position

  // 1. Task Gesture Bind (X-Rail)
  const bindTask = useDrag(({ down, movement: [mx, my], last }) => {
    if (down) {
      setActiveRail('task');
      api.start({ x: mx, y: my, immediate: true });
    } else {
      setActiveRail(null);
      api.start({ x: 0, y: 0 }); // Spring back
      
      // Calculate Drop Zone
      const dist = Math.sqrt(mx * mx + my * my);
      if (dist > 50) { // Threshold to activate
        const angle = Math.atan2(my, mx) * (180 / Math.PI); // Radians to Degrees
        const priority = getPriorityFromAngle(angle);
        handleSaveTask(priority);
      }
    }
  }, { filterTaps: true });

  // 2. Mood Gesture Bind (T-Rail)
  // Progressive Feedback Logic
  const [moodIconState, setMoodIconState] = useState<'neutral' | 'happy' | 'sad'>('neutral');
  
  const bindMood = useDrag(({ down, movement: [mx, my] }) => {
    if (down) {
      setActiveRail('mood');
      api.start({ x: mx, y: my, immediate: true });
      
      // Logic Progressive Feedback
      const dist = Math.sqrt(mx * mx + my * my);
      
      // Haptic & Morphing based on Direction & Distance
      if (my < -50) { // UP -> Happy
         if (dist > 100 && moodIconState !== 'happy') {
           if (navigator.vibrate) navigator.vibrate(20); // Strong haptic
           setMoodIconState('happy');
         } 
      } else if (my > 50) { // DOWN -> Sad
         if (dist > 100 && moodIconState !== 'sad') {
           if (navigator.vibrate) navigator.vibrate(20); 
           setMoodIconState('sad');
         }
      } else {
        setMoodIconState('neutral');
      }

    } else {
      setActiveRail(null);
      setMoodIconState('neutral');
      api.start({ x: 0, y: 0 });

      // Calculate Drop Zone (T-Rail: Up, Down, Left)
      if (my < -50) handleSaveMood('happy');
      else if (my > 50) handleSaveMood('sad');
      else if (mx < -50) handleSaveMood('neutral');
      else {
        // Just Tap -> Save as Note (Neutral) if text exists
        if (text.trim()) handleSaveMood('neutral');
      }
    }
  }, { filterTaps: true });

  // --- SAVE LOGIC ---
  const handleSaveTask = async (priority: string) => {
    if (!text.trim()) return;
    const parsed = parseInputText(text);
    const id = uuidv4();
    const now = Date.now();
    
    // Check Echo (5 min rule) - Simplistic check last entry
    const lastEntry = await db.tasks.orderBy('createdAt').last();
    const isLinked = lastEntry && (now - lastEntry.createdAt < 5 * 60 * 1000);

    const newTask = {
      id,
      type: 'task',
      content: parsed.content,
      quantity: parsed.quantity,
      unit: parsed.unit,
      status: 'todo',
      priority,
      createdAt: now,
      updatedAt: now,
      wordCount: text.split(' ').length,
      linkedIds: isLinked ? [lastEntry.id] : [],
    };

    await db.tasks.add(newTask as any);
    useUserStore.getState().performAction('todo_new'); // Trigger Gamification
    
    // Reset UI
    setText('');
    setToast({ visible: true, msg: `Saved Task [${priority}]`, lastId: id, type: 'task' });
  };

  const handleSaveMood = async (val: 'happy' | 'sad' | 'neutral') => {
    const id = uuidv4();
    const now = Date.now();
    
    const newThought = {
      id,
      type: val === 'neutral' && text.trim() ? 'thought' : 'mood',
      content: text,
      moodValue: val,
      createdAt: now,
      updatedAt: now,
      opacity: 1,
      isBookmarked: false,
      wordCount: text.split(' ').length,
    };

    await db.thoughts.add(newThought as any);
    useUserStore.getState().performAction(val === 'neutral' ? 'thought' : 'identity_fill'); // Approximate mapping
    
    setText('');
    setToast({ visible: true, msg: `Saved ${val.toUpperCase()}`, lastId: id, type: 'thought' });
  };

  // --- RENDER HELPERS ---
  const isGhost = activeRail !== null; // Blur text when dragging

  return (
    <>
      {/* --- 1. MAIN INPUT CONTAINER --- */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex items-end gap-3 max-w-lg mx-auto">
        
        {/* TEXT AREA */}
        <div className={clsx(
          "flex-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 overflow-hidden",
          isGhost && "opacity-20 blur-sm scale-95" // Ghost Mode
        )}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setIsTyping(e.target.value.length > 0);
              setGlobalTyping(typing); // [NEW] Global state cho Focus module
              if (toast.visible) setToast({ ...toast, visible: false }); // Hide toast on typing
            }}
            placeholder="What's on your mind?"
            className="w-full p-4 bg-transparent outline-none resize-none max-h-32 text-slate-800 placeholder:text-slate-400"
            rows={1}
            style={{ minHeight: '3.5rem' }}
          />
        </div>

        {/* --- 2. SATELLITE ANCHORS --- */}
        <div className="relative flex gap-2 h-14">
          
          {/* A. TASK BUTTON (X-RAIL) */}
          <div className="relative">
            {/* The Rail (Behind Button) */}
            <AnimatePresence>
              {activeRail === 'task' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none"
                >
                  {/* Visual Guide X-Shape */}
                  <div className="absolute top-0 left-0 text-slate-400 text-xs font-bold">Urgent</div>
                  <div className="absolute top-0 right-0 text-slate-400 text-xs font-bold">Normal</div>
                  <div className="absolute bottom-0 left-0 text-slate-400 text-xs font-bold">Needed</div>
                  <div className="absolute bottom-0 right-0 text-red-400 text-xs font-bold">Critical</div>
                  <div className="absolute inset-0 border-2 border-dashed border-slate-300 rounded-full opacity-30" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Button */}
            <motion.div
              {...bindTask()}
              style={{ x: activeRail === 'task' ? x : 0, y: activeRail === 'task' ? y : 0, touchAction: 'none' }}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-opacity z-10",
                activeRail === 'task' ? "bg-blue-600 text-white" : "bg-white text-slate-700",
                activeRail === 'mood' && "opacity-30" // Fade out if other rail active
              )}
            >
               <Plus size={24} />
            </motion.div>
          </div>

          {/* B. MOOD/SAVE BUTTON (T-RAIL) */}
          <div className="relative">
             {/* The Rail */}
             <AnimatePresence>
              {activeRail === 'mood' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-60 pointer-events-none"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 text-green-500 font-bold">Happy</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-500 font-bold">Sad</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-purple-500 font-bold">Note</div>
                  <div className="absolute inset-x-[45%] top-0 bottom-0 bg-slate-200/50 -z-10 rounded-full" /> {/* Vertical Line */}
                  <div className="absolute inset-y-[45%] left-0 right-[45%] bg-slate-200/50 -z-10 rounded-full" /> {/* Horizontal Line */}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              {...bindMood()}
              style={{ x: activeRail === 'mood' ? x : 0, y: activeRail === 'mood' ? y : 0, touchAction: 'none' }}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-10",
                activeRail === 'mood' ? "bg-purple-600 text-white" : "bg-blue-600 text-white",
                activeRail === 'task' && "opacity-30"
              )}
            >
              {/* Morphing Icons */}
              {moodIconState === 'happy' ? <Smile size={28} /> : 
               moodIconState === 'sad' ? <Frown size={28} /> : 
               <Save size={24} />}
            </motion.div>
          </div>

        </div>
      </div>

      {/* --- 3. POST-ACTION TOAST & MODAL --- */}
      <ActionToast 
        visible={toast.visible} 
        message={toast.msg}
        onUndo={async () => {
          if (toast.lastId && toast.type) {
             // Logic Undo: Delete from DB & Restore Text
             const table = toast.type === 'task' ? db.tasks : db.thoughts;
             const item = await table.get(toast.lastId);
             if (item) setText(item.content);
             await table.delete(toast.lastId);
             setToast({ ...toast, visible: false });
          }
        }}
        onEdit={() => {
          setModalOpen(true);
          setToast({ ...toast, visible: false });
        }}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <QuickEditModal 
        isOpen={modalOpen}
        type={toast.type || 'task'}
        initialData={{ content: text }} // In real app, fetch full data from DB using lastId
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          // Implement update logic here
          console.log("Updated:", data);
          setModalOpen(false);
        }}
      />
    </>
  );
};