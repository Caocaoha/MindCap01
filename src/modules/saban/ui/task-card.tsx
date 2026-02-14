import React from 'react';
import { ITask } from '../../../database/types';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [MOD_SABAN_UI]: Thẻ hiển thị nhiệm vụ cá nhân.
 * Giai đoạn 3: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 */
export const TaskCard: React.FC<{ task: ITask }> = ({ task }) => {
  const { openEditModal } = useUiStore();
  const isDone = task.status === 'done';
  const isMultiTarget = (task.targetCount ?? 0) > 1;

  /**
   * Chuyển tác vụ vào chế độ thực thi (Focus Mode)
   */
  const moveToFocus = async () => {
    triggerHaptic('success');
    // Cập nhật trạng thái sang Boolean true
    await db.tasks.update(task.id!, { isFocusMode: true }); 
  };

  return (
    /* CONTAINER: Nền trắng, Border Slate mảnh, Bo góc 6px, Loại bỏ shadow */
    <div className={`group flex items-center gap-4 p-4 rounded-[6px] border transition-all duration-200 ${
      isDone 
        ? 'bg-slate-50/50 border-slate-100 opacity-60' 
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {/* TEXT: Sử dụng font Inter, màu Slate-900 chuẩn chuyên nghiệp */}
          <p className={`text-sm font-medium truncate tracking-tight ${
            isDone ? 'line-through text-slate-400' : 'text-slate-900'
          }`}>
            {task.content}
          </p>
          
          {/* TIẾN ĐỘ: Màu nhấn Xanh đậm #2563EB trên nền Slate nhạt */}
          {isMultiTarget && (
            <span className="text-[9px] bg-slate-50 text-[#2563EB] border border-slate-200 px-2 py-0.5 rounded-[4px] font-mono font-bold">
              {task.doneCount ?? 0} / {task.targetCount} {task.unit || ''}
            </span>
          )}
        </div>

        {/* Tags phân loại: Tối giản hóa màu sắc */}
        <div className="flex gap-2">
          {task.tags?.filter(t => !t.startsWith('d:') && !t.startsWith('m:') && !t.startsWith('freq:')).map(tag => (
            <span key={tag} className="text-[8px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              #{tag.split(':')[1] || tag}
            </span>
          ))}
        </div>
      </div>

      {/* ACTION GROUP: Hiện ra khi hover theo phong cách công cụ quản lý */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => { triggerHaptic('light'); openEditModal(task); }}
          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
          Sửa
        </button>
        
        {!isDone && (
          /* NÚT THỰC THI: Chuyển sang màu Xanh nhấn chuẩn Linear #2563EB */
          <button 
            onClick={moveToFocus}
            className="bg-[#2563EB] text-white px-4 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-none"
          >
            Thực thi
          </button>
        )}
      </div>
    </div>
  );
};