import React, { useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { triggerHaptic } from '../../../utils/haptic';

interface GestureButtonProps {
  type: 'task' | 'mood';
  onAction: (result: string) => void;
  onDragStateChange: (isDragging: boolean) => void; // THÊM DÒNG NÀY
}

export const GestureButton: React.FC<GestureButtonProps> = ({ type, onAction, onDragStateChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeLabel, setActiveLabel] = useState('');
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const calculateResult = (mx: number, my: number) => {
    const dist = Math.hypot(mx, my);
    if (dist < 50) return null;

    if (type === 'task') {
      const angle = Math.atan2(my, mx) * (180 / Math.PI);
      if (angle >= -180 && angle < -90) return 'Normal';
      if (angle >= -90 && angle < 0) return 'Urgent';
      if (angle >= 0 && angle < 90) return 'Critical';
      return 'Needed';
    } else {
      if (my < -50) return 'Happy';
      if (my > 50) return 'Sad';
      if (mx < -50) return 'Neutral';
      return null;
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      style={{ x, y }}
      onDragStart={() => {
        setIsDragging(true);
        onDragStateChange(true); // Kích hoạt hiệu ứng Ghost
      }}
      onDrag={(e, info) => {
        const result = calculateResult(info.offset.x, info.offset.y);
        const dist = Math.hypot(info.offset.x, info.offset.y);
        
        if (dist > 50 && dist < 100) triggerHaptic('light');
        if (dist >= 100) triggerHaptic('medium');
        
        setActiveLabel(result || '');
      }}
      onDragEnd={(e, info) => {
        const result = calculateResult(info.offset.x, info.offset.y);
        if (result) onAction(result);
        setIsDragging(false);
        onDragStateChange(false); // Tắt hiệu ứng Ghost
        setActiveLabel('');
      }}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing
        ${isDragging ? 'z-50 scale-110 bg-blue-500' : 'bg-gray-800'}`}
    >
      <span className="text-white font-bold">{type === 'task' ? 'X' : 'T'}</span>
      {isDragging && activeLabel && (
        <div className="absolute -top-10 bg-black/50 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap">
          {activeLabel}
        </div>
      )}
    </motion.div>
  );
};