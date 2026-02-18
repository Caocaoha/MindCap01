/**
 * Purpose: Giao diện điều phối và thực thi đồng bộ Obsidian Bridge.
 * Business Rule: 
 * - Hiển thị hộp chỉ dẫn trực quan về Root Vault.
 * - Thực hiện xác nhận trạng thái (Refresh) sau khi ghi file thành công.
 * - Đảm bảo dữ liệu truyền vào writer có đầy đủ thông tin sourceTable.
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
  const { readyCount } = useUiStore();
  const { refresh } = useReviewLogic();

  useEffect(() => { setSupported('showDirectoryPicker' in window); }, []);

  const handleWrite = async () => {
    const pkg = await generateExportPackage();
    if (pkg.ideas.length === 0) return alert("Không còn ý tưởng chờ đồng bộ.");

    try {
      triggerHaptic('heavy');
      // [FIX]: Chuyển đổi dữ liệu thô sang ExtendedIdea với sourceTable đầy đủ
      const ideasToWrite = pkg.ideas.map((i: any) => ({
        ...i,
        sourceTable: i.sourceTable || (i.type ? 'thoughts' : 'tasks')
      })) as ExtendedIdea[];

      const result = await obsidianWriter.writeToVault(ideasToWrite);
      alert(`Thành công! Đã ghi ${result.success} mẩu nhận thức.`);
      refresh();
    } catch (err) {
      alert("Đồng bộ thất bại. Vui lòng kiểm tra quyền thư mục.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">KNOWLEDGE BRIDGE</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setView('review')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${view === 'review' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>REVIEW</button>
          <button onClick={() => setView('summary')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${view === 'summary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>SYNC</button>
        </div>
      </header>

      <main className="flex-1 p-6 relative">
        {view === 'review' ? <ReviewStack /> : (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem]">
              <p className="text-[11px] leading-relaxed text-amber-800/80 font-bold">
                Chọn thư mục <strong>Gốc (Root)</strong> của Vault. Hệ thống sẽ tự quản lý <code>/MindCap</code>.
              </p>
            </div>
            <button onClick={handleWrite} disabled={!supported} className={`w-full py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest ${supported ? 'bg-purple-600 text-white shadow-2xl active:scale-95' : 'bg-slate-200 text-slate-400'}`}>
              🚀 Write to Obsidian Vault
            </button>
            <div className="flex justify-center">
              <span className="px-6 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Sẵn sàng: {readyCount} ý tưởng
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};