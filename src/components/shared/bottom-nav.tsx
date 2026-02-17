import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [COMPONENT]: Thanh điều hướng đáy (Bottom Navigation).
 * Giai đoạn 4.9: Fix lỗi hiển thị nhãn và chỉ báo trạng thái.
 * - Center: Nút Today dạng khối (Giữ nguyên).
 * - Sides: Todo & To.Morrow có gạch chân xanh khi active.
 * - Label: Đảm bảo hiển thị đúng "To.Morrow" thay vì "History".
 */
export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();

  const handleTabChange = (tabId: 'saban' | 'mind' | 'journey') => {
    triggerHaptic(tabId === 'mind' ? 'medium' : 'light');
    setActiveTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between h-16 max-w-md mx-auto px-6 relative">
        
        {/* --- 1. LEFT: TODO (Saban) --- */}
        <button
          onClick={() => handleTabChange('saban')}
          className="relative flex flex-col items-center justify-center h-full w-24 group outline-none"
        >
          <span className={`text-[11px] font-bold transition-colors duration-300 ${
            activeTab === 'saban' ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            Todo
          </span>
          {/* Active Indicator: Gạch chân màu xanh - Hiển thị khi activeTab === 'saban' */}
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#2563EB] transition-all duration-300 ${
            activeTab === 'saban' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`} />
        </button>

        {/* --- 2. CENTER: TODAY (Mind) --- */}
        <button
          onClick={() => handleTabChange('mind')}
          className={`px-8 py-2.5 rounded-[8px] flex items-center justify-center transition-all duration-300 transform outline-none ${
            activeTab === 'mind' 
              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30 scale-105' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 scale-100'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            Today
          </span>
        </button>

        {/* --- 3. RIGHT: TO.MORROW (Journey) --- */}
        <button
          onClick={() => handleTabChange('journey')}
          className="relative flex flex-col items-center justify-center h-full w-24 group outline-none"
        >
          {/* Đảm bảo tên là To.Morrow theo yêu cầu */}
          <span className={`text-[11px] font-bold transition-colors duration-300 ${
            activeTab === 'journey' ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            To.Morrow
          </span>
          {/* Active Indicator: Gạch chân màu xanh - Hiển thị khi activeTab === 'journey' */}
          <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#2563EB] transition-all duration-300 ${
            activeTab === 'journey' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`} />
        </button>

      </div>
    </nav>
  );
};