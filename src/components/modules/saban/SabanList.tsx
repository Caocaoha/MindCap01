import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSabanData } from '../../../hooks/useSabanData';
import { SabanCard } from './SabanCard';
import { IdentityPopup } from './IdentityPopup';
import { QuickEditModal } from './QuickEditModal';
import { db } from '../../../database/db';

/**
 * MOD_SABAN: Strategic Backlog Center
 * Hiển thị danh sách chờ, phân loại theo Eisenhower và kết nối Căn tính.
 */
export const SabanList = () => {
  const data = useSabanData();
  
  // State quản lý các Modals
  const [scoringTask, setScoringTask] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Xử lý khi gạt (Swipe) thành công
  const handleSwipeSuccess = (task: any) => {
    // Giả sử hasCompletedSelfAudit đã được check từ Global Store/Profile
    // Ở đây tạm để true để kích hoạt quy trình chấm điểm Căn tính
    const hasAudit = true; 
    if (hasAudit) {
      setScoringTask(task);
    } else {
      moveToFocus(task, 0);
    }
  };

  // Đẩy Task vào vùng Focus và cập nhật điểm Căn tính
  const moveToFocus = async (task: any, score: number) => {
    await db.table('entities').update(task.uuid, {
      isFocusing: 1, // Chuyển trạng thái sang Active/Focus
      identityScore: score,
      updatedAt: Date.now() // Trigger Echo quét lại sau 4 phút
    });
    setScoringTask(null);
  };

  if (!data) return (
    <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">
      Đang tải dữ liệu Saban...
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      
      {/* 1. Header Chiến lược */}
      <header className="p-6 pt-10 text-center bg-white border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => console.log("Navigate to Identity Tab")}
          className="group"
        >
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold group-hover:text-blue-500 transition-colors">
            Core Identity
          </p>
          <h1 className="text-xl font-bold text-slate-800 mt-1">
            Dự án lớn nhất của bạn là gì?
          </h1>
        </button>
      </header>

      {/* 2. Danh sách các Buckets (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-8 custom-scrollbar">
        
        {/* Bucket: DO NOW (Critical/Urgent) */}
        {data.doNow.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black text-red-500 mb-3 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LÀM NGAY (DO NOW)
            </h2>
            {data.doNow.map(item => (
              <SabanCard 
                key={item.uuid} 
                item={item} 
                onSwipeSuccess={handleSwipeSuccess} 
                onEdit={() => setEditingTask(item)} 
              />
            ))}
          </section>
        )}

        {/* Bucket: PLAN (Important) */}
        {data.plan.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black text-blue-500 mb-3 px-1">
              SUY NGHĨ THÊM (PLAN)
            </h2>
            {data.plan.map(item => (
              <SabanCard 
                key={item.uuid} 
                item={item} 
                onSwipeSuccess={handleSwipeSuccess} 
                onEdit={() => setEditingTask(item)} 
              />
            ))}
          </section>
        )}

        {/* Bucket: LATER (Normal/Uncategorized) */}
        {data.later.length > 0 && (
          <section>
            <h2 className="text-[10px] font-black text-slate-400 mb-3 px-1">
              KHÁC (LATER)
            </h2>
            {data.later.map(item => (
              <SabanCard 
                key={item.uuid} 
                item={item} 
                onSwipeSuccess={handleSwipeSuccess} 
                onEdit={() => setEditingTask(item)} 
              />
            ))}
          </section>
        )}

        {/* 3. Vùng đệm Buffer (Thought/Mood) */}
        {data.thoughts.length > 0 && (
          <section className="pt-6 border-t border-slate-200/50">
            <h2 className="text-[10px] font-bold text-slate-300 mb-4 px-1 uppercase italic">
              Thought Echoes
            </h2>
            <div className="flex flex-wrap gap-2 opacity-50 hover:opacity-100 transition-opacity">
              {data.thoughts.map(t => (
                <motion.span 
                  key={t.uuid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] bg-white border border-slate-100 text-slate-500 px-3 py-1 rounded-full shadow-sm italic cursor-default"
                >
                  {t.content}
                </motion.span>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {data.doNow.length === 0 && data.plan.length === 0 && data.later.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300">
            <p className="text-sm italic">Saban đang trống...</p>
            <p className="text-[10px] uppercase mt-2">Hãy thêm Task mới từ Input Bar</p>
          </div>
        )}
      </div>

      {/* 4. Layer Modals & Overlays */}
      <AnimatePresence>
        {/* Modal chấm điểm Căn tính */}
        {scoringTask && (
          <IdentityPopup 
            task={scoringTask} 
            onConfirm={(score: number) => moveToFocus(scoringTask, score)}
            onCancel={() => setScoringTask(null)}
          />
        )}

        {/* Modal sửa nhanh (Quick Edit) */}
        {editingTask && (
          <QuickEditModal 
            item={editingTask} 
            onClose={() => setEditingTask(null)} 
          />
        )}
      </AnimatePresence>
      
    </div>
  );
};