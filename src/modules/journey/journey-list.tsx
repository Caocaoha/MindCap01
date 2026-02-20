import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../database/db';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
// [NEW]: Import module Spark để hiển thị không gian ký ức độc lập
import { WidgetMemorySpark } from '../spark/components/widget-memory-spark';
// [NEW]: Import WidgetProvider để đồng bộ hóa dữ liệu tập trung
import { WidgetProvider } from '../spark/widget-provider';

/**
 * [MOD_JOURNEY]: Thành phần cha điều phối dòng thời gian và phân tích (v6.14).
 * Giai đoạn 6.34: 
 * [FIX]: Đồng bộ hóa dữ liệu Spark với WidgetProvider để nút Manual Refresh hoạt động.
 */
export const JourneyList: React.FC = () => {
  const { viewMode, setViewMode } = useJourneyStore();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * [SPARK DATA STATE]: Quản lý dữ liệu Widget tập trung.
   * Chuyển đổi từ useLiveQuery sang State-driven để lắng nghe sự kiện từ Provider.
   */
  const [sparkData, setSparkData] = useState<any>(null);

  /**
   * [SPARK SYNC LOGIC]: Thiết lập cầu nối dữ liệu giữa Provider và UI.
   */
  useEffect(() => {
    // 1. Lấy dữ liệu khởi tạo khi Tab Spark được nạp
    const loadInitialData = async () => {
      try {
        const timeline = await WidgetProvider.GetWidgetTimeline();
        if (timeline && timeline.length > 0) {
          // Lấy mốc hiện tại (thường là snapshot đầu tiên trong timeline)
          setSparkData(timeline[0]);
        }
      } catch (err) {
        console.error("[JourneyList] Lỗi nạp dữ liệu Spark:", err);
      }
    };

    loadInitialData();

    /**
     * 2. LẮNG NGHE SỰ KIỆN REFRESH:
     * Khi WidgetProvider thực hiện manualRefresh(), nó phát sự kiện 'spark:data-updated'
     * kèm theo Snapshot mới trong detail.
     */
    const handleSparkUpdate = (event: any) => {
      if (event.detail) {
        setSparkData(event.detail);
      }
    };

    window.addEventListener('spark:data-updated', handleSparkUpdate);
    
    // Cleanup: Hủy lắng nghe khi component bị unmount
    return () => {
      window.removeEventListener('spark:data-updated', handleSparkUpdate);
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
      
      {/* [DYNAMIC HEADER]: Tab Switcher */}
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
            {/* Truyền dữ liệu đồng bộ từ State vào Widget */}
            <WidgetMemorySpark data={sparkData} />
          </div>
        )}
      </main>
    </div>
  );
};