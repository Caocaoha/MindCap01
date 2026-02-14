import React from 'react';
import { UserIdentityProfile } from './user-identity-profile';
import { PerformanceChart } from './performance-chart';
import { HabitRhythm } from './habit-rhythm';

/**
 * [MOD_JOURNEY_STATS]: Chế độ gương phản chiếu (Stats & Analytics).
 * Giai đoạn 4: Thẩm mỹ Linear.app.
 * Đặc điểm: Nền trắng tuyệt đối, cấu trúc Gap-6 để tạo Whitespace, loại bỏ Shadow.
 */
export const ReflectiveMirror: React.FC = () => {
  return (
    /* CONTAINER: Sử dụng flex-col với gap-8 để tạo khoảng trắng chuẩn chuyên nghiệp.
       Animation được tinh chỉnh về duration-500 để tạo cảm giác phản hồi nhanh (Linear-speed).
    */
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500 pr-1 bg-white">
      
      {/* Mỗi module con dưới đây sẽ được đóng gói trong class .linear-card 
         (White bg, 1px Slate border, 6px radius) tại tệp định nghĩa của chúng. 
      */}

      {/* 1. Hồ sơ căn tính & Chỉ số Ea/Level */}
      <section className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
          Căn tính & Cấp độ
        </label>
        <UserIdentityProfile />
      </section>

      {/* 2. Biểu đồ hiệu suất trục kép (Entropy vs Performance) */}
      <section className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
          Phân tích hiệu suất
        </label>
        <PerformanceChart />
      </section>

      {/* 3. Ma trận nhịp điệu thói quen (Heatmap) */}
      <section className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
          Nhịp điệu thói quen
        </label>
        <HabitRhythm />
      </section>

    </div>
  );
};