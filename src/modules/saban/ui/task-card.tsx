import React from 'react';
import { ITask } from '../../../database/types';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [MOD_SABAN_UI]: Thẻ hiển thị nhiệm vụ cá nhân.
 * Giai đoạn 4: Thẩm mỹ Linear.app & Tối ưu hóa iPhone (Vertical Expansion).
 * Đảm bảo hiển thị 100% nội dung và giữ vững vị trí nút bấm hai bên.
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
    /* CONTAINER: Chuyển từ items-center sang items-start để các nút bấm luôn neo ở đỉnh thẻ khi text dài.
       Giữ nguyên DNA Linear: Nền trắng, Border Slate mảnh, Bo góc 6px.
    */
    <div className={`group flex items-start gap-4 p-4 rounded-[6px] border transition-all duration-200 ${
      isDone 
        ? 'bg-slate-50/50 border-slate-100 opacity-60' 
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* NỘI DUNG CHÍNH: Loại bỏ min-w-0 và truncate để văn bản tự do giãn nở. */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1 mb-2">
          {/* TEXT: Gỡ bỏ 'truncate'. Thêm 'break-words' và 'whitespace-pre-wrap' 
              để hiển thị trọn vẹn nội dung textarea bao gồm cả xuống dòng.
          */}
          <p className={`text-sm font-medium tracking-tight break-words whitespace-pre-wrap leading-relaxed ${
            isDone ? 'line-through text-slate-400' : 'text-slate-900'
          }`}>
            {task.content}
          </p>
          
          {/* TIẾN ĐỘ: Màu nhấn Xanh đậm #2563EB trên nền Slate nhạt */}
          {isMultiTarget && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] bg-slate-50 text-[#2563EB] border border-slate-200 px-2 py-0.5 rounded-[4px] font-mono font-bold">
                {task.doneCount ?? 0} / {task.targetCount} {task.unit || ''}
              </span>
            </div>
          )}
        </div>

        {/* Tags phân loại: Tối giản hóa màu sắc */}
        <div className="flex flex-wrap gap-2">
          {task.tags?.filter(t => !t.startsWith('d:') && !t.startsWith('m:') && !t.startsWith('freq:')).map(tag => (
            <span key={tag} className="text-[8px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              #{tag.split(':')[1] || tag}
            </span>
          ))}
        </div>
      </div>

      {/* ACTION GROUP: Sử dụng flex-shrink-0 để đảm bảo cột nút bấm không bị văn bản đè bẹp trên iPhone.
          Trên Mobile (touch), nút luôn hiển thị (opacity-100), trên Desktop ẩn và hiện khi hover.
      */}
      <div className="flex-shrink-0 flex items-start gap-1 pt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => { triggerHaptic('light'); openEditModal(task); }}
          className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
          Sửa
        </button>
        
        {!isDone && (
          /* NÚT THỰC THI: Chuyển sang màu Xanh nhấn chuẩn Linear #2563EB */
          <button 
            onClick={moveToFocus}
            className="bg-[#2563EB] text-white px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-none"
          >
            Thực thi
          </button>
        )}
      </div>
    </div>
  );
};