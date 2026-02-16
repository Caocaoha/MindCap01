import React, { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [INTERFACE]: Định nghĩa các tùy chọn cấu hình cho nút cử chỉ.
 */
interface GestureButtonProps {
  type: 'task' | 'thought';
  label?: string; // Nhãn hiển thị (nếu có)
  
  // Callbacks tương tác
  onInteractionStart: () => void; // Báo hiệu bắt đầu kéo (để làm mờ nút kia)
  onInteractionEnd: () => void;   // Báo hiệu kết thúc (để sáng lại)
  
  // Callback trả về kết quả
  // Task: trả về tags (vd: ['p:urgent', 'p:important'])
  // Thought: trả về mood score (1-5) và label
  onSelect: (result: any) => void;
  
  // Trạng thái hiển thị từ cha (để làm mờ khi nút kia đang active)
  isDimmed?: boolean;
}

/**
 * [COMPONENT]: Gesture Button v2.0 - Step-by-step Disclosure.
 * Tích hợp X-Rail (Task) và T-Rail (Thought) với phản hồi xúc giác tăng dần.
 */
export const GestureButton: React.FC<GestureButtonProps> = ({ 
  type, 
  label, 
  onInteractionStart, 
  onInteractionEnd, 
  onSelect,
  isDimmed = false 
}) => {
  // --- PHYSICS STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Vị trí Knob tương đối với tâm
  const [activeDirection, setActiveDirection] = useState<string | null>(null); // Hướng đang chọn
  const [feedbackLevel, setFeedbackLevel] = useState<0 | 1 | 2>(0); // Cấp độ phản hồi (cho Thought)

  // Refs để tính toán toạ độ không gây re-render
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // --- HAPTIC THRESHOLDS ---
  const LEVEL_1_THRESHOLD = 50;  // 50px: Rung nhẹ
  const LEVEL_2_THRESHOLD = 100; // 100px: Rung mạnh

  /**
   * [HANDLER]: Bắt đầu chạm
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer để theo dõi khi di chuyển ra ngoài vùng div
    (e.target as Element).setPointerCapture(e.pointerId);

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    onInteractionStart();
    triggerHaptic('light');
  };

  /**
   * [HANDLER]: Di chuyển (Tính toán Logic X-Rail / T-Rail)
   */
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !startPosRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cập nhật vị trí Knob (giới hạn bán kính tối đa 120px để không bay quá xa)
    const maxRadius = 130;
    const scale = distance > maxRadius ? maxRadius / distance : 1;
    setPosition({ x: dx * scale, y: dy * scale });

    // --- LOGIC PHÂN TÍCH HƯỚNG ---
    let newDirection: string | null = null;

    if (distance > 20) { // Deadzone 20px
      if (type === 'task') {
        // X-Rail: Phân tích 4 góc phần tư
        if (dx < 0 && dy < 0) newDirection = 'ul'; // Urgent + Important
        else if (dx > 0 && dy < 0) newDirection = 'ur'; // Urgent
        else if (dx < 0 && dy > 0) newDirection = 'dl'; // Important
        else if (dx > 0 && dy > 0) newDirection = 'dr'; // Normal
      } else {
        // T-Rail: Phân tích 3 hướng (Up, Down, Left)
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) newDirection = 'left'; // Neutral
          // Bỏ nhánh phải (Right) theo yêu cầu
        } else {
          if (dy < 0) newDirection = 'up';   // Happy
          else newDirection = 'down';        // Sad
        }
      }
    }

    if (newDirection !== activeDirection) {
      setActiveDirection(newDirection);
      if (newDirection) triggerHaptic('light'); // Rung nhẹ khi chuyển hướng
    }

    // --- LOGIC PROGRESSIVE FEEDBACK (Chỉ cho Thought) ---
    if (type === 'thought') {
      let newLevel: 0 | 1 | 2 = 0;
      if (distance > LEVEL_2_THRESHOLD) newLevel = 2;
      else if (distance > LEVEL_1_THRESHOLD) newLevel = 1;

      if (newLevel !== feedbackLevel) {
        setFeedbackLevel(newLevel);
        // Rung phản hồi khi đạt cấp độ mới
        if (newLevel > feedbackLevel) {
           triggerHaptic(newLevel === 2 ? 'medium' : 'light');
        }
      }
    }
  };

  /**
   * [HANDLER]: Kết thúc chạm (Xử lý chọn hoặc Hủy)
   */
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Xử lý kết quả nếu có hướng đã chọn
    if (activeDirection) {
      triggerHaptic('success');
      
      if (type === 'task') {
        // Map hướng sang Tags
        const tags = [];
        if (activeDirection === 'ul') tags.push('p:urgent', 'p:important');
        if (activeDirection === 'ur') tags.push('p:urgent');
        if (activeDirection === 'dl') tags.push('p:important');
        // 'dr' là Normal, không thêm tag
        onSelect({ type: 'task', tags });
      } else {
        // Map hướng & Level sang Mood Score
        // Base scores: Up=4, Down=2, Left=3
        let score = 3; 
        if (activeDirection === 'up') score = 4;
        if (activeDirection === 'down') score = 2;
        
        // Bonus từ Progressive Feedback
        // Level 2 (Kéo xa): Cực vui (5) hoặc Cực buồn (1)
        if (feedbackLevel === 2) {
          if (activeDirection === 'up') score = 5;
          if (activeDirection === 'down') score = 1;
        }
        
        onSelect({ type: 'thought', moodScore: score });
      }
    } else {
      // Tap (không kéo): Chọn mặc định
      onSelect(type === 'task' ? { type: 'task', tags: [] } : { type: 'thought', moodScore: 3 });
    }

    // Reset State
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setActiveDirection(null);
    setFeedbackLevel(0);
    onInteractionEnd();
  };

  // --- RENDER HELPERS ---

  // Icon hiển thị trên Knob
  const renderIcon = () => {
    if (type === 'task') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    } else {
      // Logic biến đổi Icon theo Level cho Thought
      if (activeDirection === 'up') {
        return feedbackLevel === 2 ? <span className="text-2xl">🤩</span> : <span className="text-2xl">😊</span>;
      }
      if (activeDirection === 'down') {
        return feedbackLevel === 2 ? <span className="text-2xl">😭</span> : <span className="text-2xl">😔</span>;
      }
      if (activeDirection === 'left') {
        return <span className="text-2xl">😐</span>;
      }
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* --- RAIL SYSTEM (Chỉ hiện khi Drag) --- */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-200">
          {/* Vòng tròn tâm */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-200 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {type === 'task' ? (
            // X-RAIL
            <>
              {/* Trục chéo 1 (\) */}
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 rotate-45" />
              {/* Trục chéo 2 (/) */}
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
              
              {/* Labels 4 góc */}
              <div className={`absolute top-0 left-0 text-[9px] font-bold uppercase ${activeDirection === 'ul' ? 'text-red-500 scale-110' : 'text-slate-300'}`}>Urgent+Imp</div>
              <div className={`absolute top-0 right-0 text-[9px] font-bold uppercase ${activeDirection === 'ur' ? 'text-orange-500 scale-110' : 'text-slate-300'}`}>Urgent</div>
              <div className={`absolute bottom-0 left-0 text-[9px] font-bold uppercase ${activeDirection === 'dl' ? 'text-blue-500 scale-110' : 'text-slate-300'}`}>Important</div>
              <div className={`absolute bottom-0 right-0 text-[9px] font-bold uppercase ${activeDirection === 'dr' ? 'text-slate-500 scale-110' : 'text-slate-300'}`}>Task</div>
            </>
          ) : (
            // T-RAIL (Bỏ nhánh phải)
            <>
              {/* Trục dọc (|) */}
              <div className="absolute top-[-40px] left-1/2 w-[2px] h-[160px] bg-slate-100 -translate-x-1/2" />
              {/* Trục ngang (-) - Chỉ sang trái */}
              <div className="absolute top-1/2 right-1/2 w-[80px] h-[2px] bg-slate-100 -translate-y-1/2" />

              {/* Labels 3 hướng */}
              <div className={`absolute top-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase ${activeDirection === 'up' ? 'text-green-500 scale-110' : 'text-slate-300'}`}>
                {feedbackLevel === 2 ? 'Great!' : 'Good'}
              </div>
              <div className={`absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase ${activeDirection === 'down' ? 'text-slate-600 scale-110' : 'text-slate-300'}`}>
                {feedbackLevel === 2 ? 'Bad...' : 'Sad'}
              </div>
              <div className={`absolute top-1/2 left-[-30px] -translate-y-1/2 text-[9px] font-bold uppercase ${activeDirection === 'left' ? 'text-purple-500 scale-110' : 'text-slate-300'}`}>Note</div>
            </>
          )}
        </div>
      )}

      {/* --- GESTURE KNOB (Nút bấm) --- */}
      <div
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          opacity: isDimmed ? 0.3 : 1, // Làm mờ khi nút kia đang active
        }}
        className={`relative z-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-75 touch-none cursor-grab active:cursor-grabbing ${
          type === 'task' 
            ? 'bg-[#2563EB] text-white shadow-blue-500/30' 
            : 'bg-white text-slate-600 border border-slate-200 shadow-slate-200/50'
        } ${activeDirection ? 'scale-110 ring-4 ring-opacity-20' : ''} ${
          // Màu ring theo hướng active
          activeDirection === 'ul' || activeDirection === 'ur' ? 'ring-red-500' :
          activeDirection === 'up' ? 'ring-green-500' :
          activeDirection === 'down' ? 'ring-slate-500' :
          activeDirection === 'left' ? 'ring-purple-500' : 'ring-blue-500'
        }`}
      >
        {renderIcon()}
      </div>

      {/* Label tĩnh dưới nút (Chỉ hiện khi không drag) */}
      {!isDragging && label && (
        <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-opacity ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          {label}
        </span>
      )}
    </div>
  );
};