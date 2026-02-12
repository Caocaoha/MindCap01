// src/modules/setup/setup-panel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadBackupFile, parseBackupFile } from './backup-service';
import { initGoogleClient, syncToDrive, loadFromDrive } from './google-drive';

export const SetupPanel = ({ onClose }: { onClose: () => void }) => {
  const [status, setStatus] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { initGoogleClient(); } catch (e) { console.warn("Google API not loaded"); }
  }, []);

  const handleDriveAction = async (action: 'save' | 'load') => {
    setIsBusy(true);
    setStatus(action === 'save' ? 'Đang đồng bộ...' : 'Đang tải về...');
    try {
      if (action === 'save') {
        await syncToDrive();
        setStatus('✅ Đã lưu lên Drive!');
      } else {
        if (!confirm("Cảnh báo: Dữ liệu hiện tại sẽ bị thay thế. Tiếp tục?")) return;
        await loadFromDrive();
        setStatus('✅ Khôi phục thành công! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setStatus('❌ Lỗi: ' + (err as Error).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Ghi đè dữ liệu bằng file này?")) return;
    
    try {
      await parseBackupFile(file);
      alert("Xong! Tải lại ứng dụng.");
      window.location.reload();
    } catch (err) {
      alert("Lỗi file.");
    }
  };

  return (
    <motion.div 
      initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
      className="fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 p-6 z-50 shadow-2xl"
    >
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-100">Setup & Data</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
      </div>

      <div className="space-y-6">
        {/* Google Drive Section */}
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
          <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase">Google Drive</h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleDriveAction('save')} disabled={isBusy}
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              ☁️ Sync to Cloud
            </button>
            <button 
              onClick={() => handleDriveAction('load')} disabled={isBusy}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 py-2 rounded-lg text-sm transition"
            >
              📥 Restore from Cloud
            </button>
          </div>
          {status && <div className="mt-2 text-xs text-center text-zinc-300">{status}</div>}
        </div>

        {/* Local Section */}
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
          <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase">Local File</h3>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => downloadBackupFile()}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 py-2 rounded-lg text-sm transition"
            >
              💾 Save .json
            </button>
            <input type="file" ref={fileInputRef} onChange={handleLocalImport} className="hidden" accept=".json"/>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 py-2 rounded-lg text-sm transition"
            >
              📂 Open .json
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-0 w-full text-center text-xs text-zinc-600">
        Mind Cap v3.6 - Identity
      </div>
    </motion.div>
  );
};