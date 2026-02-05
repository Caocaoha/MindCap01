import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { Zap, Repeat, Smile, Frown, Meh } from 'lucide-react';
import { ParseResult } from '../../utils/smartParser';

interface SmartChipProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  mode: 'task' | 'mood';
  taskData: ParseResult | null;
  moodLevel: number;
  isDragging: boolean;
}

const SmartChip: React.FC<SmartChipProps> = ({ x, y, mode, taskData, moodLevel, isDragging }) => {
  const chipY = useTransform(y, (latest) => latest - 80);
  const opacity = useTransform(y, [-50, 0, 50], [1, 0, 1]);

  if (!isDragging) return null;

  // Render Chip cho MOOD
  if (mode === 'mood') {
    let icon = <Meh size={14}/>;
    let text = "Bình thường";
    let colorClass = "bg-slate-800 text-white";

    if (moodLevel === 2) { icon = <span className="text-lg">🤩</span>; text = "Tuyệt vời"; colorClass = "bg-green-600 text-white"; }
    else if (moodLevel === 1) { icon = <Smile size={14}/>; text = "Vui"; colorClass = "bg-green-500 text-white"; }
    else if (moodLevel === -1) { icon = <Frown size={14}/>; text = "Buồn"; colorClass = "bg-orange-500 text-white"; }
    else if (moodLevel === -2) { icon = <span className="text-lg">😫</span>; text = "Rất tệ"; colorClass = "bg-red-600 text-white"; }

    return (
      <motion.div style={{ x, y: chipY, opacity }} className="pointer-events-none fixed z-50 left-1/2 top-1/2 -translate-x-1/2 flex justify-center w-[200px]">
        <div className={`${colorClass} backdrop-blur-md px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold border border-white/20`}>
          {icon} <span>{text}</span>
        </div>
      </motion.div>
    );
  }

  // Render Chip cho TASK
  if (!taskData || !taskData.is_detected) return null;

  return (
    <motion.div style={{ x, y: chipY, opacity }} className="pointer-events-none fixed z-50 left-1/2 top-1/2 -translate-x-1/2 flex justify-center w-[200px]">
      <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700/50">
        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
        <span>{taskData.quantity} {taskData.unit}</span>
        {taskData.frequency !== 'once' && (
          <>
            <div className="w-[1px] h-3 bg-slate-600 mx-0.5" />
            <span className="flex items-center gap-1 text-slate-300"><Repeat size={10} /> {taskData.frequency}</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SmartChip;