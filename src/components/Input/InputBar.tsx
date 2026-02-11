import React, { useState, useRef } from 'react';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { Zap, AlignLeft, Smile, Frown, Minus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../database/db';
import { v4 as uuidv4 } from 'uuid';
import { Task, Thought } from '../../database/types';

// --- CONFIG ---
const THRESHOLD_1 = 50;
const THRESHOLD_2 = 100;

export const InputBar = () => {
  // State
  const [content, setContent] = useState('');
  const isTyping = useUIStore((state) => state.isTyping);
  const setTyping = useUIStore((state) => state.setTyping);
  
  // Drag State
  const [activeAnchor, setActiveAnchor] = useState<'task' | 'mood' | null>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [dragCoords, setDragCoords] = useState({ x: 0, y: 0 });

  // Refs & Animations
  const lastHaptic = useRef<number>(0);
  const taskControls = useAnimation();
  const moodControls = useAnimation();

  // --- LOGIC HAPTIC & FEEDBACK ---
  const triggerHaptic = (dist: number) => {
    if (!navigator.vibrate) return;
    const now = Date.now();
    if (now - lastHaptic.current < 200) return;

    if (dist > THRESHOLD_2) {
      navigator.vibrate(20);
      lastHaptic.current = now;
    } else if (dist > THRESHOLD_1) {
      navigator.vibrate(10);
      lastHaptic.current = now;
    }
  };

  // --- LOGIC MAPPING ---
  const getTaskZone = (x: number, y: number) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle >= -180 && angle < -90) return { label: 'NORMAL', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (angle >= -90 && angle < 0) return { label: 'URGENT', color: 'text-orange-500', bg: 'bg-orange-100' };
    if (angle >= 0 && angle <= 90) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-100' };
    return { label: 'NEEDED', color: 'text-purple-500', bg: 'bg-purple-100' };
  };

  const getMoodZone = (x: number, y: number) => {
    if (y < -THRESHOLD_1) return { type: 'happy', icon: Smile, color: 'text-green-500', bg: 'bg-green-100' };
    if (y > THRESHOLD_1) return { type: 'sad', icon: Frown, color: 'text-slate-500', bg: 'bg-slate-100' };
    if (x < -THRESHOLD_1) return { type: 'neutral', icon: Minus, color: 'text-purple-500', bg: 'bg-purple-100' };
    return { type: 'note', icon: AlignLeft, color: 'text-slate-400', bg: 'bg-slate-50' };
  };

  // --- HANDLERS ---
  const handleDragStart = (type: 'task' | 'mood') => {
    setActiveAnchor(type);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    setDragDistance(dist);
    setDragCoords({ x: info.offset.x, y: info.offset.y });
    triggerHaptic(dist);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const { x, y } = info.offset;

    if (dist < THRESHOLD_1) {
      taskControls.start({ x: 0, y: 0 });
      moodControls.start({ x: 0, y: 0 });
      setActiveAnchor(null);
      setDragDistance(0);
      return;
    }

    if (activeAnchor === 'task' && content.trim()) {
      const zone = getTaskZone(x, y);
      await db.tasks.add({
        id: uuidv4(), type: 'task', content, status: 'todo', 
        priority: zone.label.toLowerCase() as any, 
        createdAt: Date.now(), updatedAt: Date.now(), tags: [], linkedIds: []
      } as Task);
      
      setContent('');
      setTyping(false);
    } 
    else if (activeAnchor === 'mood') {
      const zone = getMoodZone(x, y);
      const moodVal = zone.type === 'happy' ? 5 : zone.type === 'sad' ? 1 : 3;
      
      await db.thoughts.add({
        id: uuidv4(), type: 'thought', 
        content: content || `Feeling ${zone.type}`,
        moodValue: moodVal, opacity: 1,
        createdAt: Date.now(), updatedAt: Date.now(), tags: [], linkedIds: []
      } as Thought);
      
      setContent('');
      if(content) setTyping(false);
    }

    taskControls.start({ x: 0, y: 0 });
    moodControls.start({ x: 0, y: 0 });
    setActiveAnchor(null);
    setDragDistance(0);
  };

  const renderMoodIcon = () => {
    const zone = getMoodZone(dragCoords.x, dragCoords.y);
    const Icon = zone.icon;
    
    if (dragDistance > THRESHOLD_2) {
      if (zone.type === 'happy') return <Smile size={28} strokeWidth={2.5} className="animate-bounce" />;
      if (zone.type === 'sad') return <Frown size={28} strokeWidth={2.5} className="animate-pulse" />;
    }
    return <Icon size={24} />;
  };

  // Logic màu nền động cho Mood
  const getMoodBgColor = () => {
      if (activeAnchor === 'mood' && dragDistance > THRESHOLD_1) {
          const zone = getMoodZone(dragCoords.x, dragCoords.y);
          // Map class Tailwind sang mã màu Hex tương đối (vì inline style cần hex/rgb)
          if (zone.bg === 'bg-green-100') return '#dcfce7';
          if (zone.bg === 'bg-slate-100') return '#f1f5f9';
          if (zone.bg === 'bg-purple-100') return '#f3e8ff';
      }
      return '#fff';
  };

  return (
    <>
      {isTyping && (
        <div 
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[-1]"
          onClick={() => setTyping(false)}
        />
      )}

      <div className={`w-full px-4 transition-all duration-500 flex flex-col items-center ${isTyping ? 'h-full pt-4' : 'h-auto pb-6'}`}>
        
        <textarea
          value={content}
          onFocus={() => setTyping(true)}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className={`w-full bg-slate-100 rounded-3xl p-4 text-lg resize-none focus:outline-none focus:ring-0 focus:bg-white transition-all shadow-sm ${
            isTyping ? 'flex-1 shadow-none bg-transparent text-2xl placeholder:text-slate-300' : 'h-12 text-sm'
          }`}
        />

        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full flex justify-center gap-12 mt-8 pb-10 relative"
            >
              
              {/* TASK ANCHOR */}
              <div className="relative flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  animate={{ opacity: activeAnchor === 'task' ? 1 : 0, scale: activeAnchor === 'task' ? 1 : 0.5 }}
                >
                   <div className="w-[1px] h-32 bg-slate-200 absolute" />
                   <div className="h-[1px] w-32 bg-slate-200 absolute" />
                   <span className="absolute -top-16 -left-16 text-[9px] font-bold text-slate-300">NORMAL</span>
                   <span className="absolute -top-16 left-16 text-[9px] font-bold text-slate-300">URGENT</span>
                   <span className="absolute top-16 left-16 text-[9px] font-bold text-slate-300">CRIT</span>
                   <span className="absolute top-16 -left-16 text-[9px] font-bold text-slate-300">NEED</span>
                </motion.div>

                <motion.div
                  drag
                  dragElastic={0.1}
                  dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  animate={taskControls}
                  onDragStart={() => handleDragStart('task')}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className={`w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl z-10 cursor-grab active:cursor-grabbing ${
                    activeAnchor === 'mood' ? 'opacity-20 blur-sm scale-90' : 'opacity-100 scale-100'
                  }`}
                >
                  <Zap size={24} fill="currentColor" />
                </motion.div>
              </div>

              {/* MOOD ANCHOR */}
              <div className="relative flex items-center justify-center">
                <motion.div 
                   className="absolute inset-0 flex items-center justify-center pointer-events-none"
                   animate={{ opacity: activeAnchor === 'mood' ? 1 : 0, scale: activeAnchor === 'mood' ? 1 : 0.5 }}
                >
                   <div className="w-[1px] h-32 bg-slate-200 absolute" />
                   <div className="h-[1px] w-16 bg-slate-200 absolute -left-8" />
                   
                   <div className="absolute -top-16"><Smile size={16} className="text-green-400" /></div>
                   <div className="absolute top-16"><Frown size={16} className="text-slate-400" /></div>
                   <div className="absolute -left-16"><Minus size={16} className="text-purple-400" /></div>
                </motion.div>

                <motion.div
                  drag
                  dragElastic={0.1}
                  dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  animate={moodControls}
                  onDragStart={() => handleDragStart('mood')}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className={`w-14 h-14 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center shadow-xl z-10 cursor-grab active:cursor-grabbing ${
                    activeAnchor === 'task' ? 'opacity-20 blur-sm scale-90' : 'opacity-100 scale-100'
                  }`}
                  style={{ backgroundColor: getMoodBgColor() }}
                >
                  {activeAnchor === 'mood' ? renderMoodIcon() : <AlignLeft size={24} />}
                </motion.div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};