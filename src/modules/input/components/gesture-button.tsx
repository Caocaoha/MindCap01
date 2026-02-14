import React, { useState, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface GestureButtonProps {
  onComplete: () => void;
  label?: string;
}

/**
 * [MOD_INPUT]: Gesture Rail Button - Phiên bản Linear.app v4.0.
 * Đặc điểm: Nền trắng, Border Slate-200, Handle màu Blue #2563EB.
 * Bo góc chuẩn 6px, loại bỏ 100% đổ bóng và gradient.
 */
export const GestureButton: React.FC<GestureButtonProps> = ({ onComplete, label = "Kéo để xác nhận" }) => {
  const [dragProgress, setDragProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleStart = () => {
    isDragging.current = true;
    triggerHaptic('light'); //
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width - 52; // Trừ đi kích thước của handle (48px + padding)
    const x = clientX - rect.left - 24; // Căn giữa handle
    
    const progress = Math.max(0, Math.min(100, (x / width) * 100));
    setDragProgress(progress);

    /**
     * [FIX]: Thay đổi 'selection' thành 'light' để khắc phục lỗi TS2345.
     * Đảm bảo giá trị truyền vào khớp với HapticType được định nghĩa trong utils/haptic.ts.
     */
    if (Math.abs(progress - 50) < 1 || Math.abs(progress - 95) < 1) {
      triggerHaptic('light'); 
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragProgress > 90) {
      setDragProgress(100);
      triggerHaptic('success'); //
      setTimeout(onComplete, 200);
    } else {
      triggerHaptic('medium'); //
      setDragProgress(0);
    }
  };

  return (
    /* CONTAINER: Nền trắng tuyệt đối, border slate-200 mảnh, bo góc 6px */
    <div 
      ref={containerRef}
      className="relative w-full h-14 bg-white border border-slate-200 rounded-[6px] flex items-center px-1 overflow-hidden select-none shadow-none"
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* RAIL LABEL: Chữ Slate-400 font bold chuẩn Linear */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </span>
      </div>

      {/* DRAG HANDLE: Hình chữ nhật bo góc 4px, màu Blue #2563EB */}
      <div 
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className="z-10 w-12 h-12 bg-[#2563EB] rounded-[4px] flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow"
        style={{ transform: `translateX(${dragProgress * 0.85}%)` }} 
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
        </svg>
      </div>

      {/* PROGRESS OVERLAY: Lớp phủ xanh nhạt chạy theo handle (0.05 opacity) */}
      <div 
        className="absolute left-0 top-0 h-full bg-[#2563EB] pointer-events-none transition-all"
        style={{ width: `${dragProgress}%`, opacity: 0.05 }}
      />
    </div>
  );
};