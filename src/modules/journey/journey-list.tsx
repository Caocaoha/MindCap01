import React from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
import { SearchBar } from './components/search-bar';

/**
 * [MOD_JOURNEY]: Thành phần cha điều phối dòng thời gian và phân tích.
 * Giai đoạn 4: Chuyển đổi sang thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Tuân thủ quy tắc kebab-case và bảo tồn logic Store.
 */
export const JourneyList: React.FC = () => {
  // BẢO TỒN 100% STATE VÀ ACTION TỪ STORE
  const { viewMode, setViewMode } = useJourneyStore();

  return (
    /* CONTAINER: Nền trắng tuyệt đối, font Inter */
    <div className="h-full flex flex-col pt-6 bg-white font-sans">
      
      {/* HEADER: Chứa Tab Switcher và SearchBar */}
      <header className="px-2 mb-8 space-y-6">
        
        {/* TAB SWITCHER: Phong cách Segmented Control của Linear.app */}
        <div className="flex bg-slate-50 p-1 rounded-[6px] border border-slate-200 w-fit mx-auto transition-all">
          {(['diary', 'stats'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => {
                // Giữ nguyên logic setViewMode
                setViewMode(mode);
              }}
              className={`px-8 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all 
                ${viewMode === mode 
                  /* Active: Nền trắng, Border Slate mảnh, Chữ đậm Slate-900 */
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-none scale-100' 
                  /* Inactive: Chữ Slate nhạt, Hover Slate đậm */
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {mode === 'diary' ? 'Nhật ký' : 'Chỉ số'}
            </button>
          ))}
        </div>

        {/* SEARCH BAR: Chỉ hiển thị khi ở tab Nhật ký */}
        {viewMode === 'diary' && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            <SearchBar />
          </div>
        )}
      </header>

      {/* MAIN CONTENT Area: Cuộn mượt với whitespace lớn */}
      <main className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {viewMode === 'diary' ? (
          <div className="animate-in fade-in duration-500">
            <LivingMemory />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <ReflectiveMirror />
          </div>
        )}
      </main>
    </div>
  );
};