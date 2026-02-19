/**
 * [COMPONENT]: Attention Monitor (attention-monitor.tsx)
 * Purpose: Cảm biến theo dõi mức độ tập trung của người dùng trên từng bản ghi.
 * Logic: Sử dụng Intersection Observer để phát hiện sự hiện diện > 80% diện tích.
 * Scoring: Tự động cộng +1 điểm (Passive View) nếu duy trì > 3 giây.
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { ScoringEngine } from '../scoring-engine';

interface AttentionMonitorProps {
  children: ReactNode;
}

export const AttentionMonitor: React.FC<AttentionMonitorProps> = ({ children }) => {
  // Bộ nhớ đệm để theo dõi các bản ghi đã được đếm điểm trong phiên này nhằm chống spam 
  const trackedEntries = useRef<Set<string>>(new Set());
  // Lưu trữ các bộ đếm thời gian (Timers) cho từng bản ghi đang trong vùng nhìn thấy
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    /**
     * Khởi tạo Intersection Observer với cấu hình Blueprint V2.0[cite: 28, 29].
     * threshold: 0.8 -> Bản ghi phải hiện diện ít nhất 80% diện tích.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const entryId = entry.target.getAttribute('data-entry-id');
          const entryType = entry.target.getAttribute('data-entry-type') as 'task' | 'thought';
          
          if (!entryId || !entryType) return;
          const uniqueKey = `${entryType}:${entryId}`;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            // GIAI ĐOẠN 1: Bắt đầu đếm ngược 3 giây khi lọt vào vùng nhìn 
            if (!trackedEntries.current.has(uniqueKey) && !timers.current.has(uniqueKey)) {
              const timer = window.setTimeout(() => {
                // Thực hiện cộng điểm Passive View (+1) sau 3 giây 
                ScoringEngine.triggerPassiveView(Number(entryId), entryType);
                trackedEntries.current.add(uniqueKey);
                timers.current.delete(uniqueKey);
              }, 3000);

              timers.current.set(uniqueKey, timer);
            }
          } else {
            // GIAI ĐOẠN 2: Hủy bộ đếm nếu người dùng cuộn đi trước khi đủ 3 giây
            if (timers.current.has(uniqueKey)) {
              clearTimeout(timers.current.get(uniqueKey));
              timers.current.delete(uniqueKey);
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    // Tìm kiếm tất cả các thẻ bản ghi có đánh dấu tag 'data-attention-target'
    const targets = document.querySelectorAll('[data-attention-target="true"]');
    targets.forEach((target) => observer.observe(target));

    return () => {
      // Dọn dẹp các bộ đếm và observer khi component unmount
      timers.current.forEach((timer) => clearTimeout(timer));
      observer.disconnect();
    };
  }, [children]); // Chạy lại observer khi danh sách children thay đổi

  return (
    <div className="attention-monitor-wrapper w-full h-full">
      {children}
    </div>
  );
};