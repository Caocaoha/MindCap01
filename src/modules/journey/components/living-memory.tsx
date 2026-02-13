import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useJourneyStore } from '../../../store/journey-store';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
import { BookmarkReasonModal } from './bookmark-reason-modal';

/**
 * [MOD_JOURNEY]: Thành phần hiển thị danh sách nhật ký sống động.
 * Tích hợp logic Entropy (tan rã) và Action Hub 3 phân vùng.
 */
export const LivingMemory: React.FC = () => {
  // --- STORE ACTIONS & STATES ---
  const { 
    calculateOpacity, 
    hiddenIds, 
    toggleHide, 
    setLinkingItem, 
    isDiaryEntry 
  } = useJourneyStore(); //

  const { openEditModal, setInputFocused } = useUiStore(); //

  // --- LOCAL UI STATES ---
  const [bookmarkTarget, setBookmarkTarget] = useState<any | null>(null);

  /**
   * Truy vấn dữ liệu từ IndexedDB: Trộn Task và Thought vào một dòng thời gian.
   * Logic: Lọc bỏ các mục ẩn và sắp xếp mới nhất ở trên cùng.
   */
  const entries = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    const thoughts = await db.thoughts.toArray();
    
    return [...tasks, ...thoughts]
      .filter(item => isDiaryEntry(item) && !hiddenIds.includes(item.id as number)) // Lọc theo logic Store
      .sort((a, b) => b.createdAt - a.createdAt); // Sắp xếp giảm dần
  }, [hiddenIds]);

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
    <div className="flex flex-col gap-6 pb-40">
      {entries?.map((item: any) => {
        const opacity = calculateOpacity(item.createdAt, item.isBookmarked); //
        const isTask = 'status' in item;

        return (
          <div 
            key={`${isTask ? 'task' : 'thought'}-${item.id}`}
            style={{ opacity }}
            className="flex items-center gap-4 group bg-zinc-900/20 p-5 rounded-[2rem] border border-white/5 transition-all hover:bg-zinc-900/40 hover:border-white/10"
          >
            
            {/* --- 1. CỤM TRÁI: INCEPTION (Khởi tạo & Liên kết) --- */}
            <div className="flex flex-col gap-5 opacity-20 group-hover:opacity-100 transition-opacity">
              {/* Nút Bookmark */}
              <button 
                onClick={() => !item.isBookmarked && setBookmarkTarget(item)}
                className={`transition-all active:scale-90 ${item.isBookmarked ? 'text-yellow-500 opacity-100' : 'hover:text-yellow-500'}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={item.isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>

              {/* Nút Tạo Liên kết (Context Link) */}
              <button 
                onClick={() => { 
                  if (item.id) {
                    triggerHaptic('light'); 
                    setLinkingItem({ id: item.id, type: isTask ? 'task' : 'thought' }); 
                    setInputFocused(true); 
                  }
                }}
                className="hover:text-blue-400 active:scale-90 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {/* --- 2. TRUNG TÂM: NỘI DUNG (Living Memory) --- */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border ${isTask ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 'border-purple-500/20 text-purple-500 bg-purple-500/5'}`}>
                  {isTask ? 'ACTION' : 'REFLECTION'}
                </span>
              </div>
              
              <p className="text-sm text-white/90 leading-relaxed italic font-serif line-clamp-4">
                {item.content}
              </p>

              {/* Hiển thị lý do gieo hạt nếu có */}
              {item.isBookmarked && item.bookmarkReason && (
                <div className="mt-3 flex items-start gap-2">
                  <span className="text-yellow-500 text-[10px]">✦</span>
                  <p className="text-[10px] text-yellow-500/60 italic font-medium">
                    {item.bookmarkReason}
                  </p>
                </div>
              )}
            </div>

            {/* --- 3. CỤM PHẢI: CONTROL (Hiệu chỉnh & Điều phối) --- */}
            <div className="flex flex-col gap-5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Nút Chỉnh sửa */}
              <button 
                onClick={() => { triggerHaptic('light'); openEditModal(item); }}
                className="hover:text-green-400 active:scale-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>

              {/* Nút Ẩn mềm (Soft Delete) */}
              <button 
                onClick={() => { 
                  if (item.id) { // Kiểm tra id chắc chắn là number
                    triggerHaptic('medium'); 
                    toggleHide(item.id); 
                  }
                }} 
                className="hover:text-red-500 active:scale-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
      
      {/* Empty State khi không có bản ghi nào */}
      {entries?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <p className="text-[10px] uppercase font-black tracking-widest italic">Vùng ký ức đang trống...</p>
        </div>
      )}
    </div>
  );
};