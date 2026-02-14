import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';

/**
 * [MOD_JOURNEY_UI]: Biểu đồ nhịp điệu thói quen lặp lại.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Đặc điểm: Thay thế dots bo tròn bằng các khối màu phẳng (Flat Heatmap).
 */
export const HabitRhythm: React.FC = () => {
  // BẢO TỒN 100% LOGIC TRUY VẤN
  const habits = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    // Lọc theo tag freq: hoặc logic frequency != 'once' nếu có trường dữ liệu
    return tasks.filter(t => t.tags?.some(tag => tag.startsWith('freq:')));
  }, []);

  if (!habits || habits.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* HEADER: Chuyển sang Slate-400 font bold chuẩn Linear */}
      <h4 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase px-2">
        Nhịp điệu thói quen
      </h4>
      
      <div className="grid grid-cols-1 gap-2">
        {habits.map(h => {
          // BẢO TỒN 100% BIẾN VÀ LOGIC TÍNH TOÁN
          const goal = parseInt(h.tags?.find(t => t.startsWith('freq:'))?.split(':')[1] || '1');
          const current = h.status === 'done' ? goal : 0; // Logic tạm thời theo file gốc

          return (
            /* CARD: Nền trắng, Border Slate mảnh, Bo góc 6px */
            <div 
              key={h.id} 
              className="bg-white border border-slate-200 p-4 rounded-[6px] flex items-center justify-between transition-colors hover:border-slate-300"
            >
              {/* TEXT: Slate-900 font medium */}
              <span className="text-sm font-medium text-slate-900 tracking-tight">
                {h.content}
              </span>

              {/* RHYTHM INDICATORS: Chuyển sang dạng khối chữ nhật phẳng (Linear Heatmap style) */}
              <div className="flex gap-1">
                {Array.from({ length: goal }).map((_, i) => (
                  <div 
                    key={i} 
                    /* INDICATOR: Xanh nhấn #2563EB cho active, Slate-100 cho inactive */
                    className={`w-4 h-1.5 rounded-[2px] transition-colors ${
                      i < current ? 'bg-[#2563EB]' : 'bg-slate-100'
                    }`} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};