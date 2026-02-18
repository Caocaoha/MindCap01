/**
 * Purpose: Quản lý chồng thẻ ý tưởng tương tác (Tinder Stack) cho Obsidian Sync.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Hiển thị tối đa 2 thẻ cùng lúc để tối ưu hiệu năng thiết bị[cite: 39].
 * - Swipe Right: Chuyển trạng thái sang 'ready_to_export'[cite: 16, 34].
 * - Swipe Left: Giữ nguyên trạng thái 'pending'[cite: 16].
 * - Hiển thị trạng thái trống khi không còn bản ghi cần duyệt.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReviewLogic } from '../use-review-logic';
import { ReviewCard } from './review-card';

export const ReviewStack: React.FC = () => {
  const { items, loading, handleApprove, handleSkip } = useReviewLogic();

  // Chỉ lấy 2 bản ghi trên cùng để render [cite: 39]
  const displayItems = items.slice(0, 2).reverse();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải ý tưởng...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-100 rounded-[3rem] px-10 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-800">Sạch sẽ!</h4>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
          Tất cả ý tưởng đã được duyệt. Bạn có thể tiến hành xuất file JSON ngay bây giờ.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[540px] perspective-1000">
      <AnimatePresence>
        {displayItems.map((item, index) => {
          const isTop = index === displayItems.length - 1;

          return (
            <motion.div
              key={item.id}
              style={{ 
                zIndex: index,
                position: 'absolute',
                width: '100%',
                height: '100%',
                cursor: isTop ? 'grab' : 'default'
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ 
                scale: isTop ? 1 : 0.95, 
                opacity: 1, 
                y: isTop ? 0 : 10,
                rotate: isTop ? 0 : (index % 2 === 0 ? 2 : -2)
              }}
              exit={{ 
                x: item._exitX || 0, 
                opacity: 0, 
                scale: 0.5,
                transition: { duration: 0.3 } 
              }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                const threshold = 100;
                if (info.offset.x > threshold) {
                  item._exitX = 500;
                  handleApprove(item.id, item._dbTable);
                } else if (info.offset.x < -threshold) {
                  item._exitX = -500;
                  handleSkip(item.id);
                }
              }}
              whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            >
              <ReviewCard item={item} />
              
              {/* Chỉ báo hướng vuốt */}
              {isTop && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-10 opacity-0 hover:opacity-100 transition-opacity">
                   <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 text-red-500 font-black text-[10px] uppercase">Skip</div>
                   <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20 text-green-500 font-black text-[10px] uppercase">Sync</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Counter Tag */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-xl">
        {items.length} Ý TƯỞNG CẦN DUYỆT
      </div>
    </div>
  );
};