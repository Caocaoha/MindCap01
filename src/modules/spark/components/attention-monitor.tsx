import React, { useEffect, useRef } from 'react';
import { SparkScoringEngine } from '../scoring-engine';

interface AttentionMonitorProps {
  entryId: number;
  type: 'task' | 'thought';
  children: React.ReactNode;
}

/**
 * [COMPONENT]: Attention Monitor (Watcher).
 * Sử dụng Intersection Observer để ghi điểm Passive View (+1).
 */
export const AttentionMonitor: React.FC<AttentionMonitorProps> = ({ entryId, type, children }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  /**
   * FIX: Thay đổi NodeJS.Timeout thành ReturnType<typeof setTimeout>
   * Điều này giúp TypeScript tự xác định kiểu dữ liệu dựa trên môi trường Browser.
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Chỉ kích hoạt nếu trình duyệt hỗ trợ IntersectionObserver
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          /**
           * RÀNG BUỘC: Hiện diện trên màn hình > 80% diện tích.
           */
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            // Bắt đầu đếm ngược 3 giây chú ý
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                SparkScoringEngine.triggerPassiveView(entryId, type);
                console.log(`[Attention] Spotted ${type}:${entryId} for 3s.`);
              }, 3000); 
            }
          } else {
            // Nếu người dùng lướt qua nhanh hoặc cuộn đi, hủy đếm ngược
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        });
      },
      {
        threshold: [0, 0.8, 1.0], // Các mốc để Observer kích hoạt callback
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [entryId, type]);

  return (
    <div ref={elementRef} className="w-full">
      {children}
    </div>
  );
};