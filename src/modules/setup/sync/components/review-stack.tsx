import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useReviewLogic } from '../use-review-logic';
import { ReviewCard } from './review-card';

const cardVariants: Variants = {
  exit: (direction: 'sync' | 'ignore') => ({
    x: direction === 'sync' ? 600 : -600,
    rotate: direction === 'sync' ? 15 : -15,
    opacity: 0,
    transition: { duration: 0.3 }
  })
};

export const ReviewStack: React.FC = () => {
  const { items, loading, handleApprove, handleIgnore } = useReviewLogic();
  const [exitDir, setExitDir] = useState<Record<number, 'sync' | 'ignore'>>({});

  const performAction = (id: number, action: 'sync' | 'ignore', table: any) => {
    setExitDir(prev => ({ ...prev, [id]: action }));
    if (action === 'sync') handleApprove(id, table);
    else handleIgnore(id, table);
  };

  if (loading || items.length === 0) return <div className="h-[500px] flex items-center justify-center text-[10px] font-black opacity-20 uppercase tracking-widest">Sạch sẽ</div>;

  const topItem = items[0];

  return (
    <div className="relative w-full h-[540px] perspective-1000">
      <AnimatePresence custom={exitDir}>
        <motion.div
          key={topItem.id}
          className="absolute w-full h-full"
          custom={exitDir[topItem.id] || 'ignore'}
          variants={cardVariants}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit="exit"
          drag="x"
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) performAction(topItem.id, 'sync', topItem._dbTable);
            else if (info.offset.x < -100) performAction(topItem.id, 'ignore', topItem._dbTable);
          }}
        >
          <ReviewCard 
            item={topItem} 
            onIgnore={() => performAction(topItem.id, 'ignore', topItem._dbTable)}
            onApprove={() => performAction(topItem.id, 'sync', topItem._dbTable)}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};