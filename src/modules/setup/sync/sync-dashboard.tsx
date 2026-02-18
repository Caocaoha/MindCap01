/**
 * Purpose: Giao diện điều phối trung tâm cho hệ thống Obsidian Bridge (v2.0).
 * Inputs/Outputs: JSX.Element.
 * Business Rule: 
 * - Kết nối Export Engine với Obsidian Writer.
 * - Đảm bảo dữ liệu trích xuất mang đầy đủ sourceTable để tránh lỗi trùng lặp.
 * - [ATOMIC REFRESH]: Chỉ reset số lượng về 0 khi database đã xác nhận 'synced'.
 */

import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { generateExportPackage } from './export-engine';
import { obsidianWriter, ExtendedIdea } from './obsidian-writer';
import { ReviewStack } from './components/review-stack';
import { useReviewLogic } from './use-review-logic';

export const SyncDashboard: React.FC = () => {
  const [view, setView] = useState<'review' | 'summary'>('review');
  const [supported, setSupported] = useState(false);
  
  // Sử dụng readyCount từ store toàn cục để đồng bộ số liệu
  const { readyCount } = useUiStore();
  const { refresh } = useReviewLogic();

  useEffect(() => { 
    setSupported('showDirectoryPicker' in window); 
  }, []);

  /**
   * Thực thi ghi tri thức vào Obsidian Vault
   */
  const handleWrite = async () => {
    try {
      // 1. Lấy gói dữ liệu đã được gán nhãn nguồn từ Export Engine
      const pkg = await generateExportPackage();
      
      if (pkg.ideas.length === 0) {
        alert("Không còn ý tưởng nào chờ đồng bộ. Hãy duyệt thêm ở tab REVIEW!");
        return;
      }

      triggerHaptic('heavy');
      
      // 2. Ép kiểu và thực thi ghi file kèm cơ chế cập nhật DB phòng thủ
      const result = await obsidianWriter.writeToVault(pkg.ideas as ExtendedIdea[]);
      
      alert(`Thành công! Đã ghi ${result.success} mẩu nhận thức vào Obsidian.`);
      
      // 3. Cập nhật lại UI để số lượng Sẵn sàng về 0
      await refresh(); 
    } catch (err) {
      console.error("Sync Execute Error:", err);
      alert("Đồng bộ thất bại. Vui lòng kiểm tra quyền truy cập thư mục của trình duyệt.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      
      {/* Tab Switcher Header */}
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Knowledge Bridge</h2>
          <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-0.5">Defensive Sync Protocol v3.0</span>
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
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] shadow-sm">
              <div className="flex gap-4">
                <span className="text-2xl">⚡</span>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Hướng dẫn</p>
                  <p className="text-[11px] leading-relaxed text-amber-800/80 font-bold">
                    Sau khi nhấn Write, hãy chọn thư mục gốc của Obsidian Vault. 
                    Mọi ý tưởng sẽ được lưu tập trung vào tệp Markdown trong thư mục <code>/MindCap</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleWrite} 
                disabled={!supported} 
                className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl ${
                  supported 
                    ? 'bg-purple-600 text-white active:scale-95 shadow-purple-100' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {supported ? '🚀 3. Write to Obsidian Vault' : 'Desktop Browser Required'}
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

            <div className="bg-slate-900/5 p-6 rounded-[2.5rem] border border-slate-100 mt-12">
              <p className="text-[8px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest text-center italic">
                Data Integrity: Source Anchoring & Atomic Update Active.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};