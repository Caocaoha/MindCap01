import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';
import { streakEngine } from '../saban/streak-engine';

export const FocusSession: React.FC = () => {
  const [focusTasks, setFocusTasks] = useState<ITask[]>([]);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFocusTasks = async () => {
    // Lấy tối đa 4 task đang trong chế độ Focus và chưa xong
    const tasks = await db.tasks
      .where('isFocusMode')
      .equals(1) 
      .toArray();
    
    setFocusTasks(tasks.filter(t => t.status !== 'done').slice(0, 4));
  };

  useEffect(() => { loadFocusTasks(); }, []);

  // Đẩy task về Saban với trạng thái hoàn thành
  const completeAndReturnToSaban = async (task: ITask) => {
    if (!task.id) return;
    triggerHaptic('success');
    
    await db.tasks.update(task.id, {
      status: 'done',
      isFocusMode: false,
      updatedAt: Date.now() 
    });
    
    await loadFocusTasks();
  };

  // Cập nhật tiến độ dựa trên các cơ chế trực giác
  const handleProgress = async (task: ITask, delta: number) => {
    if (!task.id) return;

    const currentStr = streakEngine.getTagValue(task, 'current') || '0';
    const targetStr = streakEngine.getTagValue(task, 'target') || '1';
    const current = parseInt(currentStr);
    const target = parseInt(targetStr);

    const nextValue = Math.max(0, current + delta);
    
    // Cập nhật giá trị vào tags
    const newTags = (task.tags || []).filter(t => !t.startsWith('current:'));
    newTags.push(`current:${nextValue}`);

    await db.tasks.update(task.id, { 
      tags: newTags,
      updatedAt: Date.now()
    });

    triggerHaptic('light');

    if (nextValue >= target) {
      await completeAndReturnToSaban(task);
    } else {
      await loadFocusTasks();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 p-6 flex flex-col font-sans text-white">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">FOCUS</h2>
          <p className="text-[10px] opacity-40 uppercase tracking-widest">Deep Work Session</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 w-8 rounded-full ${i < focusTasks.length ? 'bg-blue-500' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto">
        {focusTasks.map(task => {
          const target = parseInt(streakEngine.getTagValue(task, 'target') || '1');
          const current = parseInt(streakEngine.getTagValue(task, 'current') || '0');
          const isDialMode = target > 12;

          return (
            <div key={task.id} className="bg-zinc-900/50 rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold leading-tight">{task.content}</h3>
                <p className="text-blue-500 font-mono text-sm mt-1">{current} / {target}</p>
              </div>

              {/* Vùng tương tác Smart Toggle */}
              <div 
                className="my-6 h-32 bg-zinc-800/30 rounded-2xl flex items-center justify-center touch-none select-none active:bg-zinc-800/50 transition-colors"
                onClick={() => !isDialMode && handleProgress(task, 1)}
                onWheel={(e) => isDialMode && handleProgress(task, e.deltaY > 0 ? -1 : 1)}
                onMouseDown={() => {
                  holdInterval.current = setInterval(() => handleProgress(task, 1), 150);
                }}
                onMouseUp={() => {
                  if (holdInterval.current) clearInterval(holdInterval.current);
                }}
              >
                <span className="text-xs font-black opacity-20 uppercase tracking-[0.5em]">
                  {isDialMode ? "Slide to Dial" : "Tap to Step"}
                </span>
              </div>

              {/* Thanh tiến độ "Hold to Fill" */}
              <div className="h-4 bg-zinc-800 rounded-full p-1 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${(current / target) * 100}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};