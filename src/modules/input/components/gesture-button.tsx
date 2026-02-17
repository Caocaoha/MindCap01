import React from 'react';
import { useGestureLogic } from './use-gesture-logic';

/**
 * Purpose: Hiển thị giao diện Gesture Button với phản hồi thị giác tương ứng trạng thái Logic.
 * Inputs: GestureButtonProps (type, label, events).
 * Outputs: JSX.Element.
 * Business Rule:
 * - Hiển thị Visual Feedback (Màu sắc, Icon, Rail) dựa trên state từ useGestureLogic.
 * - Không chứa logic tính toán vector.
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

  // Helper: Render Icon based on state
  const renderIcon = () => {
    if (type === 'task') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    }
    // Thought Icons
    if (activeDirection === 'up') return feedbackLevel === 2 ? <span className="text-2xl">🤩</span> : <span className="text-2xl">😊</span>;
    if (activeDirection === 'down') return feedbackLevel === 2 ? <span className="text-2xl">😭</span> : <span className="text-2xl">😔</span>;
    if (activeDirection === 'left') return <span className="text-2xl">😐</span>;
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  };

  // Helper: Get Ring Color
  const getRingColor = () => {
    if (!activeDirection) return 'ring-blue-500';
    if (['ul', 'ur'].includes(activeDirection)) return 'ring-red-500';
    if (activeDirection === 'up') return 'ring-green-500';
    if (activeDirection === 'down') return 'ring-slate-500';
    if (activeDirection === 'left') return 'ring-purple-500';
    return 'ring-blue-500';
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* --- RAIL SYSTEM VISUALS --- */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-200">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-200 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {type === 'task' ? (
            <>
              {/* X-Rail Axis */}
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 rotate-45" />
              <div className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-slate-100 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
              {/* Labels */}
              <div className={`absolute top-0 left-0 text-[9px] font-bold uppercase ${activeDirection === 'ul' ? 'text-red-500 scale-110' : 'text-slate-300'}`}>Urgent+Imp</div>
              <div className={`absolute top-0 right-0 text-[9px] font-bold uppercase ${activeDirection === 'ur' ? 'text-orange-500 scale-110' : 'text-slate-300'}`}>Urgent</div>
              <div className={`absolute bottom-0 left-0 text-[9px] font-bold uppercase ${activeDirection === 'dl' ? 'text-blue-500 scale-110' : 'text-slate-300'}`}>Important</div>
            </>
          ) : (
            <>
              {/* T-Rail Axis */}
              <div className="absolute top-[-40px] left-1/2 w-[2px] h-[160px] bg-slate-100 -translate-x-1/2" />
              <div className="absolute top-1/2 right-1/2 w-[80px] h-[2px] bg-slate-100 -translate-y-1/2" />
              {/* Labels */}
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
        className={`relative z-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-75 touch-none cursor-grab active:cursor-grabbing 
          ${type === 'task' ? 'bg-[#2563EB] text-white shadow-blue-500/30' : 'bg-white text-slate-600 border border-slate-200 shadow-slate-200/50'} 
          ${activeDirection ? `scale-110 ring-4 ring-opacity-20 ${getRingColor()}` : ''}
          ${feedbackLevel === 2 ? 'ring-opacity-40 scale-125' : ''} 
        `}
      >
        {renderIcon()}
      </div>

      {/* Static Label */}
      {!isDragging && label && (
        <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-opacity ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          {label}
        </span>
      )}
    </div>
  );
};