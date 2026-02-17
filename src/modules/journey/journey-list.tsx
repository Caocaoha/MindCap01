import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
// [NEW]: Import module Spark để hiển thị không gian ký ức độc lập
import { WidgetMemorySpark } from '../spark/components/widget-memory-spark';
// [NEW]: Import SearchBar để tích hợp vào Dynamic Header
import { SearchBar } from './components/search-bar';

/**
 * [MOD_JOURNEY]: Thành phần cha điều phối dòng thời gian và phân tích.
 * Giai đoạn 6.10: Tích hợp Dynamic Sticky Header (Ẩn/Hiện khi cuộn).
 */
export const JourneyList: React.FC = () => {
  // BẢO TỒN 100% STATE VÀ ACTION TỪ STORE (với kiểu dữ liệu viewMode mới)
  const { viewMode, setViewMode } = useJourneyStore();

  // [NEW]: State quản lý hiển thị Header (Toolbar)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * [SPARK DATA ENGINE]: Truy vấn và phân loại dữ liệu để lấp đầy 4 slots của Spark Tab.
   * Đảm bảo lấy đúng các mảnh ký ức theo tiêu chí: Heritage, Trending, Isolated, Universe.
   */
  const sparkData = useLiveQuery(async () => {
    const allTasks = await db.tasks.toArray();
    const allThoughts = await db.thoughts.toArray();
    // Gộp và sắp xếp theo thời gian để làm cơ sở lọc
    const allEntries = [...allTasks, ...allThoughts].sort((a, b) => b.createdAt - a.createdAt);

    if (allEntries.length === 0) return null;

    return {
      slots: {
        // Slot 1: Heritage (Bản ghi cổ xưa nhất trong hệ thống)
        slot1: allEntries[allEntries.length - 1],
        
        // Slot 2: Universe (Một mảnh ký ức ngẫu nhiên để tạo sự bất ngờ)
        slot2: allEntries[Math.floor(Math.random() * allEntries.length)],
        
        // Slot 3: Trending (Bản ghi có điểm tương tác cao nhất)
        slot3: [...allEntries].sort((a, b) => (b.interactionScore || 0) - (a.interactionScore || 0))[0],
        
        // Slot 4: Isolated (Bản ghi cô đơn nhất - ít liên kết Echo nhất)
        slot4: [...allEntries].sort((a, b) => (a.echoLinkCount || 0) - (b.echoLinkCount || 0))[0]
      }
    };
  }, []);

  /**
   * [SCROLL LOGIC]: Xử lý ẩn hiện Header dựa trên hướng cuộn.
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Bỏ qua các thay đổi nhỏ hoặc scroll âm (elastic scroll trên iOS)
    if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
    if (currentScrollY < 0) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      // Đang cuộn xuống & qua ngưỡng -> Ẩn Header
      setIsHeaderVisible(false);
    } else {
      // Đang cuộn lên -> Hiện Header
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
    /* CONTAINER: Relative để chứa Absolute Header */
    <div className="h-full relative bg-white font-sans overflow-hidden">
      
      {/* [DYNAMIC HEADER]: Chứa Tab Switcher + Search Bar.
        Logic: Absolute Top, trượt lên (-translate-y-full) khi cuộn xuống.
      */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-transform duration-300 ease-in-out shadow-sm ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex flex-col gap-4 py-4">
          {/* TAB SWITCHER: Phong cách Segmented Control */}
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

          {/* SEARCH BAR: Tích hợp vào Header để ẩn hiện đồng bộ */}
          <div className="px-4">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* [MAIN CONTENT]: Scrollable Area.
        Bổ sung pt-36 (khoảng 144px) để nội dung không bị Header che khuất lúc đầu.
      */}
      <main 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-2 pt-36 pb-32 custom-scrollbar scroll-smooth"
      >
        {viewMode === 'diary' && (
          <div className="animate-in fade-in duration-500">
            {/* Chế độ Diary: Danh sách nhật ký, logic Entropy & Hạt giống */}
            <LivingMemory />
          </div>
        )}
        
        {viewMode === 'stats' && (
          <div className="animate-in fade-in duration-500">
            {/* Chế độ Stats: Hiển thị Profile & Biểu đồ hiệu suất */}
            <ReflectiveMirror />
          </div>
        )}

        {viewMode === 'spark' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Chế độ Spark: Không gian phản tư ký ức độc lập */}
            <WidgetMemorySpark data={sparkData} />
          </div>
        )}
      </main>
    </div>
  );
};