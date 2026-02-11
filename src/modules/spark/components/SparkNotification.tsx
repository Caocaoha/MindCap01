// src/modules/spark/components/SparkNotification.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Eye } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useUIStore } from '../../../store/uiStore'; // Đường dẫn chuẩn: modules -> spark -> components (3 cấp)
import { SparkEngine } from '../logic/sparkEngine';

interface SparkNotificationProps {
  onOpenTreasure: () => void;
}

export const SparkNotification: React.FC<SparkNotificationProps> = ({ onOpenTreasure }) => {
  // Fix lỗi Parameter 'state' implicitly has an 'any' type
  const isTyping = useUIStore((state: any) => state.isTyping);
  const [activeSpark, setActiveSpark] = useState<any>(null);

  useLiveQuery(async () => {
    const now = Date.now();
    const task = await db.tasks.where('nextReviewAt').belowOrEqual(now).first();
    const thought = await db.thoughts.where('nextReviewAt').belowOrEqual(now).first();
    const candidate = task || thought; 
    if (candidate) setActiveSpark(candidate);
  }, []);

  const handleReview = async () => {
    if (!activeSpark) return;
    await SparkEngine.processReview(activeSpark, activeSpark.type);
    setActiveSpark(null);
  };

  if (!activeSpark || isTyping) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 right-4 z-40 max-w-xs w-full"
      >
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700">
           <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-2 text-yellow-400 font-bold text-[10px] uppercase tracking-widest">
               <Zap size={12} className="fill-yellow-400" /> Memory Spark
             </div>
             <button onClick={() => setActiveSpark(null)}><X size={14} className="text-slate-500" /></button>
           </div>
           <p className="text-sm font-medium line-clamp-2 mb-4">"{activeSpark.content}"</p>
           <div className="flex gap-2">
             <button onClick={handleReview} className="flex-1 bg-slate-800 py-2 rounded-lg text-xs font-bold">Đã nhớ</button>
             <button onClick={onOpenTreasure} className="px-3 bg-blue-600 rounded-lg"><Eye size={14} /></button>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};