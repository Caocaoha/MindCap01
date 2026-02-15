import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
// [NEW]: Import module Spark để hiển thị không gian ký ức độc lập
import { WidgetMemorySpark } from '../spark/components/widget-memory-spark';

/**
 * [MOD_JOURNEY]: Thành phần cha điều phối dòng thời gian và phân tích.
 * Giai đoạn 6.9: Hỗ trợ Vertical Spark Flow và Footer Guard.
 */
export const JourneyList: React.FC = () => {
  // BẢO TỒN 100% STATE VÀ ACTION TỪ STORE (với kiểu dữ liệu viewMode mới)
  const { viewMode, setViewMode } = useJourneyStore();

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

  return (
    /* CONTAINER: Nền trắng tuyệt đối, font Inter */
    <div className="h-full flex flex-col pt-6 bg-white font-sans">
      
      {/* HEADER: Chứa Tab Switcher nâng cấp 3 nút */}
      <header className="px-2 mb-8 space-y-6">
        
        {/* TAB SWITCHER: Phong cách Segmented Control của Linear.app với 3 chế độ */}
        <div className="flex bg-slate-50 p-1 rounded-[6px] border border-slate-200 w-fit mx-auto transition-all">
          {(['diary', 'stats', 'spark'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => {
                // Giữ nguyên logic setViewMode (với hỗ trợ tab spark mới)
                setViewMode(mode);
              }}
              className={`px-6 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all 
                ${viewMode === mode 
                  /* Active: Nền trắng, Border Slate mảnh, Chữ đậm Slate-900 */
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-sm scale-100' 
                  /* Inactive: Chữ Slate nhạt, Hover Slate đậm */
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {mode === 'diary' ? 'Nhật ký' : mode === 'stats' ? 'Chỉ số' : 'Spark'}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTENT Area: Cuộn mượt với whitespace lớn.
          Bổ sung pb-32 (Footer Guard) để đảm bảo các thẻ Spark dài không bị Footer che khuất.
      */}
      <main className="flex-1 overflow-y-auto px-2 pb-32 custom-scrollbar">
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
            {/* Chế độ Spark: Không gian phản tư ký ức độc lập, hiển thị hàng dọc co giãn. */}
            <WidgetMemorySpark data={sparkData} />
          </div>
        )}
      </main>
    </div>
  );
};