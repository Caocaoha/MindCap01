import React from 'react';
import { useUserStore } from '../../../store/user-store';

/**
 * [MOD_JOURNEY_UI]: Hiển thị hồ sơ căn tính, cấp độ và năng lượng Ea.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Đặc điểm: Chuyển đổi typography từ Serif sang Inter Bold, tối giản hóa thanh tiến độ.
 */
export const UserIdentityProfile: React.FC = () => {
  // BẢO TỒN 100% DỮ LIỆU TỪ STORE
  const { currentLevel, eaScore, archetype } = useUserStore();
  
  // Giả sử mỗi level cần 100 điểm eaScore (Bảo tồn logic gốc)
  const progress = eaScore % 100;

  return (
    /* CONTAINER: Nền trắng, Border Slate-200 mảnh 1px, Bo góc 6px, Không bóng đổ */
    <section className="bg-white p-6 rounded-[6px] border border-slate-200 shadow-none mb-6 transition-all hover:border-slate-300">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          {/* ARCHETYPE: Chuyển sang màu Slate-400 chuẩn Linear */}
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            {archetype.replace('-', ' ')}
          </h3>
          
          {/* LEVEL: Thay đổi từ Serif Italic sang Inter Bold màu Slate-900 để tăng tính đọc */}
          <div className="text-3xl font-bold tracking-tighter text-slate-900">
            Level {currentLevel}
          </div>
        </div>

        <div className="text-right space-y-2">
          {/* LABEL: Màu Slate-400 nhạt */}
          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">
            Action Energy (Ea)
          </span>
          
          {/* PROGRESS BAR: Phong cách Linear phẳng, Xanh nhấn #2563EB */}
          <div className="w-32 h-1.5 bg-slate-100 rounded-[2px] overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-[#2563EB] transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};