// src/modules/input/components/gesture-button.tsx
import React, { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

// Định nghĩa các vùng kích hoạt (Zones)
type GestureZone = 'center' | 'top-right' | 'bottom-right' | 'left' | 'top' | 'bottom';

interface GestureButtonProps {
  label: string; // Nhãn hiển thị chính (VD: Task, Save)
  type: 'task' | 'mood'; // Loại nút để xác định Rail System
  onAction: (zone: GestureZone) => void; // Callback khi thả tay
  className?: string;
}

export const GestureButton: React.FC<GestureButtonProps> = ({ 
  label, 
  type, 
  onAction,
  className = ''
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ngưỡng kích hoạt (Pixels)
  const THRESHOLD = 50; 
  const MAX_DRAG = 120; // Giới hạn kéo tối đa để UI không bị vỡ

  // Xử lý sự kiện bắt đầu kéo
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); // Ngăn scroll trình duyệt
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    
    // Capture pointer để theo dõi ra ngoài vùng nút
    (e.target as Element).setPointerCapture(e.pointerId);
    triggerHaptic('light');
  };

  // Xử lý khi đang kéo
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    // Giới hạn khoảng cách kéo (Clamping)
    const clampedX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
    const clampedY = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaY));

    setOffset({ x: clampedX, y: clampedY });

    // Haptic feedback khi vượt ngưỡng (Debounce cần thiết ở thực tế, ở đây làm đơn giản)
    if (Math.abs(deltaX) === THRESHOLD || Math.abs(deltaY) === THRESHOLD) {
      triggerHaptic('medium');
    }
  };

  // Xử lý khi thả tay
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Xác định vùng (Zone) dựa trên Offset cuối cùng
    const { x, y } = offset;
    let zone: GestureZone = 'center';

    if (Math.abs(x) > THRESHOLD || Math.abs(y) > THRESHOLD) {
      if (type === 'task') {
        // Rail X System (4 góc & Trái)
        if (x < -THRESHOLD) zone = 'left'; // Backlog
        else if (x > THRESHOLD && y < -THRESHOLD) zone = 'top-right'; // Urgent
        else if (x > THRESHOLD && y > THRESHOLD) zone = 'bottom-right'; // Critical
      } else {
        // Rail T System (3 trục)
        if (y < -THRESHOLD) zone = 'top'; // Happy/Mood Up
        else if (y > THRESHOLD) zone = 'bottom'; // Sad/Mood Down
        else if (x < -THRESHOLD) zone = 'left'; // Neutral/Save
      }
    }

    // Reset vị trí
    setOffset({ x: 0, y: 0 });
    
    // Trigger Action
    onAction(zone);
    triggerHaptic('success');
  };

  // Style động cho hiệu ứng lò xo (Spring)
  const style = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Hiệu ứng nảy khi thả
    touchAction: 'none' // Quan trọng: Tắt zoom/scroll trình duyệt
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Visual Rails (Chỉ hiện khi Dragging - Placeholder) */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          {/* Có thể vẽ SVG mũi tên hướng dẫn tại đây */}
          <div className="w-full h-0.5 bg-gray-400 absolute" />
          <div className="h-full w-0.5 bg-gray-400 absolute" />
        </div>
      )}

      <button
        ref={buttonRef}
        className={`
          w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg z-50 flex items-center justify-center font-bold
          ${className}
        `}
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {label}
      </button>
    </div>
  );
};