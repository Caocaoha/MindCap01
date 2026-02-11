// src/modules/saban/SabanView.tsx
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { useUserStore } from '../../store/userStore';
import { Task } from '../../database/types';
import { StrategicHeader } from './components/StrategicHeader';
import { BucketSection } from './components/BucketSection';
import { IdentityImpactModal } from './components/IdentityImpactModal';

export const SabanView: React.FC = () => {
  const { identity } = useUserStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Query Tasks: Lọc bỏ Active (đang Focus) và Completed cũ
  // Logic Cleanup: Chỉ hiện completed của hôm nay
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);

  const tasks = useLiveQuery(async () => {
    const all = await db.tasks
      .where('status').notEqual('active') // Loại trừ đang Focus
      .toArray();
      
    return all.filter(t => {
       // Filter Cleanup
       if (t.status === 'completed' && (!t.completedAt || t.completedAt < todayStart.getTime())) {
         return false; // Ẩn completed quá khứ
       }
       return true;
    });
  }, []);

  const doNow = tasks?.filter(t => t.status !== 'completed' && (t.priority === 'critical' || t.priority === 'urgent')) || [];
  const plan = tasks?.filter(t => t.status !== 'completed' && t.priority === 'important') || [];
  const later = tasks?.filter(t => t.status !== 'completed' && (t.priority === 'normal' || !t.priority)) || [];

  // Handle Swipe
  const handleSwipe = async (task: Task) => {
    if (identity.isCompleted) {
      // Scenario A: Identity Completed -> Ask Impact
      setSelectedTask(task);
    } else {
      // Scenario B: Not Completed -> Direct Focus
      await moveToFocus(task, 0);
    }
  };

  const moveToFocus = async (task: Task, score: number) => {
    await db.tasks.update(task.id, {
      status: 'active',
      identityScore: score
    });
    setSelectedTask(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <StrategicHeader onIdentityClick={() => console.log("Nav to Identity")} />
      
      <BucketSection title="Làm Ngay (Do Now)" tasks={doNow} bucketType="do_now" onSwipe={handleSwipe} />
      <BucketSection title="Suy Nghĩ Thêm (Plan)" tasks={plan} bucketType="plan" onSwipe={handleSwipe} />
      <BucketSection title="Khác (Later)" tasks={later} bucketType="later" onSwipe={handleSwipe} />

      <IdentityImpactModal 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        onConfirm={(score) => moveToFocus(selectedTask!, score)} 
      />
    </div>
  );
};