import React from 'react';
import { ITask } from '../../../database/types';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';

export const TaskCard: React.FC<{ task: ITask }> = ({ task }) => {
  const { openEditModal } = useUiStore();
  const isDone = task.status === 'done';
  const isMultiTarget = (task.targetCount ?? 0) > 1;

  const moveToFocus = async () => {
    triggerHaptic('success');
    // Cập nhật trạng thái sang Boolean true
    await db.tasks.update(task.id!, { isFocusMode: true }); 
  };

  return (
    <div className={`group flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${
      isDone ? 'bg-zinc-900/20 border-white/5 opacity-40' : 'bg-zinc-900/40 border-white/10'
    }`}>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-white/40' : 'text-white'}`}>
            {task.content}
          </p>
          
          {/* TIẾN ĐỘ: Số lượng / Mục tiêu + Đơn vị */}
          {isMultiTarget && (
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono font-bold">
              {task.doneCount ?? 0} / {task.targetCount} {task.unit || ''}
            </span>
          )}
        </div>

        {/* Tags phân loại (Ẩn các tag hệ thống) */}
        <div className="flex gap-2">
          {task.tags?.filter(t => !t.startsWith('d:') && !t.startsWith('m:') && !t.startsWith('freq:')).map(tag => (
            <span key={tag} className="text-[7px] uppercase tracking-widest opacity-30 font-black">#{tag.split(':')[1] || tag}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => { triggerHaptic('light'); openEditModal(task); }}
          className="p-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white"
        >
          Sửa
        </button>
        
        {!isDone && (
          <button 
            onClick={moveToFocus}
            className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Thực thi
          </button>
        )}
      </div>
    </div>
  );
};