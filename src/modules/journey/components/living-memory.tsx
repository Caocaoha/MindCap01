import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useJourneyStore } from '../../../store/journey-store';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
import { BookmarkReasonModal } from './bookmark-reason-modal';
import { SearchBar } from '../../../components/shared/search-bar'; 
import { matchesSearch } from '../../../utils/nlp-engine'; 

/**
 * [MOD_JOURNEY]: Thành phần hiển thị danh sách nhật ký sống động.
 * Giai đoạn 4.5: Tích hợp Hệ thống Tìm kiếm Hợp nhất & Tối ưu hóa iPhone.
 * [FIX]: Khắc phục lỗi TS2339 bằng cách kiểm tra thuộc tính 'tags' an toàn.
 */
export const LivingMemory: React.FC = () => {
  // --- STORE ACTIONS & STATES (Bảo tồn 100%) ---
  const { 
    calculateOpacity, 
    hiddenIds, 
    toggleHide, 
    setLinkingItem, 
    isDiaryEntry 
  } = useJourneyStore(); 

  const { openEditModal, setInputFocused, searchQuery } = useUiStore(); 

  // --- LOCAL UI STATES ---
  const [bookmarkTarget, setBookmarkTarget] = useState<any | null>(null);

  /**
   * Truy vấn dữ liệu từ IndexedDB (Bảo tồn 100% logic trộn Task/Thought)
   * Đã tích hợp logic lọc tìm kiếm Worker-side.
   */
  const entries = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    const thoughts = await db.thoughts.toArray();
    
    return [...tasks, ...thoughts]
      .filter(item => {
        // Kiểm tra điều kiện hiển thị cơ bản (Diary & Hidden)
        const isValidEntry = isDiaryEntry(item) && !hiddenIds.includes(item.id as number);
        if (!isValidEntry) return false;

        /**
         * [FIX]: Truy cập 'tags' một cách an toàn. 
         * Vì IThought không có tags trong types.ts, chúng ta truyền undefined nếu không tồn tại.
         */
        const itemTags = 'tags' in item ? item.tags : undefined;

        // Áp dụng bộ máy tìm kiếm chuẩn hóa
        return matchesSearch(item.content, itemTags, searchQuery);
      }) 
      .sort((a, b) => b.createdAt - a.createdAt); 
  }, [hiddenIds, searchQuery]);

  /**
   * Xử lý xác nhận Gieo hạt ký ức (Bookmark)
   */
  const handleBookmarkConfirm = async (reason: string) => {
    if (!bookmarkTarget?.id) return;
    
    const table = 'status' in bookmarkTarget ? db.tasks : db.thoughts;
    await table.update(bookmarkTarget.id, { 
      isBookmarked: true, 
      bookmarkReason: reason 
    });
    
    setBookmarkTarget(null);
  };

  return (
    <div className="flex flex-col gap-3 pb-40">
      
      {/* Thanh tìm kiếm dùng chung */}
      <div className="mb-2 px-1">
        <SearchBar context="journey" placeholder="Tìm kiếm trong vùng ký ức..." />
      </div>

      {entries?.map((item: any) => {
        const entropyOpacity = calculateOpacity(item.createdAt, item.isBookmarked); 
        const isTask = 'status' in item;

        return (
          /* CARD CONTAINER: Tối ưu iPhone (Vertical Expansion) */
          <div 
            key={`${isTask ? 'task' : 'thought'}-${item.id}`}
            className="flex items-start gap-4 group bg-white p-4 rounded-[6px] border border-slate-200 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-none"
          >
            
            {/* --- 1. CỤM TRÁI: INCEPTION --- */}
            <div className="flex-shrink-0 flex flex-col gap-5 pt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => !item.isBookmarked && setBookmarkTarget(item)}
                className={`transition-all active:scale-90 ${item.isBookmarked ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={item.isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>

              <button 
                onClick={() => { 
                  if (item.id) {
                    triggerHaptic('light'); 
                    setLinkingItem({ id: item.id, type: isTask ? 'task' : 'thought' }); 
                    setInputFocused(true); 
                  }
                }}
                className="text-slate-400 hover:text-[#2563EB] active:scale-90 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {/* --- 2. TRUNG TÂM: NỘI DUNG --- */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-[4px] border border-slate-200 text-slate-500 bg-slate-50`}>
                  {isTask ? 'ACTION' : 'REFLECTION'}
                </span>
              </div>
              
              <p 
                style={{ color: `rgba(15, 23, 42, ${entropyOpacity})` }}
                className="text-sm leading-relaxed italic font-medium tracking-tight break-words whitespace-pre-wrap"
              >
                {item.content}
              </p>

              {item.isBookmarked && item.bookmarkReason && (
                <div className="mt-3 flex items-start gap-1.5 bg-blue-50/30 p-2 rounded-[4px] border border-blue-100/50">
                  <span className="text-[#2563EB] text-[10px] mt-0.5">✦</span>
                  <p className="text-[10px] text-[#2563EB] italic font-medium leading-relaxed">
                    {item.bookmarkReason}
                  </p>
                </div>
              )}
            </div>

            {/* --- 3. CỤM PHẢI: CONTROL --- */}
            <div className="flex-shrink-0 flex flex-col gap-5 pt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { triggerHaptic('light'); openEditModal(item); }}
                className="text-slate-400 hover:text-slate-900 active:scale-90 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>

              <button 
                onClick={() => { 
                  if (item.id) {
                    triggerHaptic('medium'); 
                    toggleHide(item.id); 
                  }
                }} 
                className="text-slate-400 hover:text-red-500 active:scale-90 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {/* MODAL NHẬP LÝ DO BOOKMARK */}
      <BookmarkReasonModal 
        isOpen={!!bookmarkTarget} 
        onClose={() => setBookmarkTarget(null)} 
        onConfirm={handleBookmarkConfirm} 
      />
      
      {/* Empty State */}
      {entries?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
            {searchQuery ? 'Không tìm thấy kết quả phù hợp...' : 'Vùng ký ức đang trống...'}
          </p>
        </div>
      )}
    </div>
  );
};