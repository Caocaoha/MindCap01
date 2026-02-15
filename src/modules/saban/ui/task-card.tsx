import React from 'react';
import { ITask } from '../../../database/types';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';

interface TaskCardProps {
  task: ITask;
  isGrouped?: boolean;
  onToggleFocus?: () => void;
  onArchive?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDetach?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isGrouped, 
  onToggleFocus, 
  onArchive, 
  onMoveUp, 
  onMoveDown, 
  onDetach,
  isFirst,
  isLast
}) => {
  const { openEditModal } = useUiStore();
  const isDone = task.status === 'done';
  const isMultiTarget = (task.targetCount ?? 0) > 1;

  const handleFocusClick = () => {
    if (onToggleFocus) {
      onToggleFocus();
    }
  };

  return (
    <div className={`group flex items-start gap-4 p-4 rounded-[6px] border transition-all duration-200 ${
      isDone ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1 mb-2">
          <p className={`text-sm font-medium tracking-tight break-words whitespace-pre-wrap leading-relaxed ${
            isDone ? 'line-through text-slate-400' : 'text-slate-900'
          }`}>
            {task.content}
          </p>
          
          {isMultiTarget && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] bg-slate-50 text-[#2563EB] border border-slate-200 px-2 py-0.5 rounded-[4px] font-mono font-bold">
                {task.doneCount ?? 0} / {task.targetCount} {task.unit || ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {task.tags?.filter(t => !t.startsWith('d:') && !t.startsWith('m:') && !t.startsWith('freq:')).map(tag => (
            <span key={tag} className="text-[8px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              #{tag.split(':')[1] || tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { triggerHaptic('light'); openEditModal(task); }}
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            Sửa
          </button>
          
          <button 
            onClick={() => { if (onArchive) onArchive(); }}
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-red-300 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {isGrouped && (
          <div className="flex flex-col items-end gap-1 border-t border-slate-100 pt-2 w-full">
            <div className="flex items-center gap-1">
              <button 
                disabled={isFirst}
                onClick={() => { triggerHaptic('light'); if (onMoveUp) onMoveUp(); }}
                className={`w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-[10px] transition-all
                  ${isFirst ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-100 active:scale-90'}`}
              >
                ↑
              </button>
              <button 
                disabled={isLast}
                onClick={() => { triggerHaptic('light'); if (onMoveDown) onMoveDown(); }}
                className={`w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-[10px] transition-all
                  ${isLast ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-100 active:scale-90'}`}
              >
                ↓
              </button>
            </div>
            
            <button 
              onClick={() => { if (onDetach) onDetach(); }}
              className="text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-600 pr-1 pt-1"
            >
              Tách nhóm
            </button>
          </div>
        )}
        
        {!isDone && (
          <button 
            onClick={handleFocusClick}
            className="mt-1 bg-[#2563EB] text-white px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm shadow-blue-500/10"
          >
            Thực thi
          </button>
        )}
      </div>
    </div>
  );
};