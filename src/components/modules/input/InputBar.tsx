import React, { useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { 
  Zap,        // Icon cho Task
  Send,       // Icon cho Mood/Save
  Heart,      // Icon Happy
  Frown,      // Icon Sad
  Minus,      // Icon Neutral
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowUpLeft, 
  ArrowDownLeft 
} from 'lucide-react'; 

// --- IMPORTS TỪ SOURCE CỦA BẠN ---
import { useInputStore, RailZone } from '../../../store/inputStore';
import { useInputLogic } from '../../../hooks/useInputLogic';

// --- CONSTANTS ---
const DRAG_THRESHOLD = 50; // Kéo quá 50px mới tính là chọn
const HAPTIC_LIGHT = 10;   // Rung nhẹ khi bắt đầu kéo
const HAPTIC_SUCCESS = [20]; // Rung mạnh khi thả thành công

// --- 1. COMPONENT: GHOST RAILS (Đường ray chỉ dẫn - Layer dưới cùng) ---
const GhostRails = () => {
  const { mode, activeRail } = useInputStore();
  
  const isTaskDrag = mode === 'dragging_task';
  const isMoodDrag = mode === 'dragging_mood';

  // Helper: Highlight màu đỏ/xanh khi ngón tay trỏ đúng vùng
  const getZoneStyle = (zoneName: string) => {
    return activeRail === zoneName ? "text-blue-600 scale-125 font-bold" : "text-gray-400";
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0 flex justify-between items-center px-6">
      
      {/* --- TASK RAIL (4 GÓC) --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isTaskDrag ? 1 : 0 }}
        className="relative w-12 h-12"
      >
        {/* Visual Guides: 4 Góc */}
        <div className={`absolute -top-10 -left-10 text-xs transition-all duration-200 flex flex-col items-center ${getZoneStyle('urgent')}`}>
          <ArrowUpLeft size={16}/> Urgent
        </div>
        <div className={`absolute -top-10 -right-10 text-xs transition-all duration-200 flex flex-col items-center ${getZoneStyle('normal')}`}>
          <ArrowUpRight size={16}/> Normal
        </div>
        <div className={`absolute -bottom-10 -left-10 text-xs transition-all duration-200 flex flex-col items-center ${getZoneStyle('needed')}`}>
          Needed <ArrowDownLeft size={16}/>
        </div>
        <div className={`absolute -bottom-10 -right-10 text-xs transition-all duration-200 flex flex-col items-center ${getZoneStyle('critical')}`}>
          Critical <ArrowDownRight size={16}/>
        </div>
        
        {/* Tâm ngắm */}
        <div className="absolute inset-0 border border-dashed border-gray-300 rounded-full opacity-50" />
      </motion.div>

      {/* --- MOOD RAIL (CHỮ T) --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isMoodDrag ? 1 : 0 }}
        className="relative w-12 h-12"
      >
         <div className={`absolute -top-14 left-1/2 -translate-x-1/2 transition-all duration-200 ${getZoneStyle('happy')}`}>
           <Heart size={24} fill={activeRail === 'happy' ? "currentColor" : "none"}/>
         </div>
         <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 transition-all duration-200 ${getZoneStyle('sad')}`}>
           <Frown size={24} />
         </div>
         <div className={`absolute top-1/2 -left-16 -translate-y-1/2 transition-all duration-200 ${getZoneStyle('neutral')}`}>
           <Minus size={24} />
         </div>
         
         {/* Đường trục dọc */}
         <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-200 -z-10 h-[250%] -translate-y-1/2 translate-x-[-0.5px]" />
      </motion.div>
    </div>
  );
};

// --- 2. COMPONENT: ACTION ANCHOR (Nút bấm có thể kéo - Layer trên cùng) ---
interface AnchorProps {
  type: 'task' | 'mood';
  icon: React.ReactNode;
}

const ActionAnchor = ({ type, icon }: AnchorProps) => {
  const { setDragState, reset, mode } = useInputStore();
  const { handleSave } = useInputLogic();

  // Logic tính toán Zone dựa trên tọa độ kéo
  const calculateZone = (x: number, y: number, type: 'task'|'mood'): RailZone => {
    const distance = Math.sqrt(x*x + y*y);
    if (distance < DRAG_THRESHOLD) return null; // Chưa kéo đủ xa

    if (type === 'task') {
        // Phân loại 4 góc phần tư
        if (x < 0 && y < 0) return 'urgent';   // Trên Trái
        if (x > 0 && y < 0) return 'normal';   // Trên Phải
        if (x < 0 && y > 0) return 'needed';   // Dưới Trái
        return 'critical';                     // Dưới Phải (x>0, y>0)
    } else {
        // Phân loại 3 hướng (Lên, Xuống, Trái)
        if (y < -30) return 'happy';
        if (y > 30) return 'sad';
        if (x < -30) return 'neutral';
        return null;
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    const zone = calculateZone(info.offset.x, info.offset.y, type);
    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);

    // Update Store để GhostRails hiển thị feedback
    setDragState(
      type === 'task' ? 'dragging_task' : 'dragging_mood', 
      distance, 
      zone
    );
  };

  const handleDragStart = () => {
    if (navigator.vibrate) navigator.vibrate(HAPTIC_LIGHT);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const finalZone = calculateZone(info.offset.x, info.offset.y, type);

    if (finalZone) {
       // Kéo thành công vào một Zone -> Rung & Lưu
       if (navigator.vibrate) navigator.vibrate(HAPTIC_SUCCESS);
       handleSave(finalZone); // Gọi Logic lưu DB
    } else {
       // Kéo chưa tới -> Reset về vị trí cũ
       reset();
    }
  };

  // Làm mờ nút này nếu nút kia đang được kéo
  const isInactive = (mode === 'dragging_task' && type === 'mood') || 
                     (mode === 'dragging_mood' && type === 'task');

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Snap back
      dragElastic={0.2} // Cảm giác dây thun
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ 
        opacity: isInactive ? 0.3 : 1, 
        scale: isInactive ? 0.8 : 1 
      }}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-30
        ${type === 'task' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'}
      `}
    >
      {icon}
    </motion.div>
  );
};

// --- 3. MAIN COMPONENT: INPUT BAR (Container chính) ---
export const InputBar = () => {
  const { inputText, setInputText, isGhostMode } = useInputStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea khi nội dung thay đổi
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-8 safe-area-bottom">
      <div className="max-w-md mx-auto relative flex items-end gap-4">
        
        {/* Layer 0: Ghost Rails (Chỉ dẫn hướng) */}
        <GhostRails />

        {/* Layer 1: Left Anchor (Task Button) */}
        <div className="relative z-10">
            <ActionAnchor type="task" icon={<Zap size={20} />} />
        </div>

        {/* Layer 2: Input Area (Ở giữa) */}
        <motion.div 
          className="flex-1 relative z-20"
          animate={{ 
            opacity: isGhostMode ? 0.15 : 1, 
            filter: isGhostMode ? 'blur(2px)' : 'none',
            scale: isGhostMode ? 0.95 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mục tiêu hoặc Suy nghĩ..."
            rows={1}
            className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-100 resize-none overflow-hidden text-gray-900 placeholder:text-gray-400 font-medium"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </motion.div>

        {/* Layer 3: Right Anchor (Mood/Save Button) */}
        <div className="relative z-10">
             <ActionAnchor type="mood" icon={<Send size={20} />} />
        </div>

      </div>
    </div>
  );
};