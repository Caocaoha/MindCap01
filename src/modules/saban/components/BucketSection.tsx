// src/modules/saban/components/BucketSection.tsx
import React from 'react';
import { Task } from '../../../database/types';
import { SabanTaskItem } from './SabanTaskItem';

interface BucketSectionProps {
  title: string;
  tasks: Task[];
  bucketType: 'do_now' | 'plan' | 'later';
  onSwipe: (task: Task) => void;
}

export const BucketSection: React.FC<BucketSectionProps> = ({ title, tasks, bucketType, onSwipe }) => {
  if (tasks.length === 0) return null;

  const getHeaderColor = () => {
    switch (bucketType) {
      case 'do_now': return 'text-red-500';
      case 'plan': return 'text-blue-500';
      case 'later': return 'text-slate-400';
    }
  };

  return (
    <div className="mb-8 px-4">
      <div className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${getHeaderColor()}`}>
        {title}
        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <SabanTaskItem key={task.id} task={task} onSwipe={() => onSwipe(task)} />
        ))}
      </div>
    </div>
  );
};