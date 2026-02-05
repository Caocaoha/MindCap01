import React from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { Zap, Repeat } from 'lucide-react';
import { ParseResult } from '../../utils/smartParser';

interface SmartChipProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  data: ParseResult | null;
  isDragging: boolean;
}

const SmartChip: React.FC<SmartChipProps> = ({ x, y, data, isDragging }) => {
  // Biến đổi vị trí để Chip luôn nằm phía trên ngón tay một chút
  const chipY = useTransform(y, (latest) => latest - 60);
  const opacity = useTransform(y, [-50, 0, 50], [1, 0, 1]); // Chỉ hiện khi kéo ra xa tâm

  if (!isDragging || !data || !data.is_detected) return null;

  return (
    <motion.div
      style={{ x, y: chipY, opacity }}
      className="pointer-events-none fixed z-50 left-1/2 top-1/2 -ml-[100px] flex justify-center w-[200px]"
    >
      <div className="bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700/50">
        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
        <span>{data.quantity} {data.unit}</span>
        {data.frequency !== 'once' && (
          <>
            <div className="w-[1px] h-3 bg-slate-600 mx-0.5" />
            <span className="flex items-center gap-1 text-slate-300">
              <Repeat size={10} /> {data.frequency}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SmartChip;