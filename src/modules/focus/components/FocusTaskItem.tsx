// src/modules/focus/components/FocusTaskItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion, useAnimation } from 'framer-motion';
import { Check, X, GripHorizontal, Flame } from 'lucide-react';
import clsx from 'clsx';
import { Task } from '../../../database/types';
import { db } from '../../../database/db';
import { useUserStore } from '../../../store/userStore';

interface FocusTaskItemProps {
  task: Task;
}

export const FocusTaskItem: React.FC<FocusTaskItemProps> = ({ task }) => {
  // --- STATE ---
  const [progress, setProgress] = useState(task.progress || 0);
  const target = task.quantity || 1;
  const isQuantitative = target > 1;
  
  // Refs cho logic Hold-to-Fill
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  // --- LOGIC: COMPLETION ---
  const handleComplete = async () => {
    // 1. Haptic Feedback mạnh
    if (navigator.vibrate) navigator.vibrate(50);
    
    // 2. Animation Out
    await controls.start({ opacity: 0, x: 100, transition: { duration: 0.3 } });

    // 3. Update DB & Gamification
    await db.tasks.update(task.id, { 
      status: 'completed', 
      completedAt: Date.now(),
      progress: target // Force full progress
    });
    
    // 4. Trigger CME Points (Todo Done)
    useUserStore.getState().performAction('todo_done');
  };

  const handleDismiss = async () => {
    await db.tasks.update(task.id, { status: 'todo' }); // Trả về Saban/Later
  };

  // --- LOGIC: TACTILE ENGINE (Dial / Hold / Tap) ---
  
  // 1. Dial Logic (Drag Y)
  const bindDrag = useDrag(({ movement: [_, my], down, memo = progress }) => {
    if (!isQuantitative) return;
    
    if (down) {
      // Prevent Scroll on Mobile when dragging dial
      document.body.style.overflow = 'hidden'; 

      // Formula: 15px = 1 unit
      const diff = Math.floor(my / -15); // Kéo lên (âm) là tăng, kéo xuống (dương) là giảm
      let newVal = memo + diff;
      newVal = Math.max(0, Math.min(target, newVal)); // Clamp
      
      if (newVal !== progress) {
        setProgress(newVal);
        if (navigator.vibrate) navigator.vibrate(10); // Haptic nhẹ
      }
      return memo;
    } else {
      // Commit DB on release
      document.body.style.overflow = '';
      db.tasks.update(task.id, { progress });
      
      // Auto-complete check
      if (progress >= target) handleComplete();
    }
  }, { 
    axis: 'y', 
    filterTaps: true,
    pointer: { touch: true }
  });

  // 2. Hold Logic (Long Press)
  const startHold = () => {
    if (!isQuantitative || progress >= target) return;
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (navigator.vibrate) navigator.vibrate(10);
        
        if (next >= target) {
          stopHold(); // Stop at max
          handleComplete(); // Auto complete
          return target;
        }
        return next;
      });
    }, 150); // Speed: 150ms
  };

  const stopHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      db.tasks.update(task.id, { progress }); // Commit
    }
  };

  // 3. Tap Logic (Simple Increment)
  const handleTap = () => {
    if (isQuantitative && target <= 10 && progress < target) {
      const next = progress + 1;
      setProgress(next);
      if (navigator.vibrate) navigator.vibrate(10);
      db.tasks.update(task.id, { progress: next });
      if (next >= target) handleComplete();
    }
  };

  // Sync state if DB changes externally
  useEffect(() => {
    setProgress(task.progress || 0);
  }, [task.progress]);

  // Priority Styles
  const priorityColors = {
    critical: 'border-l-red-500 bg-red-50/50',
    urgent: 'border-l-orange-500 bg-orange-50/50',
    important: 'border-l-blue-500 bg-blue-50/50',
    normal: 'border-l-slate-300 bg-white'
  };

  // Progress Bar Width
  const progressPercent = Math.min(100, (progress / target) * 100);

  return (
    <motion.div
      animate={controls}
      layout // Framer Motion auto layout animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "relative w-full rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none touch-pan-x",
        priorityColors[task.priority] || priorityColors.normal,
        "border-l-4"
      )}
    >
      {/* BACKGROUND PROGRESS BAR */}
      {isQuantitative && (
        <motion.div 
          className="absolute inset-0 bg-blue-100/50 z-0 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progressPercent / 100 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      )}

      <div className="relative z-10 flex items-center p-4 min-h-[4rem]">
        {/* CHECKBOX / STATUS */}
        <button 
          onClick={handleComplete}
          className="mr-4 w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors shrink-0"
        >
          {progress >= target && <Check size={14} className="text-blue-600" />}
        </button>

        {/* CONTENT */}
        <div className="flex-1 mr-4">
          <div className="font-medium text-slate-800 line-clamp-2 leading-tight">
            {task.content}
          </div>
          
          {/* Metadata Row */}
          <div className="flex items-center gap-2 mt-1">
            {isQuantitative && (
              <div className="text-xs font-bold text-blue-600">
                {progress} / {target} {task.unit}
              </div>
            )}
            
            {/* Streak Indicator (if applicable) */}
            {task.isRecurring && task.streak_current !== undefined && (
              <div className="flex items-center gap-0.5 text-[10px] text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded-full">
                <Flame size={10} className="fill-orange-500" />
                {task.streak_current}
              </div>
            )}
          </div>
        </div>

        {/* INTERACTION ZONE (Quantitative) */}
        {isQuantitative ? (
          <div 
            {...bindDrag()} // Dial Logic
            onPointerDown={startHold} // Hold Logic
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onClick={handleTap} // Tap Logic
            className="w-12 h-12 flex items-center justify-center bg-white/50 rounded-lg border border-slate-200 shadow-sm cursor-ns-resize touch-none active:scale-95 transition-transform"
          >
             <span className="text-lg font-bold text-slate-700">{progress}</span>
          </div>
        ) : (
          /* Dismiss Button for Simple Tasks */
          <button 
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
};