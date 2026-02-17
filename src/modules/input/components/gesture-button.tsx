import React, { useState, useEffect } from 'react';
import { useGestureLogic } from './use-gesture-logic';

/**
 * Purpose: Hiển thị Gesture Button với phản hồi thị giác cường điệu (Visual Snap).
 * Inputs: GestureButtonProps (type, label, events).
 * Outputs: JSX.Element.
 * Business Rule:
 * - Visual Snap: Kích hoạt animation 'pop' (scale up) khi feedbackLevel tăng.
 * - Flash Effect: Chớp sáng trắng khi đạt Level 2 (Lock) để báo hiệu đã khóa mục tiêu.
 */

interface GestureButtonProps {
  type: 'task' | 'thought';
  label?: string;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onSelect: (result: any) => void;
  isDimmed?: boolean;
}

export const GestureButton: React.FC<GestureButtonProps> = (props) => {
  const { type, label, isDimmed } = props;
  const { isDragging, position, activeDirection, feedbackLevel, handlers } = useGestureLogic(props);
  
  // State quản lý hiệu ứng nảy (Pop animation)
  const [snapState, setSnapState] = useState<'none' | 'pop' | 'flash'>('none');

  // Effect: Kích hoạt Visual Snap khi mức độ phản hồi thay đổi
  useEffect(() => {
    if (feedbackLevel === 0) {
      setSnapState('none');
      return;
    }
    // Level 1 -> Pop nhẹ | Level 2 -> Flash mạnh
    setSnapState(feedbackLevel === 2 ? 'flash' : 'pop');
    
    // Reset hiệu ứng sau 150ms để tạo cảm giác "nảy"
    const timer = setTimeout(() => setSnapState('none'), 150);
    return () => clearTimeout(timer);
  }, [feedbackLevel]);

  // Helper: Chọn icon
  const renderIcon = () => {
    if (type === 'task') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    }
    // Thought Icons based on direction & intensity
    if (activeDirection === 'up') return feedbackLevel === 2 ? <span className="text-2xl">🤩</span> : <span className="text-2xl">😊</span>;
    if (activeDirection === 'down') return feedbackLevel === 2 ? <span className="text-2xl">😭</span> : <span className="text-2xl">😔</span>;
    if (activeDirection === 'left') return <span className="text-2xl">😐</span>;
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  };

  // Helper: Chọn màu vòng Ring
  const getRingColor = () => {
    if (!activeDirection) return 'ring-blue-500';
    if (['ul', 'ur'].includes(activeDirection)) return 'ring-red-500';
    if (activeDirection === 'up') return 'ring-green-500';
    if (activeDirection === 'down') return 'ring-slate-500';
    if (activeDirection === 'left') return 'ring-purple-500';
    return 'ring-blue-500';
  };

  // Tính toán Scale Class dựa trên trạng thái Snap
  const getScaleClass = () => {
    if (snapState === 'flash') return 'scale-125'; // Nảy mạnh khi Lock
    if (snapState === 'pop') return 'scale-110';   // Nảy nhẹ khi vào vùng
    if (activeDirection) return 'scale-105';       // Giữ hơi to khi đang chọn
    return 'scale-100';
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* --- RAIL SYSTEM (Chỉ hiện khi Drag) --- */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-200">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-200 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {type === 'task' ? (
            <>
              {/* X-Rail */}
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 rotate-45" />
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
              {/* Labels */}
              <div className={`absolute top-0 left-0 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'ul' ? 'text-red-500 scale-125' : 'text-slate-300'}`}>Urgent+Imp</div>
              <div className={`absolute top-0 right-0 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'ur' ? 'text-orange-500 scale-125' : 'text-slate-300'}`}>Urgent</div>
              <div className={`absolute bottom-0 left-0 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'dl' ? 'text-blue-500 scale-125' : 'text-slate-300'}`}>Important</div>
            </>
          ) : (
            <>
              {/* T-Rail */}
              <div className="absolute top-[-40px] left-1/2 w-[2px] h-[160px] bg-slate-100 -translate-x-1/2" />
              <div className="absolute top-1/2 right-1/2 w-[80px] h-[2px] bg-slate-100 -translate-y-1/2" />
              {/* Labels */}
              <div className={`absolute top-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'up' ? 'text-green-500 scale-125' : 'text-slate-300'}`}>
                {feedbackLevel === 2 ? 'Great!' : 'Good'}
              </div>
              <div className={`absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'down' ? 'text-slate-600 scale-125' : 'text-slate-300'}`}>
                {feedbackLevel === 2 ? 'Bad...' : 'Sad'}
              </div>
              <div className={`absolute top-1/2 left-[-30px] -translate-y-1/2 text-[9px] font-bold uppercase transition-transform ${activeDirection === 'left' ? 'text-purple-500 scale-125' : 'text-slate-300'}`}>Note</div>
            </>
          )}
        </div>
      )}

      {/* --- GESTURE KNOB --- */}
      <div
        onPointerDown={handlers.handlePointerDown}
        onPointerMove={handlers.handlePointerMove}
        onPointerUp={handlers.handlePointerUp}
        onPointerCancel={handlers.handlePointerUp}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          opacity: isDimmed ? 0.3 : 1,
        }}
        className={`relative z-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center touch-none cursor-grab active:cursor-grabbing 
          transition-all duration-150 ease-out-back
          ${type === 'task' ? 'bg-[#2563EB] text-white shadow-blue-500/30' : 'bg-white text-slate-600 border border-slate-200 shadow-slate-200/50'} 
          ${activeDirection ? `ring-4 ring-opacity-30 ${getRingColor()}` : ''}
          ${getScaleClass()}
        `}
      >
        {/* FLASH OVERLAY: Lớp phủ trắng lóe lên khi Lock */}
        <div className={`absolute inset-0 rounded-full bg-white transition-opacity duration-150 pointer-events-none ${snapState === 'flash' ? 'opacity-60' : 'opacity-0'}`} />

        {renderIcon()}
      </div>

      {/* Label tĩnh */}
      {!isDragging && label && (
        <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-opacity ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          {label}
        </span>
      )}
    </div>
  );
};