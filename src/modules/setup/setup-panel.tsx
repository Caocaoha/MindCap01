import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { exportData, importData } from './backup-service';

export const SetupPanel = () => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.confirm("CẢNH BÁO: Hành động này sẽ XÓA dữ liệu hiện tại và thay thế bằng bản backup. Bạn có chắc không?")) {
      try {
        setIsImporting(true);
        await importData(file);
        alert("Khôi phục thành công! Ứng dụng sẽ tải lại.");
        window.location.reload(); // Reload để app cập nhật state mới từ DB
      } catch (error) {
        alert("Lỗi khôi phục: " + error);
      } finally {
        setIsImporting(false);
      }
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-zinc-900 text-zinc-200 rounded-xl border border-zinc-800">
      <h2 className="text-xl font-bold border-b border-zinc-700 pb-2">Data & Safety</h2>
      
      {/* EXPORT SECTION */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Tạo bản sao lưu về máy</label>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => exportData()}
          className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 border border-zinc-600 transition-colors"
        >
          <span>📦</span> Tải xuống Backup (.json)
        </motion.button>
      </div>

      <div className="h-px bg-zinc-800 w-full" />

      {/* IMPORT SECTION (DANGER ZONE) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-red-400 font-medium">Khôi phục dữ liệu (Nguy hiểm)</label>
        <p className="text-xs text-zinc-500">Dữ liệu hiện tại sẽ bị ghi đè hoàn toàn.</p>
        
        {/* Input file ẩn */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-900/50 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isImporting ? 'Đang xử lý...' : '⚠️ Nhập file Backup'}
        </motion.button>
      </div>
    </div>
  );
};