// src/modules/spark/HiddenTreasureView.tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { Clock, Star, ArrowRight } from 'lucide-react';

interface HiddenTreasureViewProps {
  onClose: () => void;
}

export const HiddenTreasureView: React.FC<HiddenTreasureViewProps> = ({ onClose }) => {
  // Query Logic: 25h -> 72h from now
  const treasures = useLiveQuery(async () => {
    const now = Date.now();
    const start = now + (25 * 60 * 60 * 1000);
    const end = now + (72 * 60 * 60 * 1000);

    const tasks = await db.tasks.where('nextReviewAt').between(start, end).toArray();
    const thoughts = await db.thoughts.where('nextReviewAt').between(start, end).toArray();
    
    return [...tasks, ...thoughts].sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
  }, []);

  if (!treasures) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Kho Báu Ẩn</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Sắp xuất hiện trong 24h - 72h tới</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300">
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {treasures.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">Chưa có kho báu nào sắp nổi lên.</div>
        ) : (
          treasures.map(item => {
            const hoursLeft = Math.round(((item.nextReviewAt || 0) - Date.now()) / (1000 * 60 * 60));
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    <Clock size={10} /> +{hoursLeft} giờ
                  </div>
                  {item.isBookmarked && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-slate-700 font-medium line-clamp-2">{item.content}</p>
                
                {/* Long Press Hint */}
                <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-slate-600">
                  Giữ để chỉnh sửa
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};