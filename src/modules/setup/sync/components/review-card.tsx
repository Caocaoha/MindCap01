/**
 * Purpose: Hiển thị nội dung chi tiết của một ý tưởng (Task/Thought) trong giao diện duyệt thẻ.
 * Inputs: item (ITask | IThought), style (framer-motion props).
 * Outputs: JSX.Element.
 * Business Rule: 
 * - Ưu tiên hiển thị nội dung văn bản (Content). [cite: 3]
 * - Hiển thị điểm tương tác (Interaction Score) để người dùng đánh giá độ quan trọng. [cite: 3, 33]
 * - Hiển thị các nhãn gợi ý (Suggested Tags) phục vụ việc mapping vào Obsidian. [cite: 5]
 */

import React from 'react';

interface ReviewCardProps {
  item: any;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ item }) => {
  // Logic hiển thị ngày tháng đơn giản (chiếm < 5% logic file)
  const dateLabel = new Date(item.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col relative overflow-hidden select-none">
      {/* Background Decor: Phân biệt loại dữ liệu */}
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-10 -mt-10 rounded-full ${item._dbTable === 'tasks' ? 'bg-blue-500' : 'bg-purple-500'}`} />

      {/* Header: Metadata & Score */}
      <header className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
            item._dbTable === 'tasks' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {item._dbTable === 'tasks' ? 'Task' : 'Thought'} [cite: 10]
          </span>
          <p className="text-[10px] text-slate-300 font-medium ml-1">{dateLabel}</p>
        </div>
        
        {/* Interaction Score Badge [cite: 3, 33] */}
        <div className="flex flex-col items-end">
          <span className="text-xl font-black text-slate-900 leading-none">
            {item.interactionScore || 0}
          </span>
          <span className="text-[7px] font-bold uppercase tracking-tighter text-slate-400">Score</span>
        </div>
      </header>

      {/* Main Content: Ý tưởng [cite: 3] */}
      <main className="flex-1 overflow-y-auto no-scrollbar py-2">
        <h3 className="text-xl font-bold text-slate-800 leading-tight tracking-tight">
          {item.title || "Chưa có tiêu đề"} [cite: 4]
        </h3>
        <p className="mt-4 text-slate-600 leading-relaxed text-sm font-medium">
          {item.content} [cite: 3]
        </p>
      </main>

      {/* Footer: Tags mapping [cite: 5, 8] */}
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