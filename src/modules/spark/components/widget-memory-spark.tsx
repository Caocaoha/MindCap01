import React from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface WidgetSlotProps {
  label: string;
  content: string;
  type: 'task' | 'thought';
  id: number;
}

/**
 * [SUB-COMPONENT]: Thẻ hiển thị từng Slot trong Widget.
 */
const WidgetSlotCard: React.FC<WidgetSlotProps> = ({ label, content, type, id }) => {
  const handleDeepLink = () => {
    triggerHaptic('medium');
    /**
     * [DEEP LINKING]: Điều hướng thẳng tới bản ghi để "hâm nóng" tri thức.
     * Cấu trúc URL: /?open=type:id
     */
    window.location.href = `/?open=${type}:${id}`;
  };

  return (
    <div 
      onClick={handleDeepLink}
      className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-[8px] hover:border-blue-400 active:scale-[0.97] transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 group-hover:text-blue-500 transition-colors">
          {label}
        </span>
        <div className="h-1 w-1 rounded-full bg-slate-200 group-hover:bg-blue-400" />
      </div>
      <p className="text-[12px] leading-relaxed text-slate-700 font-medium line-clamp-3 italic">
        "{content}"
      </p>
    </div>
  );
};

/**
 * [COMPONENT]: Widget Memory Spark (4-Slot Layout).
 * Cửa sổ hiển thị dòng chảy ký ức theo phong cách Linear.app.
 */
export const WidgetMemorySpark: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.slots) return null;

  const { slot1, slot2, slot3, slot4 } = data.slots;

  return (
    <section className="w-full max-w-md mx-auto p-4 flex flex-col gap-4">
      {/* Header Widget */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-3 w-3 bg-blue-600 rounded-sm" />
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          Memory Spark
        </h2>
      </div>

      {/* Grid Layout: 2 cột x 2 hàng */}
      <div className="grid grid-cols-2 gap-3">
        {slot1 && (
          <WidgetSlotCard 
            label="Heritage" 
            content={slot1.content} 
            type={slot1.type || 'task'} 
            id={slot1.id} 
          />
        )}
        {slot3 && (
          <WidgetSlotCard 
            label="Trending" 
            content={slot3.content} 
            type={slot3.type || 'task'} 
            id={slot3.id} 
          />
        )}
        {slot4 && (
          <WidgetSlotCard 
            label="Isolated" 
            content={slot4.content} 
            type={slot4.type || 'task'} 
            id={slot4.id} 
          />
        )}
        {slot2 && (
          <WidgetSlotCard 
            label="Universe" 
            content={slot2.content} 
            type={slot2.type || 'task'} 
            id={slot2.id} 
          />
        )}
      </div>

      <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
        Tự động làm mới sau mỗi 3 giờ • Mind Cap Memory System
      </p>
    </section>
  );
};