import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
// [NEW]: Import module Spark để hiển thị không gian ký ức độc lập
import { WidgetMemorySpark } from '../spark/components/widget-memory-spark';

/**
 * [MOD_JOURNEY]: Thành phần cha điều phối dòng thời gian và phân tích (v6.13).
 * Giai đoạn 6.34: 
 * 1. [UI Fix]: Loại bỏ SearchBar khỏi Header chung để tránh dư thừa.
 * 2. [UX]: Giữ SearchBar tập trung duy nhất tại LivingMemory theo yêu cầu người dùng.
 */
export const JourneyList: React.FC = () => {
  // BẢO TỒN 100% STATE VÀ ACTION TỪ STORE
  const { viewMode, setViewMode } = useJourneyStore();

  // [NEW]: State quản lý hiển thị Header (Toolbar)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * [SPARK DATA ENGINE]: Truy vấn và phân loại dữ liệu theo cơ chế "Hồ chứa" (Pooling).
   * Tuân thủ Blueprint V2.0: Heritage, Universe, Trending, Isolated.
   */
  const sparkData = useLiveQuery(async () => {
    const [tasks, thoughts] = await Promise.all([
      db.tasks.toArray(),
      db.thoughts.toArray()
    ]);

    const allEntries = [...tasks, ...thoughts];
    if (allEntries.length === 0) return null;

    const now = Date.now();
    const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
    const tenDaysAgo = now - tenDaysInMs;

    // PHÂN LOẠI CÁC HỒ CHỨA (POOLS)
    const poolHeritage = allEntries
      .filter(item => item.createdAt < tenDaysAgo && item.isBookmarked)
      .sort((a, b) => (b.echoLinkCount || 0) - (a.echoLinkCount || 0));

    const poolUniverse = allEntries
      .filter(item => item.isBookmarked)
      .sort(() => Math.random() - 0.5);

    const poolTrending = allEntries
      .filter(item => item.createdAt >= tenDaysAgo && (item.echoLinkCount || 0) > 0)
      .sort((a, b) => (b.interactionScore || 0) - (a.interactionScore || 0));

    const poolIsolated = allEntries
      .filter(item => item.createdAt >= tenDaysAgo && (item.echoLinkCount || 0) === 0)
      .sort(() => Math.random() - 0.5);

    return {
      slots: {
        slot1: poolHeritage[0] || poolUniverse[0],
        slot2: poolUniverse.find(item => item.id !== poolHeritage[0]?.id) || poolUniverse[1],
        slot3: poolTrending[0] || allEntries.sort((a, b) => (b.interactionScore || 0) - (a.interactionScore || 0))[0],
        slot4: poolIsolated[0] || allEntries[Math.floor(Math.random() * allEntries.length)]
      }
    };
  }, []);

  /**
   * [SCROLL LOGIC]: Xử lý ẩn hiện Header dựa trên hướng cuộn.
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
    if (currentScrollY < 0) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  /**
   * [RESET LOGIC]: Khi chuyển Tab, luôn hiện lại Header và cuộn về đầu.
   */
  useEffect(() => {
    setIsHeaderVisible(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  return (
    <div className="h-full relative bg-white font-sans overflow-hidden">
      
      {/* [DYNAMIC HEADER]: Chỉ còn chứa Tab Switcher */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-transform duration-300 ease-in-out shadow-sm ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex flex-col gap-4 py-4">
          <div className="flex bg-slate-50 p-1 rounded-[6px] border border-slate-200 w-fit mx-auto transition-all">
            {(['diary', 'stats', 'spark'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all 
                  ${viewMode === mode 
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-sm scale-100' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {mode === 'diary' ? 'Nhật ký' : mode === 'stats' ? 'Chỉ số' : 'Spark'}
              </button>
            ))}
          </div>
          {/* ĐÃ LOẠI BỎ SEARCHBAR TẠI ĐÂY */}
        </div>
      </div>

      <main 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-2 pt-28 pb-32 custom-scrollbar scroll-smooth"
      >
        {viewMode === 'diary' && (
          <div className="animate-in fade-in duration-500">
            <LivingMemory />
          </div>
        )}
        
        {viewMode === 'stats' && (
          <div className="animate-in fade-in duration-500">
            <ReflectiveMirror />
          </div>
        )}

        {viewMode === 'spark' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <WidgetMemorySpark data={sparkData} />
          </div>
        )}
      </main>
    </div>
  );
};