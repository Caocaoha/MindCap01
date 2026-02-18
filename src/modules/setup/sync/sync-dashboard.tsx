/**
 * Purpose: Màn hình điều phối trung tâm cho hệ thống đồng bộ Obsidian.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Quản lý luồng Manual JSON Bridge: Export (nguồn) -> Import/Merge (đích).
 * - Thực thi ghi dữ liệu trực tiếp vào Obsidian Vault qua File System Access API.
 * - [FIX]: Đồng bộ kiểu dữ liệu ExtendedIdea để giải quyết lỗi biên dịch TS2345.
 */

import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { generateExportPackage } from './export-engine';
import { parseAndMergePackage } from './import-engine';
// [FIX]: Import thêm interface ExtendedIdea
import { obsidianWriter, ExtendedIdea } from './obsidian-writer';
import { ReviewStack } from './components/review-stack';
import { useReviewLogic } from './use-review-logic';

export const SyncDashboard: React.FC = () => {
  const [view, setView] = useState<'review' | 'summary'>('review');
  const [isSupported, setIsSupported] = useState(false);
  const { readyCount } = useUiStore();
  const { refresh } = useReviewLogic();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  /**
   * [ACTION]: Ghi trực tiếp vào Obsidian Vault.
   */
  const handleWriteToObsidian = async () => {
    try {
      const pkg = await generateExportPackage();
      if (pkg.ideas.length === 0) {
        alert("Không có ý tưởng nào 'Ready to export'. Hãy duyệt thẻ tại tab REVIEW trước!");
        return;
      }

      triggerHaptic('heavy');
      
      // [FIX]: Ép kiểu tường minh cho pkg.ideas sang ExtendedIdea[] để khớp với hàm writeToVault
      // Dữ liệu từ Backup JSON đã có sẵn createdAt nên việc ép kiểu này là an toàn.
      const result = await obsidianWriter.writeToVault(pkg.ideas as unknown as ExtendedIdea[]);
      
      alert(`Thành công! Đã đồng bộ ${result.success} mẩu tin vào tệp tổng hợp trong Obsidian/MindCap.`);
      refresh(); 
    } catch (err) {
      console.error("Lỗi thực thi ghi file:", err);
    }
  };

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

  const handleImportBridge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const pkg = JSON.parse(event.target?.result as string);
        triggerHaptic('medium');
        await parseAndMergePackage(pkg);
        alert("Đồng bộ Bridge thành công!");
        refresh();
      } catch (err) {
        alert("Lỗi khi nhập file Bridge: " + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-bottom duration-500">
      
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">KNOWLEDGE BRIDGE</h2>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-0.5">Local-First Knowledge Transfer</span>
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

      <main className="flex-1 p-6 relative overflow-y-auto no-scrollbar">
        {view === 'review' ? (
          <ReviewStack />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] shadow-sm">
              <div className="flex gap-4">
                <span className="text-2xl">💡</span>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Hướng dẫn đồng bộ</p>
                  <p className="text-[11px] leading-relaxed text-amber-800/80 font-bold">
                    Sau khi bấm nút "Write" bên dưới, hãy chọn thư mục <strong>Gốc (Root)</strong> của Obsidian Vault. 
                    Hệ thống sẽ tự động quản lý tri thức trong thư mục <code>/MindCap</code> để không làm lẫn dữ liệu của bạn.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleWriteToObsidian} 
                disabled={!isSupported} 
                className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl ${
                  isSupported 
                    ? 'bg-purple-600 text-white active:scale-95 shadow-purple-100' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSupported ? '🚀 3. Write to Obsidian Vault' : 'Desktop Browser Required'}
              </button>

              <div className="flex justify-center">
                <div className="px-6 py-2 bg-white border border-slate-100 rounded-full shadow-sm flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${readyCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`} />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Sẵn sàng: {readyCount} ý tưởng
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="h-[1px] flex-1 bg-slate-200" />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  Manual JSON Bridge
                </p>
                <div className="h-[1px] flex-1 bg-slate-200" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExportBridge} 
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <span className="text-xs font-bold">1. Export</span>
                  <span className="text-[7px] opacity-40 uppercase mt-1 tracking-widest">Từ Mobile</span>
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-6 bg-white border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <input type="file" ref={fileInputRef} onChange={handleImportBridge} className="hidden" accept=".json" />
                  <span className="text-xs font-bold">2. Import</span>
                  <span className="text-[7px] opacity-40 uppercase mt-1 tracking-widest">Tại Laptop</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100 mt-4">
              <p className="text-[8px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest text-center">
                Phase 3 Active • Obsidian Bridge Protocol v1.2
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.5em]">
        Knowledge Transfer Secure
      </footer>
    </div>
  );
};