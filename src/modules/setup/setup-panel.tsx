import React, { useState } from 'react';
import { backupService } from './backup-service';
import { triggerHaptic } from '../../utils/haptic';

export const SetupPanel: React.FC = () => {
  const [log, setLog] = useState<string | null>(null);

  const handleExport = async () => {
    const result = await backupService.exportToJson();
    setLog(result.success ? "Vault exported successfully." : "Error exporting vault.");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmAction = window.confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị xóa sạch và thay thế bằng file mới. Tiếp tục?");
    if (!confirmAction) return;

    try {
      await backupService.importFromJson(file);
      setLog("Restore complete. Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setLog("Restore failed: File mismatch.");
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[10px] font-black tracking-[0.4em] opacity-20 uppercase">System Protocol</h2>
        <h1 className="text-3xl font-serif italic text-white/90 mt-1">Setup & Sovereignty</h1>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Backup Card */}
        <section className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Data Sovereignty</h3>
            <p className="text-xs text-white/30 leading-relaxed">
              Mind Cap hoạt động dựa trên triết lý Local-first. Toàn bộ ký ức của bạn nằm trong tay bạn, không phải đám mây.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleExport}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Export JSON Vault
            </button>

            <label className="w-full bg-blue-500 hover:bg-blue-400 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center cursor-pointer transition-all">
              Restore from JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {log && (
            <p className="text-center text-[9px] font-bold text-blue-500/80 uppercase tracking-widest animate-pulse">
              {log}
            </p>
          )}
        </section>

        {/* Panic Button [Planned] */}
        <button 
          onClick={() => triggerHaptic('warning')}
          className="w-full py-4 border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic"
        >
          Panic: Emergency Wipe [Locked]
        </button>
      </div>
    </div>
  );
};