/**
 * Purpose: Giao dien hien thi chi tiet mot nhiem vu trong Saban Board.
 * Inputs/Outputs: Nhan Props va hien thi JSX dua tren du lieu tu useTaskCardLogic.
 * Business Rule: Toi uu trai nghiem Mobile, ho tro phan hoi thi giac khi keo tha.
 */

import React from 'react';
import { TaskCardProps } from './task-card-types';
import { useTaskCardLogic } from './use-task-card-logic';
import { triggerHaptic } from '../../../utils/haptic';

export const TaskCard: React.FC<TaskCardProps> = (props) => {
  const logic = useTaskCardLogic(props);
  const { task, isGrouped, onToggleFocus, onArchive, onMoveUp, onMoveDown, onDetach, isFirst, isLast } = props;

  return (
    <div 
      draggable={!logic.isDone}
      onDragStart={logic.handlers.onDragStart}
      onDragOver={logic.handlers.onDragOver}
      onDragLeave={logic.handlers.onDragLeave}
      onDrop={logic.handlers.onDrop}
      onDoubleClick={logic.handlers.onEditTrigger}
      className={`group flex items-start gap-4 p-4 rounded-[6px] border transition-all duration-300 relative 
        ${logic.isDragOver ? 'border-[#2563EB] bg-blue-50/30 scale-[1.02] z-10' : ''} 
        ${logic.isDone ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300'} 
        cursor-grab active:cursor-grabbing`}
    >
      {logic.isDragOver && <div className="absolute inset-0 border-2 border-dashed border-[#2563EB] rounded-[6px] pointer-events-none animate-pulse" />}
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1 mb-2">
          <p onClick={logic.handlers.onEditTrigger}
            className={`text-sm font-medium tracking-tight break-words whitespace-pre-wrap leading-relaxed cursor-pointer 
              ${logic.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.content}
          </p>
          {logic.isMultiTarget && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] bg-slate-50 text-[#2563EB] border border-slate-200 px-2 py-0.5 rounded-[4px] font-mono font-bold">
                {task.doneCount ?? 0} / {task.targetCount} {task.unit}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {task.tags?.filter(t => !['d:', 'm:', 'freq:'].some(p => t.startsWith(p))).map(tag => (
            <span key={tag} className="text-[8px] uppercase tracking-[0.15em] text-slate-400 font-bold">#{tag.split(':')[1] || tag}</span>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2 pt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); logic.handlers.onEditTrigger(); }} className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-900">Sửa</button>
          <button onClick={(e) => { e.stopPropagation(); if (onArchive) onArchive(); }} className="px-2 py-1 text-[9px] font-bold uppercase text-red-300 hover:text-red-600">✕</button>
        </div>

        {isGrouped && (
          <div className="flex flex-col items-end gap-1 border-t border-slate-100 pt-2 w-full">
            <div className="flex items-center gap-1">
              {[ { act: onMoveUp, dis: isFirst, icon: '↑' }, { act: onMoveDown, dis: isLast, icon: '↓' } ].map((btn, i) => (
                <button key={i} disabled={btn.dis} onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); if (btn.act) btn.act(); }}
                  className={`w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 text-[10px] ${btn.dis ? 'opacity-20 grayscale' : 'bg-white hover:bg-slate-100'}`}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); if (onDetach) onDetach(); }} className="text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-600">Tách nhóm</button>
          </div>
        )}
        
        {!logic.isDone && (
          <button onClick={(e) => { e.stopPropagation(); if (onToggleFocus) onToggleFocus(); }}
            className="mt-1 bg-[#2563EB] text-white px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase active:scale-95 transition-all shadow-sm shadow-blue-500/10"
          >
            Thực thi
          </button>
        )}
      </div>
    </div>
  );
};