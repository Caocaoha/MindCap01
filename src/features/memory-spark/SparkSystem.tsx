import React, { useState, useEffect } from 'react';
import { db } from '../core/db'; // Đường dẫn tới file cấu hình Dexie của bạn

// Định nghĩa Interface dựa trên Snapshot v1.5
interface MindRecord {
  id: string;
  content: string;
  createdAt: number;
  isBookmarked: boolean;
  nextReviewAt: number;
}

const SparkSystem: React.FC = () => {
  const [activeSpark, setActiveSpark] = useState<MindRecord | null>(null);
  const [treasuryRecords, setTreasuryRecords] = useState<MindRecord[]>([]);
  const [showTreasury, setShowTreasury] = useState(false);

  // 1. Logic: Predictive Pointer (Hành động 1)
  // Kiểm tra mỗi 1 phút để tìm "Kẻ tiếp theo" cần Spark
  useEffect(() => {
    const checkForSpark = async () => {
      const now = Date.now();
      
      // Tìm bản ghi đến hạn review sớm nhất
      const nextOne = await db.tasks
        .where('nextReviewAt')
        .below(now)
        .first();

      // Chỉ hiện Spark nếu có bản ghi và UniversalInput đang đóng (giả định dùng biến global/context)
      // Ở đây tôi dùng window.isUniversalInputOpen làm ví dụ check
      const isInputBusy = (window as any).isUniversalInputOpen; 

      if (nextOne && !isInputBusy) {
        setActiveSpark(nextOne);
      }
    };

    const timer = setInterval(checkForSpark, 60000); 
    checkForSpark(); // Chạy lần đầu ngay khi mount
    return () => clearInterval(timer);
  }, []);

  // 2. Logic: Query Kho báu ẩn giấu (Hành động 2)
  const fetchTreasury = async () => {
    const now = Date.now();
    const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = now - (72 * 60 * 60 * 1000);

    // Truy vấn kết hợp: Bookmarked HOẶC Nằm trong khoảng 25h-72h
    const records = await db.tasks
      .filter(record => {
        const isWithinTimeRange = record.createdAt <= twentyFiveHoursAgo && record.createdAt >= seventyTwoHoursAgo;
        return record.isBookmarked || isWithinTimeRange;
      })
      .toArray();

    setTreasuryRecords(records.sort((a, b) => b.createdAt - a.createdAt));
    setShowTreasury(true);
  };

  const handleSparkClick = () => {
    fetchTreasury();
    setActiveSpark(null);
  };

  return (
    <div className="mind-cap-spark-layer">
      {/* POPUP SPARK (Hành động 1) */}
      {activeSpark && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div 
            onClick={handleSparkClick}
            className="group relative w-full max-w-md cursor-pointer overflow-hidden rounded-3xl border border-amber-500/30 bg-zinc-900 p-8 shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-all hover:border-amber-500/60"
          >
            {/* Hiệu ứng tia sáng chạy quanh viền */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <span className="mb-4 inline-block text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                ✨ Memory Spark Triệu Hồi
              </span>
              <p className="text-lg leading-relaxed text-zinc-100 whitespace-pre-wrap">
                {activeSpark.content}
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm text-zinc-500 group-hover:text-amber-400 transition-colors">
                <span>Chạm để giải mã kho báu ẩn giấu</span>
                <span className="animate-bounce">→</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHO BÁU (Hành động 2) */}
      {showTreasury && (
        <div className="fixed inset-0 z-[110] bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100">Kho báu ẩn giấu</h2>
            <button 
              onClick={() => setShowTreasury(false)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              Đóng
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {treasuryRecords.length > 0 ? (
              treasuryRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    {record.isBookmarked && <span className="text-xs text-amber-500">★ Bookmark</span>}
                    <span className="text-[10px] text-zinc-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm">{record.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-zinc-600">Kho báu đang trống, hãy tiếp tục tích lũy...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SparkSystem;