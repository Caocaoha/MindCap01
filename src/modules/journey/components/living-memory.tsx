import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useJourneyStore } from '../../../store/journey-store';
import { triggerHaptic } from '../../../utils/haptic';
import { BookmarkReasonModal } from './bookmark-reason-modal';

export const LivingMemory: React.FC = () => {
  const { calculateOpacity, isDiaryEntry, searchQuery } = useJourneyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{id: number, type: 'task' | 'thought'} | null>(null);

  // 1. Logic Lọc dữ liệu (Filter Condition)
  const memories = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    const thoughts = await db.thoughts.toArray();
    
    const combined = [
      ...tasks.map(t => ({ ...t, _entryType: 'task' as const })),
      ...thoughts.map(th => ({ ...th, _entryType: 'thought' as const }))
    ];

    return combined
      .filter(item => isDiaryEntry(item)) // Loại trừ Task Active & Non-Focus
      .filter(item => item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [searchQuery]);

  const handleBookmark = (id: number, type: 'task' | 'thought', currentBookmarked: boolean) => {
    triggerHaptic('light');
    if (currentBookmarked) {
      // Gỡ bookmark ngay lập tức
      updateEntry(id, type, { isBookmarked: false, bookmarkReason: '' });
    } else {
      // Mở modal nhập lý do gieo hạt
      setSelectedItem({ id, type });
      setIsModalOpen(true);
    }
  };

  const updateEntry = async (id: number, type: 'task' | 'thought', data: any) => {
    // Reset Logic: Cập nhật updatedAt đưa Opacity về 1
    const finalData = { ...data, updatedAt: Date.now() };
    type === 'task' ? await db.tasks.update(id, finalData) : await db.thoughts.update(id, finalData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700 pb-20">
      {memories?.map((item) => {
        const opacity = calculateOpacity(item.updatedAt || item.createdAt, item.isBookmarked);
        
        // Cơ chế tan rã: Ẩn nếu Opacity = 0 (trừ khi search)
        if (opacity <= 0 && !searchQuery) return null;

        return (
          <div 
            key={`${item._entryType}-${item.id}`}
            style={{ opacity }}
            className={`group relative p-6 rounded-[1.8rem] border transition-all duration-700 ${
              item.isBookmarked 
                ? 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.08)]' 
                : 'border-white/5 bg-zinc-900/30'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">
                {new Date(item.createdAt).toLocaleDateString('vi-VN')} — {item._entryType}
              </span>
              <button 
                onClick={() => handleBookmark(item.id!, item._entryType, !!item.isBookmarked)}
                className={`transition-transform active:scale-90 ${item.isBookmarked ? 'text-yellow-500' : 'opacity-10 hover:opacity-100'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={item.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
              </button>
            </div>

            <p className="text-zinc-200 text-[15px] leading-relaxed selection:bg-yellow-500/20">
              {item.content}
            </p>

            {/* Hiển thị lý do Hạt giống */}
            {item.isBookmarked && item.bookmarkReason && (
              <div className="mt-4 pt-4 border-t border-yellow-500/10 italic text-[11px] text-yellow-500/50 font-serif">
                "{item.bookmarkReason}"
              </div>
            )}
          </div>
        );
      })}

      <BookmarkReasonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(reason) => selectedItem && updateEntry(selectedItem.id, selectedItem.type, { isBookmarked: true, bookmarkReason: reason })}
      />
    </div>
  );
};