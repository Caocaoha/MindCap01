import React from 'react';
import { Star, Lock, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIdentityStore } from '../../features/identity/store';

interface StarCompassProps {
  onClick: () => void;
}

export const StarCompass: React.FC<StarCompassProps> = ({ onClick }) => {
  const { isInCooldown, hasCompletedOnboarding, currentQuestionIndex } = useIdentityStore();

  // State 1: Cooldown (Đồng hồ cát)
  if (isInCooldown) {
    return (
      <div className="relative p-2 text-yellow-600 cursor-not-allowed opacity-70">
        <Hourglass className="w-6 h-6 animate-pulse" />
      </div>
    );
  }

  // State 2: Completed (Ngôi sao đặc, sáng - Mở Dashboard)
  if (hasCompletedOnboarding) {
    return (
      <button onClick={onClick} className="relative p-2 group">
        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-transform group-hover:scale-110" />
      </button>
    );
  }

  // State 3: In Progress (Ngôi sao nhấp nháy - Tiếp tục hành trình)
  // State 4: Newbie (Ngôi sao viền - Bắt đầu)
  const isStarted = currentQuestionIndex > 0;

  return (
    <button onClick={onClick} className="relative p-2">
      <motion.div
        animate={isStarted ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Star 
          className={`w-6 h-6 ${isStarted ? 'text-yellow-400' : 'text-slate-400'} hover:text-yellow-300 transition-colors`} 
          strokeWidth={isStarted ? 2 : 1.5}
        />
      </motion.div>
    </button>
  );
};