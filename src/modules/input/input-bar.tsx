import React, { useState, useRef, useEffect } from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { useUiStore } from '../../store/ui-store';
import { db } from '../../database/db';
import { nlpEngine } from '../../utils/nlp-engine';
import { GestureButton, Zone } from './components/gesture-button';
import { Plus, CheckCircle2, Zap, AlertTriangle, AlertOctagon, Heart } from 'lucide-react';

// --- CONFIGURATION ZONES ---

// X-Rail (4 Góc) cho Task
const TASK_ZONES: Zone[] = [
  { id: 'urgent', x: -1, y: -1, label: 'Urgent', color: '#f59e0b', baseIcon: '⚡', iconLevel1: <AlertTriangle size={20}/>, iconLevel2: <AlertTriangle size={24}/> },
  { id: 'normal', x: 1, y: -1, label: 'Normal', color: '#3b82f6', baseIcon: '🔵', iconLevel1: <CheckCircle2 size={20}/>, iconLevel2: <CheckCircle2 size={24}/> },
  { id: 'needed', x: -1, y: 1, label: 'Needed', color: '#8b5cf6', baseIcon: '🟣', iconLevel1: <Zap size={20}/>, iconLevel2: <Zap size={24}/> },
  { id: 'critical', x: 1, y: 1, label: 'Critical', color: '#ef4444', baseIcon: '🔴', iconLevel1: <AlertOctagon size={20}/>, iconLevel2: <AlertOctagon size={24}/> },
];

// T-Rail (Bỏ phải) cho Mood - Có Progressive Icons
const MOOD_ZONES: Zone[] = [
  // UP: Happy
  { id: 'happy', x: 0, y: -1, label: 'Happy', color: '#10b981', 
    baseIcon: '⬆️', iconLevel1: '🙂', iconLevel2: '😍' 
  },
  // DOWN: Sad
  { id: 'sad', x: 0, y: 1, label: 'Sad', color: '#6366f1', 
    baseIcon: '⬇️', iconLevel1: '🙁', iconLevel2: '😭' 
  },
  // LEFT: Neutral
  { id: 'neutral', x: -1, y: 0, label: 'Neutral', color: '#a855f7', // Tím
    baseIcon: '⬅️', iconLevel1: '😐', iconLevel2: '🤔' 
  },
];

export const InputBar: React.FC = () => {
  const [content, setContent] = useState('');
  
  // State quản lý việc làm mờ đối thủ
  const [isTaskDragging, setIsTaskDragging] = useState(false);
  const [isMoodDragging, setIsMoodDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addEntry } = useJourneyStore();
  const { setInputMode, isInputMode } = useUiStore();

  // Resize Textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const processSubmission = async (type: 'task' | 'mood', zoneId: string) => {
    const rawText = content.trim();
    // Logic xử lý submit (giữ nguyên như trước, chỉ cập nhật icon/score map nếu cần)
    const now = new Date();
    
    if (type === 'task') {
       if (!rawText) return;
       const nlpData = nlpEngine.extractTokens(rawText);
       // ... Logic Echo Linker ...
       const newTask = {
         title: nlpData.cleanContent,
         status: 'pending',
         createdAt: now,
         priority: zoneId,
         tags: [...nlpData.tags, zoneId],
         isFocusMode: zoneId === 'critical',
         frequency: 'ONCE', streakCurrent: 0, streakRecoveryCount: 0
       };
       const id = await db.tasks.add(newTask as any);
       addEntry({ ...newTask, id } as any);
    } else {
       // Mood Logic
       const scoreMap: Record<string, number> = { 'happy': 2, 'sad': -2, 'neutral': 0 };
       const newMood = {
         score: scoreMap[zoneId] || 0,
         label: zoneId,
         note: rawText,
         createdAt: now
       };
       await db.moods.add(newMood);
    }

    // Reset
    setContent('');
    setInputMode(false);
    textareaRef.current?.blur();
  };

  return (
    // CONTAINER: Vị trí thay đổi dựa trên isInputMode
    // - isInputMode: Fixed top (Bám Header)
    // - !isInputMode: Absolute bottom (Bám Footer)
    <div 
      className={`
        w-full px-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isInputMode ? 'fixed top-20 z-50' : 'absolute bottom-4 z-10'}
      `}
    >
      <div className="relative w-full max-w-2xl mx-auto">
        
        {/* 1. TEXTAREA CONTAINER */}
        <div className={`
          bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-50 transition-all duration-300
          ${isMoodDragging ? 'opacity-30 scale-95 blur-[1px]' : 'opacity-100 scale-100'} 
        `}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setInputMode(true)}
            onBlur={() => {
              // Delay nhỏ để tránh flicker khi touch
              if (!content) setTimeout(() => setInputMode(false), 200);
            }}
            placeholder={isInputMode ? "Type..." : "Tap to write"}
            className="w-full p-4 text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none min-h-[60px] max-h-[160px]"
          />
        </div>

        {/* 2. BUTTONS ROW (Nằm dưới Textarea) */}
        {/* Chỉ hiện rõ khi có nội dung hoặc đang focus, mờ đi khi idle */}
        <div className={`
          flex items-start mt-4 transition-all duration-300
          ${isInputMode || content ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-2'}
        `}>
          
          {/* TASK BUTTON (Giữa) */}
          <div className="flex-1 flex justify-center">
            <GestureButton
              baseIcon={<Plus size={28} strokeWidth={2.5} />}
              baseColor="#4f46e5" // Indigo
              zones={TASK_ZONES}
              onDragStateChange={setIsTaskDragging}
              onTrigger={(zone) => processSubmission('task', zone)}
              // Bị mờ khi nút Mood đang kéo
              isDimmed={isMoodDragging}
            />
          </div>

          {/* MOOD / TEXT BUTTON (Bên Phải) */}
          <div className="flex-none mr-2">
            <GestureButton
              baseIcon={<Heart size={24} />}
              baseColor="#ec4899" // Pink
              zones={MOOD_ZONES}
              onDragStateChange={setIsMoodDragging}
              onTrigger={(zone) => processSubmission('mood', zone)}
              // Bị mờ khi nút Task đang kéo
              isDimmed={isTaskDragging}
            />
          </div>

        </div>

        {/* Gợi ý chữ (Helper Text) khi kéo */}
        {(isTaskDragging || isMoodDragging) && (
           <div className="absolute -bottom-10 left-0 right-0 text-center text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
             {isTaskDragging ? 'Release to select Priority' : 'Release to log Mood'}
           </div>
        )}

      </div>
      
      {/* OVERLAY BACKDROP (Khi Input Mode -> Che mờ nội dung phía sau) */}
      {isInputMode && (
         <div 
           className="fixed inset-0 bg-white/80 backdrop-blur-sm -z-10 animate-in fade-in duration-300" 
           onClick={() => {
             setInputMode(false);
             textareaRef.current?.blur();
           }}
         />
      )}
    </div>
  );
};