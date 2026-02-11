// src/components/Identity/StarCompass.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';

interface StarCompassProps {
  onClick: () => void;
}

export const StarCompass: React.FC<StarCompassProps> = ({ onClick }) => {
  const identity = useUserStore(state => state.identity);
  const checkCooldown = useUserStore(state => state.checkIdentityCooldown);

  useEffect(() => {
    // Check cooldown mỗi phút nếu đang active
    const interval = setInterval(checkCooldown, 60000);
    return () => clearInterval(interval);
  }, []);

  const isCooldown = identity?.cooldownEndsAt && Date.now() < identity.cooldownEndsAt;
  const isCompleted = identity?.isCompleted;

  // Animation variants
  const variants = {
    idle: { opacity: 0.6, scale: 1 },
    breathing: { 
      opacity: 1, 
      scale: [1, 1.2, 1], 
      textShadow: "0px 0px 8px rgb(255,255,255)",
      transition: { duration: 3, repeat: Infinity } 
    },
    cooldown: { 
      rotate: 360, 
      opacity: 0.5,
      transition: { duration: 10, repeat: Infinity, ease: "linear" } 
    },
    glow: { 
      scale: 1.1, 
      filter: "drop-shadow(0 0 10px #fbbf24)",
      opacity: 1 
    }
  };

  let currentState = 'idle';
  if (isCompleted) currentState = 'glow';
  else if (isCooldown) currentState = 'cooldown';
  else if (identity?.currentQuestionId > 1) currentState = 'breathing';

  return (
    <motion.button
      onClick={onClick}
      className="relative p-2"
      animate={currentState}
      variants={variants}
    >
      {/* North Star SVG */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={isCompleted ? "#fbbf24" : "none"} stroke={isCompleted ? "#fbbf24" : "currentColor"} />
      </svg>
    </motion.button>
  );
};