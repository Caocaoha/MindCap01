// src/components/FocusZone/index.tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { db } from '../../db/db';
import { FocusItem } from './FocusItem';

export const FocusZone: React.FC = () => {
  // Query 4 tasks đang active và được đánh dấu isFocusing
  const focusTasks = useLiveQuery(() => 
    db.tasks
      .where('isFocusing').equals(1)
      .and(t => t.status === 'active')
      .limit(4)
      .toArray()
  );

  if (!focusTasks || focusTasks.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 w-full px-4 z-40">
      <div className="flex flex-col w-full max-w-md mx-auto">
        <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest px-1">
          Focus Mode
        </div>
        
        <AnimatePresence>
          {focusTasks.map(task => (
            <FocusItem key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};