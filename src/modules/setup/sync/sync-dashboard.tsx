/**
 * Purpose: Màn hình điều phối trung tâm cho hệ thống đồng bộ Obsidian.
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Quản lý luồng Manual JSON Bridge và Obsidian Direct Write.
 * - [FIX]: Đồng bộ tuyệt đối số lượng readyCount từ Global Store.
 * - [FIX]: Đảm bảo lệnh ghi luôn lấy dữ liệu mới nhất từ DB để tránh sót bản ghi hoặc trùng lặp.
 */

import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { generateExportPackage } from './export-engine';
import { parseAndMergePackage } from './import-engine';
import { obsidianWriter, ExtendedIdea } from './obsidian-writer';
import { ReviewStack } from './components/review-stack';
import { useReviewLogic } from './use-review-logic';

export const SyncDashboard: React.FC = () => {
  const [view, setView] = useState<'review' | 'summary'>('review');
  const [isSupported, setIsSupported] = useState(false);
  
  // [FIX]: Lấy số lượng từ Global Store để khớp 100% với tab Review
  const { readyCount } = useUiStore();
  const { refresh } = useReviewLogic();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Kiểm tra hỗ trợ File System Access API trên Desktop
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  /**
   * [ACTION]: Ghi trực tiếp vào Obsidian Vault.
   * Thực hiện gom dữ liệu và chuyển trạng thái nguyên tử.
   */
  const handleWriteToObsidian = async () => {
    try {
      // 1. Tạo gói dữ liệu export từ những bản ghi 'ready_to_export'
      const pkg = await generateExportPackage();
      
      if (pkg.ideas.length === 0) {
        alert("Không còn ý tưởng nào chờ đồng bộ. Hãy duyệt thêm ở tab REVIEW!");
        return;
      }

      triggerHaptic('heavy');
      
      // 2. Gọi Obsidian Writer thực thi ghi Single-File và update DB Transaction
      // Ép kiểu sang ExtendedIdea[] để đảm bảo ID là kiểu số (Number) như trong Database
      const result = await obsidianWriter.writeToVault(pkg.ideas as unknown as ExtendedIdea[]);
      
      alert(`Đồng bộ thành công ${result.success} ý tưởng vào Obsidian/MindCap!`);
      
      // 3. Refresh lại để cập nhật số đếm về 0
      refresh(); 
    } catch (err) {
      console.error("Lỗi trong quá trình Write:", err);
      alert("Đồng bộ thất bại. Vui lòng kiểm tra quyền truy cập thư mục.");
    }
  };

  /**
   * [ACTION]: Xuất JSON Bridge cho Mobile.
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
      console.error("Lỗi Export Bridge:", err);
    }
  };

  /**
   * [ACTION]: Nhập JSON Bridge và gộp dữ liệu tại Laptop.
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
        alert("Đã gộp dữ liệu thành công!");
        refresh(); // Cập nhật lại số liệu sau khi gộp
      } catch (err) {
        alert("Lỗi Import: " + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in slide-in-from-bottom duration-500">
      
      {/* HEADER: Switcher giữa Review và Sync */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">KNOWLEDGE BRIDGE</h2>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-0.5 underline underline-offset-4 decoration-2">Protocol v1.5</span>
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

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 p-6 relative overflow-y-auto no-scrollbar">
        {view === 'review' ? (
          <ReviewStack />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            
            {/* Hộp chỉ dẫn chọn Root Vault */}
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] shadow-sm">
              <div className="flex gap-4">
                <span className="text-2xl">💡</span>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Chọn Obsidian Vault</p>
                  <p className="text-[11px] leading-relaxed text-amber-800/80 font-bold">
                    Bấm "Write" và chọn thư mục <strong>Gốc (Root)</strong> của Vault. 
                    Mọi tri thức sẽ được gom vào 1 file duy nhất trong thư mục <code>/MindCap</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Nút bấm thực thi chính */}
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
                {isSupported ? '🚀 3. Write to Obsidian Vault' : 'Desktop Access Only'}
              </button>

              {/* Bộ đếm đồng bộ toàn cục */}
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-white border border-slate-100 rounded-full shadow-sm flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${readyCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`} />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Sẵn sàng: {readyCount} ý tưởng
                  </span>
                </div>
              </div>
            </div>

            {/* Luồng đồng bộ thủ công qua JSON */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="h-[1px] flex-1 bg-slate-200" />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Manual Bridge</p>
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
                Data Integrity Mode • Atomic Transactions Active
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.5em]">
        Knowledge Engine v1.5
      </footer>
    </div>
  );
};