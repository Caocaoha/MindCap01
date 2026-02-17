import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [COMPONENT]: Thanh điều hướng đáy (Bottom Navigation).
 * Tách biệt từ App.tsx để quản lý logic tập trung.
 * - Đảm bảo nhãn "To.Morrow" không bị đổi thành "History".
 * - Hiển thị chỉ báo gạch chân xanh khi Tab đang Active.
 */
export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();

  const handleTabChange = (tabId: 'saban' | 'mind' | 'journey') => {
    triggerHaptic(tabId === 'mind' ? 'medium' : 'light');
    setActiveTab(tabId);
  };

  return (
    <div className="flex items-center justify-between px-10 h-full w-full">
      {/* TODO TAB */}
      <button 
        onClick={() => handleTabChange('saban')} 
        className="relative h-full flex flex-col items-center justify-center outline-none group"
      >
        <span className={`text-[11px] font-bold transition-colors ${
          activeTab === 'saban' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          Todo
        </span>
        {/* Active Indicator: Gạch chân xanh */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#2563EB] transition-all duration-300 ${
          activeTab === 'saban' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`} />
      </button>

      {/* TODAY TAB */}
      <button 
        onClick={() => handleTabChange('mind')} 
        className={`px-8 py-2 rounded-[6px] font-bold uppercase text-[10px] tracking-widest transition-all outline-none ${
          activeTab === 'mind' 
            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30' 
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        Today
      </button>

      {/* TO.MORROW TAB - Bảo tồn tên nhãn theo yêu cầu */}
      <button 
        onClick={() => handleTabChange('journey')} 
        className="relative h-full flex flex-col items-center justify-center outline-none group"
      >
        <span className={`text-[11px] font-bold transition-colors ${
          activeTab === 'journey' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
        }`}>
          To.Morrow
        </span>
        {/* Active Indicator: Gạch chân xanh */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#2563EB] transition-all duration-300 ${
          activeTab === 'journey' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`} />
      </button>
    </div>
  );
};