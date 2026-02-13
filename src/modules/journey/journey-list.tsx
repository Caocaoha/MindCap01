import React from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { triggerHaptic } from '../../utils/haptic';
import { ReflectiveMirror } from './components/reflective-mirror';
import { LivingMemory } from './components/living-memory';

/**
 * [MODULE]: TAB HÀNH TRÌNH (JOURNEY)
 * Entry-point điều phối hai Thẻ: Tấm gương phản chiếu & Nhật ký sống.
 */
export const JourneyList: React.FC = () => {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useJourneyStore();

  const handleTabChange = (mode: 'stats' | 'diary') => {
    if (mode !== viewMode) {
      triggerHaptic('light');
      setViewMode(mode);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-28 animate-in fade-in duration-500">
      
      {/* 1. THANH ĐIỀU HƯỚNG & TÌM KIẾM (Search & Tab Toggle) */}
      <section className="px-1 space-y-4">
        <div className="flex gap-2 p-1 bg-zinc-900/50 border border-white/5 rounded-2xl">
          <button 
            onClick={() => handleTabChange('stats')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'stats' 
                ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' 
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            Thống kê
          </button>
          <button 
            onClick={() => handleTabChange('diary')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'diary' 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            Nhật ký
          </button>
        </div>

        {/* Search Bar - Tác động trực tiếp đến LivingMemory thông qua Store */}
        <div className="relative group">
          <input 
            type="text"
            placeholder="Tìm kiếm ký ức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/20 border border-white/5 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:opacity-20"
          />
          <div className="absolute right-4 top-3.5 opacity-10 group-focus-within:opacity-30 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
      </section>

      {/* 2. KHÔNG GIAN NỘI DUNG (Content Area) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'stats' ? (
          /* THẺ 1: TẤM GƯƠNG PHẢN CHIẾU */
          <ReflectiveMirror />
        ) : (
          /* THẺ 2: NHẬT KÝ SỐNG */
          <LivingMemory />
        )}
      </main>

    </div>
  );
};