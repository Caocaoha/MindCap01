import React from 'react';
import { useJourneyStore } from '../../../store/journey-store';

/**
 * [MOD_JOURNEY_UI]: Thanh tìm kiếm toàn văn bản trong vùng ký ức.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Bảo tồn 100% logic Store và tên biến.
 */
export const SearchBar: React.FC = () => {
  // BẢO TỒN 100% TRẠNG THÁI TỪ STORE
  const { searchQuery, setSearchQuery } = useJourneyStore();

  return (
    /* CONTAINER: Giữ nguyên cấu trúc relative và group để xử lý hiệu ứng focus */
    <div className="relative w-full group">
      
      {/* ICON TÌM KIẾM: Chuyển sang màu Slate-400 chuẩn Linear */}
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 opacity-40 group-focus-within:text-[#2563EB] group-focus-within:opacity-100 transition-all">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* INPUT: Nền trắng, Border Slate mảnh, Bo góc 6px, Không bóng đổ */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Tìm kiếm trong vùng ký ức..."
        className="w-full bg-white border border-slate-200 rounded-[6px] py-2.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-none"
      />
    </div>
  );
};