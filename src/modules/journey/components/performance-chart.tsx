import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';

/**
 * [MOD_JOURNEY_UI]: Biểu đồ hiệu suất 7 ngày trục kép.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Đặc điểm: Chuyển đổi màu nhấn sang Blue #2563EB và Slate monochrome.
 * [UPGRADE]: Hỗ trợ chuẩn ISO 8601 (Timezone Agnostic) và sửa lỗi TS2365.
 */
export const PerformanceChart: React.FC = () => {
  // BẢO TỒN 100% LOGIC TRUY VẤN DỮ LIỆU
  const stats = useLiveQuery(async () => {
    /**
     * [FIX]: Chuyển đổi mốc thời gian sang ISO 8601 để truy vấn Index chính xác
     * theo cấu trúc Database Version 12.
     */
    const sevenDaysAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const tasks = await db.tasks.where('createdAt').above(sevenDaysAgoISO).toArray();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d.setHours(0,0,0,0)).getTime();
      const end = start + 86400000;

      /**
       * [FIX TS2365]: Chuyển đổi createdAt (string | number) sang timestamp số 
       * trước khi thực hiện phép so sánh để vượt qua kiểm tra của Cloudflare build.
       */
      const dayTasks = tasks.filter(t => {
        const itemTime = new Date(t.createdAt).getTime();
        return itemTime >= start && itemTime < end;
      });

      const completed = dayTasks.filter(t => t.status === 'done').length;
      const focus = dayTasks.filter(t => t.isFocusMode).length;
      const rate = focus > 0 ? (completed / focus) * 100 : 0;

      return { label: d.toLocaleDateString('vi-VN', { weekday: 'short' }), completed, rate };
    });
  }, []);

  if (!stats) return null;

  return (
    /* CONTAINER: Nền trắng, Border Slate-200 mảnh, bo góc 6px */
    <div className="bg-white border border-slate-200 rounded-[6px] p-6 mb-6 transition-all hover:border-slate-300 shadow-none">
      
      {/* HEADER: Chuyển sang font Inter, màu Slate-400 và Slate-900 */}
      <div className="flex justify-between items-center mb-8 px-1">
        <h4 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
          Hiệu suất 7 ngày
        </h4>
        
        {/* LEGEND: Tối giản màu sắc sang Blue #2563EB và Slate-300 */}
        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 bg-slate-100 rounded-[2px]" /> Việc xong
          </div>
          <div className="flex items-center gap-1.5 text-[#2563EB]">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full" /> Tỷ lệ %
          </div>
        </div>
      </div>

      <div className="relative h-32 w-full">
        {/* Biểu đồ SVG: Loại bỏ các grid lines rườm rà */}
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          {/* Baseline chuẩn Linear */}
          <line x1="0" y1="35" x2="100" y2="35" stroke="#F1F5F9" strokeWidth="0.5" />
          
          {stats.map((d, i) => {
            const x = i * 14 + 8;
            const barH = (d.completed / 10) * 30; // Giả định max 10 việc/ngày
            const lineY = 35 - (d.rate / 100) * 30;
            
            return (
              <g key={i} className="transition-all duration-500">
                {/* CỘT VIỆC XONG: Slate-100 tạo cảm giác nền tảng, bo góc 2px */}
                <rect 
                  x={x} 
                  y={35 - barH} 
                  width="5" 
                  height={barH} 
                  className="fill-slate-100" 
                  rx="1" 
                />
                
                {/* ĐƯỜNG TỶ LỆ (CHẤM): Xanh đậm #2563EB, loại bỏ shadow-glow */}
                <circle 
                  cx={x + 2.5} 
                  cy={lineY} 
                  r="0.8" 
                  className="fill-[#2563EB]" 
                />
                
                {/* NHÃN THỨ: Màu Slate-400 nhạt */}
                <text 
                  x={x + 2.5} 
                  y="43" 
                  textAnchor="middle" 
                  className="fill-slate-400 text-[3.5px] font-bold uppercase tracking-tighter"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};