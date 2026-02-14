import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useJourneyStore } from '../../../store/journey-store';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
import { BookmarkReasonModal } from './bookmark-reason-modal';

/**
 * [MOD_JOURNEY]: Thành phần hiển thị danh sách nhật ký sống động.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Cập nhật Entropy: Chuyển từ độ mờ (Opacity) sang sắc độ màu chữ (Slate-900 to Slate-300).
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

  const { openEditModal, setInputFocused } = useUiStore(); 

  // --- LOCAL UI STATES ---
  const [bookmarkTarget, setBookmarkTarget] = useState<any | null>(null);

  /**
   * Truy vấn dữ liệu từ IndexedDB (Bảo tồn 100% logic trộn Task/Thought)
   */
  const entries = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    const thoughts = await db.thoughts.toArray();
    
    return [...tasks, ...thoughts]
      .filter(item => isDiaryEntry(item) && !hiddenIds.includes(item.id as number)) 
      .sort((a, b) => b.createdAt - a.createdAt); 
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
    <div className="flex flex-col gap-3 pb-40">
      {entries?.map((item: any) => {
        // [MOD]: calculateOpacity vẫn được giữ lại nhưng áp dụng vào màu chữ thay vì container
        const entropyOpacity = calculateOpacity(item.createdAt, item.isBookmarked); 
        const isTask = 'status' in item;

        return (
          /* CARD CONTAINER: Nền trắng tuyệt đối, Border Slate mảnh, Bo góc 6px */
          <div 
            key={`${isTask ? 'task' : 'thought'}-${item.id}`}
            className="flex items-center gap-4 group bg-white p-4 rounded-[6px] border border-slate-200 transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            
            {/* --- 1. CỤM TRÁI: INCEPTION (Slate Monochrome style) --- */}
            <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Nút Bookmark: Nhấn Blue hoặc Slate-400 */}
              <button 
                onClick={() => !item.isBookmarked && setBookmarkTarget(item)}
                className={`transition-all active:scale-90 ${item.isBookmarked ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-900'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={item.isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
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
                className="text-slate-400 hover:text-[#2563EB] active:scale-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {/* --- 2. TRUNG TÂM: NỘI DUNG (Living Memory - Linear dynamic) --- */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                {/* DATE: Slate-400 font bold */}
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {/* BADGES: Flat style, Slate-50 background */}
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-[4px] border ${
                  isTask 
                    ? 'border-slate-200 text-slate-600 bg-slate-50' 
                    : 'border-slate-200 text-slate-600 bg-slate-50'
                }`}>
                  {isTask ? 'ACTION' : 'REFLECTION'}
                </span>
              </div>
              
              {/* TEXT CONTENT: Áp dụng Entropy Opacity vào màu chữ Slate-900 */}
              <p 
                style={{ color: `rgba(15, 23, 42, ${entropyOpacity})` }}
                className="text-sm leading-relaxed italic font-medium line-clamp-4 tracking-tight"
              >
                {item.content}
              </p>

              {/* Hiển thị lý do gieo hạt (Blue accent) */}
              {item.isBookmarked && item.bookmarkReason && (
                <div className="mt-2 flex items-start gap-1.5 bg-blue-50/50 p-2 rounded-[4px] border border-blue-100/50">
                  <span className="text-[#2563EB] text-[10px]">✦</span>
                  <p className="text-[10px] text-[#2563EB] italic font-medium">
                    {item.bookmarkReason}
                  </p>
                </div>
              )}
            </div>

            {/* --- 3. CỤM PHẢI: CONTROL (Hiệu chỉnh Slate style) --- */}
            <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Nút Chỉnh sửa */}
              <button 
                onClick={() => { triggerHaptic('light'); openEditModal(item); }}
                className="text-slate-400 hover:text-slate-900 active:scale-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>

              {/* Nút Ẩn mềm (Soft Delete) */}
              <button 
                onClick={() => { 
                  if (item.id) {
                    triggerHaptic('medium'); 
                    toggleHide(item.id); 
                  }
                }} 
                className="text-slate-400 hover:text-red-500 active:scale-90 transition-all"
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

      {/* MODAL NHẬP LÝ DO BOOKMARK (Bảo tồn) */}
      <BookmarkReasonModal 
        isOpen={!!bookmarkTarget} 
        onClose={() => setBookmarkTarget(null)} 
        onConfirm={handleBookmarkConfirm} 
      />
      
      {/* Empty State: Linear style */}
      {entries?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Vùng ký ức đang trống...</p>
        </div>
      )}
    </div>
  );
};