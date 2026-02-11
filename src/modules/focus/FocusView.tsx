// src/modules/focus/FocusView.tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../database/db';
import { useUIStore } from '../../store/uiStore';
import { FocusTaskItem } from './components/FocusTaskItem';

export const FocusView: React.FC = () => {
  const isTyping = useUIStore(state => state.isTyping);
  
  // Query Active Tasks (Limit 4)
  // Sắp xếp: Ưu tiên Identity Score cao nhất -> Priority -> Mới nhất
  const activeTasks = useLiveQuery(async () => {
    return await db.tasks
      .where('status').equals('active')
      .limit(4) // Hard Constraint
      .reverse() // Sort temp, usually needs complex sort in memory if indexeddb limitation
      .toArray();
  }, []);
  
  // In-memory sort for better precision
  const sortedTasks = activeTasks?.sort((a, b) => {
    // 1. Identity Score (-5 to +5) DESC
    const scoreA = a.identityScore || 0;
    const scoreB = b.identityScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // 2. Priority
    const pMap = { critical: 4, urgent: 3, important: 2, normal: 1 };
    return (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
  });

  if (!sortedTasks || sortedTasks.length === 0) return null;

  return (
    <motion.div
      className="w-full max-w-lg mx-auto px-4 mb-24 pb-4" // mb-24 để tránh đè lên InputBar
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isTyping ? 0 : 1,
        pointerEvents: isTyping ? 'none' : 'auto',
        y: isTyping ? 20 : 0
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Focus Zone ({sortedTasks.length}/4)
        </h2>
        {/* Optional: Add a subtle indicator if hidden tasks exist */}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode='popLayout'>
          {sortedTasks.map(task => (
            <FocusTaskItem key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Spacer when list is short (tự động nhờ flex-col gap) */}
    </motion.div>
  );
};