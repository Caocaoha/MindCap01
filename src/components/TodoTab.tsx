import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Entry } from '../db';
import { Check, Zap, Flame, ArrowUpRight, RefreshCw, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import clsx from 'clsx';

export const TodoTab = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'URGENT'>('ALL');
  
  const calculateDisplayStreak = (task: Entry) => {
      if (task.frequency === 'ONCE') return null;
      const streakVal = task.streak_current || 0;
      const lastDate = task.streak_last_date ? dayjs(task.streak_last_date) : null;
      if (!lastDate) return null;

      const gap = dayjs().startOf('day').diff(lastDate.startOf('day'), 'day');
      if (gap <= 1) return { val: streakVal, opacity: 1, visible: true };
      if (gap > 1 && gap <= 5) {
          const penalty = gap - 1;
          const displayVal = Math.max(0, streakVal - penalty);
          const opacity = Math.max(0.2, 0.6 - (gap * 0.1)); 
          return { val: displayVal, opacity, visible: displayVal > 0 };
      }
      return { val: 0, opacity: 0, visible: false };
  };

  const tasks = useLiveQuery(async () => {
    try {
        const todayStart = dayjs().startOf('day');
        const currentDayIndex = new Date().getDay(); 
        const allEntries = await db.entries.reverse().sortBy('created_at');
        return allEntries.filter(t => {
           if (!t.is_task) return false;
           if (t.is_focus) return false; 
           if (t.status === 'COMPLETED') return t.completed_at && dayjs(t.completed_at).isAfter(todayStart);
           if (t.frequency === 'ONCE') return true; 
           if (t.frequency === 'DAILY') return true; 
           if (t.frequency === 'CUSTOM') return t.repeat_days?.includes(currentDayIndex);
           return true;
        });
    } catch (error) { return []; }
  }, []);

  const handleComplete = async (task: Entry) => {
      const nowStr = new Date().toISOString();
      const todayStr = dayjs().format('YYYY-MM-DD');
      let newStreak = task.streak_current || 0;
      let newRecovery = task.streak_recovery_count || 0;
      let newFrozen = task.streak_frozen_val || 0;
      
      if (task.frequency !== 'ONCE') {
          const lastDate = task.streak_last_date ? dayjs(task.streak_last_date) : null;
          if (!lastDate) { newStreak = 1; } else {
              const gap = dayjs().startOf('day').diff(lastDate.startOf('day'), 'day');
              if (gap <= 1) { if (gap === 1) newStreak = Math.min(99, newStreak + 1); } 
              else if (gap <= 5) { const penalty = gap - 1; newStreak = Math.max(1, Math.min(99, newStreak - penalty + 1)); } 
              else {
                  if (newRecovery === 0) newFrozen = newStreak;
                  newRecovery += 1;
                  if (newRecovery >= 3) { newStreak = Math.min(99, Math.max(1, newFrozen - gap)); newRecovery = 0; newFrozen = 0; } 
                  else { newStreak = 1; }
              }
          }
      }
      await db.entries.update(task.id!, { 
          status: 'COMPLETED', completed_at: nowStr, streak_current: newStreak,
          streak_last_date: todayStr, streak_recovery_count: newRecovery, streak_frozen_val: newFrozen
      });
  };

  const moveToFocus = async (task: Entry, e: React.MouseEvent) => {
      e.stopPropagation();
      await db.entries.update(task.id!, { is_focus: true, focus_date: new Date().toISOString() });
  };

  const handleUndo = async (task: Entry) => await db.entries.update(task.id!, { status: 'ACTIVE', completed_at: undefined });
  if (!tasks) return <div className="p-12 text-center text-xs text-slate-400">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans px-4 pb-32">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <div className="flex items-end justify-between border-b border-slate-100 pb-4">
           <div><h1 className="text-xl font-semibold text-slate-800 tracking-tight">Việc cần làm</h1><p className="text-xs text-slate-400 mt-0.5 font-medium">Hôm nay, {dayjs().format('DD/MM')}</p></div>
           <div className="flex bg-slate-100 p-0.5 rounded-lg">
               <button onClick={() => setFilterType('ALL')} className={clsx("px-3 py-1 rounded-md text-[11px] font-semibold transition-all", filterType === 'ALL' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}>Tất cả</button>
               <button onClick={() => setFilterType('URGENT')} className={clsx("px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1", filterType === 'URGENT' ? "bg-white text-red-600 shadow-sm" : "text-slate-500")}><Zap size={10}/> Gấp</button>
           </div>
        </div>

        <div className="space-y-2">
            {tasks.filter(t => filterType === 'ALL' || (filterType === 'URGENT' && t.urgent)).map(task => {
                const isDone = task.status === 'COMPLETED';
                const streakData = calculateDisplayStreak(task);
                return (
                    <div key={task.id} className={clsx("group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-200", isDone ? "bg-slate-50/50 border-slate-100" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm")}>
                        <button onClick={() => isDone ? handleUndo(task) : handleComplete(task)} className={clsx("mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all", isDone ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-300 text-transparent hover:border-blue-400")}><Check size={12} strokeWidth={3} /></button>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start gap-2">
                                <p className={clsx("text-[14px] leading-snug font-normal transition-colors", isDone ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800")}>{task.content}</p>
                                {!isDone && streakData && streakData.visible && <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 rounded border border-orange-100" style={{ opacity: streakData.opacity }}><Flame size={10} className="text-orange-500 fill-orange-500" /><span className="text-[10px] font-bold text-orange-600 tabular-nums">{streakData.val > 99 ? '99+' : streakData.val}</span></div>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {task.urgent && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">URGENT</span>}
                                {task.frequency !== 'ONCE' && <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{task.frequency}</span>}
                            </div>
                        </div>
                        {!isDone && <button onClick={(e) => moveToFocus(task, e)} className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md"><ArrowUpRight size={16} strokeWidth={2} /></button>}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};