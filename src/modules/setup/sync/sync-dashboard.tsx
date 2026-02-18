/**
 * Purpose: Màn hình điều phối trung tâm và thực thi đồng bộ Obsidian.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Cho phép chuyển đổi giữa chế độ duyệt thẻ (Review) và quản lý (Summary).
 * - Thực thi ghi file trực tiếp vào Vault qua File System Access API.
 * - Chỉ kích hoạt tính năng ghi file trên trình duyệt hỗ trợ và có dữ liệu sẵn sàng.
 */

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { generateExportPackage } from './export-engine';
import { obsidianWriter } from './obsidian-writer';
import { ReviewStack } from './components/review-stack';
import { useReviewLogic } from './use-review-logic';

export const SyncDashboard: React.FC = () => {
  const [view, setView] = useState<'review' | 'summary'>('review');
  const { items, refresh } = useReviewLogic();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  const handleWriteToObsidian = async () => {
    try {
      const pkg = await generateExportPackage();
      if (pkg.ideas.length === 0) {
        alert("Không có ý tưởng nào ở trạng thái 'Ready to export'.");
        return;
      }

      triggerHaptic('medium');
      const result = await obsidianWriter.writeToVault(pkg.ideas);
      
      alert(`Đã đồng bộ thành công ${result.success} tệp vào Obsidian!`);
      refresh(); // Cập nhật lại danh sách sau khi đã sync
    } catch (err) {
      console.error("Lỗi thực thi ghi file:", err);
    }
  };

  const handleExportJSON = async () => {
    try {
      const pkg = await generateExportPackage();
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindCap_Obsidian_Bridge_${new Date().getTime()}.json`;
      a.click();
      triggerHaptic('success');
    } catch (err) {
      console.error("Export thất bại:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-bottom duration-500">
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">KNOWLEDGE SYNC</h2>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-0.5">MindCap → Obsidian</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setView('review')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>REVIEW</button>
          <button onClick={() => setView('summary')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>DASHBOARD</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {view === 'review' ? <ReviewStack /> : (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Trạng thái hàng chờ</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-4xl font-black text-slate-900">{items.length}</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">MỤC CHỜ DUYỆT</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button onClick={handleWriteToObsidian} disabled={!isSupported} className={`w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${isSupported ? 'bg-purple-600 text-white shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                {isSupported ? '🚀 Write Directly to Vault' : 'Desktop Only Feature'}
              </button>
              
              <button onClick={handleExportJSON} className="w-full py-5 bg-white border-2 border-slate-900 rounded-[2rem] text-slate-900 text-[11px] font-black uppercase tracking-widest active:scale-95">
                Export JSON Bridge
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center opacity-20 text-[8px] font-bold uppercase tracking-[0.3em]">
        Phase 3: Execution Layer Active
      </footer>
    </div>
  );
};