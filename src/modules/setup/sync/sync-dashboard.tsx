/**
 * Purpose: Màn hình điều phối trung tâm cho hệ thống đồng bộ Obsidian.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Quản lý luồng Manual JSON Bridge: Export (nguồn) -> Import/Merge (đích). [cite: 24]
 * - Thực thi ghi dữ liệu trực tiếp vào Obsidian Vault qua File System Access API. [cite: 30, 31]
 * - Áp dụng Smart Merge Logic khi nhập dữ liệu từ thiết bị khác. [cite: 28]
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
  const { items, refresh } = useReviewLogic();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Kiểm tra trình duyệt có hỗ trợ ghi file trực tiếp hay không (Chỉ PC/Laptop) [cite: 30]
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  /**
   * [STEP 1]: Export JSON - Đóng gói dữ liệu tại thiết bị nguồn. [cite: 25]
   */
  const handleExportBridge = async () => {
    try {
      const pkg = await generateExportPackage();
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindCap_Export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      triggerHaptic('success');
    } catch (err) {
      console.error("Export Bridge failed:", err);
    }
  };

  /**
   * [STEP 2]: Import JSON - Nạp dữ liệu tại thiết bị đích và thực hiện Smart Merge. [cite: 27, 28]
   */
  const handleImportBridge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const pkg = JSON.parse(event.target?.result as string);
        triggerHaptic('medium');
        // Thực hiện logic so sánh updatedAt để gộp dữ liệu [cite: 28, 29]
        await parseAndMergePackage(pkg);
        alert("Đồng bộ thành công! Dữ liệu đã được gộp (Smart Merge).");
        refresh(); 
      } catch (err) {
        alert("Lỗi khi nhập file Bridge: " + err);
      }
    };
    reader.readAsText(file);
  };

  /**
   * [STEP 3]: Write to Vault - Ghi trực tiếp vào Obsidian trên Laptop. [cite: 31, 32]
   */
  const handleWriteToObsidian = async () => {
    try {
      const pkg = await generateExportPackage();
      if (pkg.ideas.length === 0) {
        alert("Không có ý tưởng nào sẵn sàng (ready_to_export). Hãy vuốt thẻ trước!");
        return;
      }
      triggerHaptic('heavy');
      const result = await obsidianWriter.writeToVault(pkg.ideas);
      alert(`Đã ghi thành công ${result.success} bản ghi vào Obsidian.`);
      refresh();
    } catch (err) {
      console.error("Obsidian Write Error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-bottom duration-500">
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">OBSIDIAN BRIDGE</h2>
          <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest mt-0.5">Manual JSON Sync System</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setView('review')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>REVIEW</button>
          <button onClick={() => setView('summary')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>SYNC</button>
        </div>
      </header>

      <main className="flex-1 p-6 relative">
        {view === 'review' ? <ReviewStack /> : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportBridge} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
                <span className="text-xs font-bold">1. Export JSON</span>
                <span className="text-[7px] opacity-40 uppercase mt-1">Từ thiết bị nguồn</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-purple-600 hover:text-white transition-all">
                <input type="file" ref={fileInputRef} onChange={handleImportBridge} className="hidden" accept=".json" />
                <span className="text-xs font-bold">2. Import & Merge</span>
                <span className="text-[7px] opacity-40 uppercase mt-1">Tại thiết bị đích</span>
              </button>
            </div>

            <button onClick={handleWriteToObsidian} disabled={!isSupported} className={`w-full py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${isSupported ? 'bg-purple-600 text-white shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              {isSupported ? '3. Write to Obsidian Vault' : 'Desktop Access Required'}
            </button>
          </div>
        )}
      </main>
      <footer className="p-8 text-center opacity-20 text-[8px] font-bold uppercase tracking-[0.3em]">Knowledge Transfer Active</footer>
    </div>
  );
};