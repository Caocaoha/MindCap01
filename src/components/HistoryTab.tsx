import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Calendar, ArrowDownCircle, Loader2 } from 'lucide-react';

export const HistoryTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(20); // Mặc định tải 20 dòng đầu

  // Logic Query thông minh
  const { historyGroups, hasMore } = useLiveQuery(async () => {
    let collection = db.entries.orderBy('created_at').reverse();
    
    // Search Logic: Filter thủ công vì Dexie không hỗ trợ Full-text index mặc định
    if (searchTerm) {
      collection = collection.filter(e => 
        e.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lấy dư 1 item để check xem còn dữ liệu không (Peek next)
    const items = await collection.limit(limit + 1).toArray();
    
    const hasMoreItems = items.length > limit;
    const displayItems = hasMoreItems ? items.slice(0, limit) : items;

    // Grouping Logic
    const groups: Record<string, typeof displayItems> = {};
    displayItems.forEach(item => {
      if (!groups[item.date_str]) groups[item.date_str] = [];
      groups[item.date_str].push(item);
    });

    return { historyGroups: groups, hasMore: hasMoreItems };
  }, [searchTerm, limit]) || { historyGroups: {}, hasMore: false };

  const dates = Object.keys(historyGroups).sort().reverse();

  return (
    <div className="pb-24 space-y-6"> {/* Tăng pb để tránh nút Load More bị che bởi Nav */}
      
      {/* Search Input */}
      <div className="relative sticky top-0 z-20 bg-white py-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text"
          placeholder="Tìm kiếm ký ức..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setLimit(20); // Reset limit khi search
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Render Lists (Giữ nguyên logic render item cũ...) */}
      <div className="space-y-6">
        {dates.map(date => (
            // ... (Code render groups giữ nguyên như bản trước)
             <div key={date}>
                {/* ... Header Date ... */}
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={12} className="text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</h3>
                </div>
                {/* ... Items ... */}
                 <div className="space-y-3 pl-2 border-l border-slate-100 ml-1.5">
                    {historyGroups[date].map(item => (
                         <div key={item.id} className="pl-4 text-sm text-slate-700 py-1">
                             <p className="line-clamp-2">{item.content}</p> 
                             {/* (Rút gọn code hiển thị để tập trung logic) */}
                         </div>
                    ))}
                 </div>
             </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <button 
          onClick={() => setLimit(prev => prev + 20)}
          className="w-full py-3 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <ArrowDownCircle size={16} />
          Xem thêm cũ hơn
        </button>
      )}

      {!hasMore && dates.length > 0 && (
          <p className="text-center text-xs text-slate-300 pt-4">Đã hiển thị toàn bộ lịch sử.</p>
      )}
    </div>
  );
};