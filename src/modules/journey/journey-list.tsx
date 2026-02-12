import React, { useEffect } from 'react';
import { useJourneyStore } from '../../store/journey-store'; // [STATE]
import { db } from '../../database/db'; // [CORE]
import type { ITask } from '../../database/types';

export const JourneyList: React.FC = () => {
  const { entries, setEntries, removeEntry } = useJourneyStore();

  // 1. Initial Load: Lấy dữ liệu từ Local DB khi component mount
  useEffect(() => {
    const loadData = async () => {
      // Lấy 50 items mới nhất
      const history = await db.tasks
        .orderBy('createdAt')
        .reverse()
        .limit(50)
        .toArray();
      setEntries(history);
    };
    loadData();
  }, [setEntries]);

  // Hàm xóa (để test tính năng dọn dẹp)
  const handleDelete = async (id: number) => {
    if (!id) return;
    await db.tasks.delete(id); // Xóa trong DB
    removeEntry(id); // Xóa trong Store
  };

  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-20">
        <p>Hành trình vạn dặm bắt đầu từ một bước chân.</p>
        <p className="text-sm">Hãy nhập thử: "Họp team @marketing #urgent"</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-32 pt-6 px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dòng thời gian</h2>
      
      <div className="space-y-4">
        {entries.map((item: any) => (
          <div 
            key={item.id} 
            className={`
              relative p-4 rounded-xl border transition-all duration-300
              ${item.status === 'success' ? 'bg-white border-gray-200 shadow-sm' : ''}
              ${item.status === 'processing' ? 'bg-blue-50 border-blue-200 animate-pulse' : ''}
              ${item.status === 'pending' ? 'bg-gray-50 border-gray-100 opacity-70' : ''}
            `}
          >
            {/* Header: Status Indicator & Time */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <StatusDot status={item.status} />
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-gray-300 hover:text-red-500 transition-colors"
                title="Xóa"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-800 text-lg font-medium leading-relaxed">
              {item.title}
            </p>

            {/* Footer: Tags & Mentions (Kết quả từ Shadow Lane) */}
            {(item.tags?.length > 0 || item.linkedTaskIds?.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-dashed border-gray-100">
                {/* Hiển thị Tags */}
                {item.tags?.map((tag: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md font-semibold">
                    #{tag}
                  </span>
                ))}
                
                {/* Hiển thị Linked IDs (Giả lập Echo Service) */}
                {item.linkedTaskIds?.length > 0 && (
                  <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded-md flex items-center gap-1">
                    <span>🔗</span> {item.linkedTaskIds.length} liên kết
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Sub-component: Hiển thị chấm trạng thái
const StatusDot = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <span className="w-2 h-2 rounded-full bg-gray-400" title="Đang chờ..." />;
    case 'processing':
      return <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" title="Đang xử lý NLP..." />;
    case 'success':
      return <span className="w-2 h-2 rounded-full bg-green-500" title="Đã đồng bộ & Phân loại" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-red-500" />;
  }
};