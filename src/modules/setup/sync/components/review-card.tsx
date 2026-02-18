/**
 * Purpose: Hiển thị nội dung tối giản cho chế độ duyệt ý tưởng (Tinder UI).
 * Inputs: item (ITask | IThought).
 * Outputs: JSX.Element.
 * Business Rule: 
 * - Loại bỏ Header Badge, Date và Title để tối ưu diện tích hiển thị.
 * - Bổ sung chỉ dẫn hướng vuốt (Swipe Hints) ngang hàng với Score.
 * - Tự động chèn nội dung bookmarkReason nếu bản ghi có đánh dấu bookmark.
 */

import React from 'react';

interface ReviewCardProps {
  item: any;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ item }) => {
  return (
    <div className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col relative overflow-hidden select-none">
      
      {/* Background Decor: Phân biệt nhẹ nhàng qua màu sắc nền */}
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-10 -mt-10 rounded-full ${
        item._dbTable === 'tasks' ? 'bg-blue-500' : 'bg-purple-500'
      }`} />

      {/* Header: Score & Swipe Instructions */}
      <header className="flex justify-between items-center mb-8">
        {/* Swipe Instructions: Chỉ dẫn cho người dùng mới */}
        <div className="flex gap-4 items-center opacity-30">
          <div className="flex flex-col items-center">
            <span className="text-xs font-black">←</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Skip</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-black">→</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Sync</span>
          </div>
        </div>
        
        {/* Interaction Score Badge */}
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-slate-900 leading-none">
            {item.interactionScore || 0}
          </span>
          <span className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Score</span>
        </div>
      </header>

      {/* Main Content: Chỉ hiển thị nội dung thuần túy */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <p className="text-slate-600 leading-relaxed text-sm font-medium whitespace-pre-wrap">
          {item.content}
        </p>
        
        {/* Bookmark Integration: Tự động hiển thị lý do bookmark */}
        {item.isBookmarked && (
          <div className="mt-6 pt-6 border-t border-slate-50">
            <p className="text-[11px] leading-relaxed text-slate-400 italic">
              <span className="font-black uppercase text-[8px] not-italic mr-2 text-yellow-600/60 tracking-widest">
                bookmark:
              </span>
              {item.bookmarkReason || "Ghi chú quan trọng"}
            </p>
          </div>
        )}
      </main>

      {/* Footer: Tags mapping (Giữ lại để hỗ trợ phân loại Obsidian) */}
      <footer className="mt-6 pt-6 border-t border-slate-50">
        <div className="flex flex-wrap gap-2">
          {(item.suggestedTags || item.tags || []).length > 0 ? (
            (item.suggestedTags || item.tags).map((tag: string, idx: number) => (
              <span key={idx} className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-100">
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-300 italic font-medium">Chưa có nhãn gợi ý</span>
          )}
        </div>
      </footer>
    </div>
  );
};