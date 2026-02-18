/**
 * Purpose: Màn hình điều phối trung tâm cho hệ thống đồng bộ Obsidian.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Quản lý luồng Manual JSON Bridge: Export (nguồn) -> Import/Merge (đích).
 * - Thực thi ghi dữ liệu trực tiếp vào Obsidian Vault qua File System Access API.
 * - Hiển thị số lượng bản ghi ready_to_export để người dùng kiểm soát khối lượng sync.
 * - Chế độ Nhị phân (Binary Choice) được phản ánh qua hàng chờ Review.
 */

import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { generateExportPackage } from './export-engine';
import { parseAndMergePackage } from './import-engine';
import { obsidianWriter } from './obsidian-writer';
import { ReviewStack } from './components/review-stack';
import { useReviewLogic } from './use-review-logic';

export const SyncDashboard: React.FC = () => {
  const [view, setView] = useState<'review' | 'summary'>('review');
  const [isSupported, setIsSupported] = useState(false);
  const { readyCount, refresh } = useReviewLogic();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Kiểm tra hỗ trợ File System Access API (Chỉ dành cho trình duyệt trên Desktop)
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  /**
   * [ACTION]: Ghi trực tiếp vào Obsidian Vault trên máy tính.
   */
  const handleWriteToObsidian = async () => {
    try {
      const pkg = await generateExportPackage();
      if (pkg.ideas.length === 0) {
        alert("Không có ý tưởng nào ở trạng thái 'Ready to export'. Hãy duyệt thẻ trước!");
        return;
      }

      triggerHaptic('heavy');
      const result = await obsidianWriter.writeToVault(pkg.ideas);
      
      alert(`Đã đồng bộ thành công ${result.success} tệp vào Obsidian!`);
      refresh(); // Cập nhật lại số lượng và danh sách sau khi sync
    } catch (err) {
      console.error("Lỗi thực thi ghi file:", err);
    }
  };

  /**
   * [ACTION]: Xuất file JSON cho Bridge (Dùng tại thiết bị nguồn - Mobile).
   */
  const handleExportBridge = async () => {
    try {
      const pkg = await generateExportPackage();
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindCap_Bridge_${new Date().getTime()}.json`;
      a.click();
      triggerHaptic('success');
    } catch (err) {
      console.error("Export Bridge thất bại:", err);
    }
  };

  /**
   * [ACTION]: Nhập file JSON Bridge (Dùng tại thiết bị đích - Laptop).
   * Thực hiện Smart Merge dựa trên updatedAt.
   */
  const handleImportBridge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const pkg = JSON.parse(event.target?.result as string);
        triggerHaptic('medium');
        await parseAndMergePackage(pkg);
        alert("Đồng bộ Bridge thành công! Dữ liệu cũ đã được gộp thông minh.");
        refresh();
      } catch (err) {
        alert("Lỗi khi nhập file Bridge: " + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-bottom duration-500">
      {/* HEADER: Điều hướng giữa Review và Sync Dashboard */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">KNOWLEDGE BRIDGE</h2>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-0.5 underline decoration-2 underline-offset-4">MindCap → Obsidian</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('review')} 
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            REVIEW
          </button>
          <button 
            onClick={() => setView('summary')} 
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            SYNC
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 relative">
        {view === 'review' ? (
          <ReviewStack />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Phase 3: Execution Layer (Viết trực tiếp) */}
            <div className="space-y-4">
              <button 
                onClick={handleWriteToObsidian} 
                disabled={!isSupported} 
                className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl ${
                  isSupported 
                    ? 'bg-purple-600 text-white active:scale-95 shadow-purple-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSupported ? '🚀 Write to Obsidian Vault' : 'Desktop Access Required'}
              </button>

              {/* Indicator: Số lượng bản ghi đã được duyệt và sẵn sàng Sync */}
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-white border border-slate-100 rounded-full shadow-sm flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${readyCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`} />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Sẵn sàng: {readyCount} ý tưởng
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-center mb-2">
                Manual JSON Bridge
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleExportBridge} 
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-slate-900 hover:text-white transition-all group shadow-sm"
                >
                  <span className="text-xs font-bold">Export JSON</span>
                  <span className="text-[7px] opacity-40 uppercase mt-1">Từ Mobile/Nguồn</span>
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-purple-600 hover:text-white transition-all group shadow-sm"
                >
                  <input type="file" ref={fileInputRef} onChange={handleImportBridge} className="hidden" accept=".json" />
                  <span className="text-xs font-bold">Import & Merge</span>
                  <span className="text-[7px] opacity-40 uppercase mt-1">Tại Laptop/Đích</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 mt-4">
              <p className="text-[9px] leading-relaxed text-blue-400 font-bold uppercase tracking-tight">
                Triết lý Sync: Duyệt tại Mobile, Merge tại Laptop, Ghi tại Obsidian. Toàn bộ dữ liệu nằm trong quyền kiểm soát của bạn.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.5em]">
        Obsidian Bridge Active • PHS 100
      </footer>
    </div>
  );
};