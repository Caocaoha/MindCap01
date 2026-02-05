import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Download, Upload, Trash2, RefreshCw, AlertTriangle, CheckCircle2, FileJson, Info } from 'lucide-react';
import { db } from '../utils/db';

const Setup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CHỨC NĂNG SAO LƯU (EXPORT) ---
  const handleExport = async () => {
    setIsLoading(true);
    try {
      const allEntries = await db.entries.toArray();
      const dataStr = JSON.stringify(allEntries, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Tạo link tải ảo
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindOS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ text: `Đã sao lưu ${allEntries.length} dòng ký ức!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Lỗi khi sao lưu dữ liệu', type: 'error' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // --- CHỨC NĂNG KHÔI PHỤC (IMPORT) ---
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("CẢNH BÁO: Hành động này sẽ GHI ĐÈ dữ liệu hiện tại bằng dữ liệu trong file backup. Bạn có chắc chắn không?")) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);
        
        if (!Array.isArray(data)) throw new Error("File không hợp lệ");

        // Xóa cũ & Nạp mới
        await db.entries.clear();
        await db.entries.bulkAdd(data);

        setMessage({ text: 'Khôi phục dữ liệu thành công!', type: 'success' });
        setTimeout(() => window.location.reload(), 1500); // Reload để app nhận data mới
      } catch (err) {
        console.error(err);
        setMessage({ text: 'File lỗi hoặc không đúng định dạng', type: 'error' });
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- CHỨC NĂNG RESET ---
  const handleReset = async () => {
    if (window.confirm("NGUY HIỂM: Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu không? Hành động này không thể hoàn tác!")) {
      await db.entries.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 pb-24 font-sans">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* HEADER */}
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <Settings size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Cài đặt</h2>
        </header>

        {/* THÔNG BÁO TRẠNG THÁI */}
        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
            {message.text}
          </motion.div>
        )}

        {/* SECTION 1: DỮ LIỆU */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileJson size={16}/> Quản lý Dữ liệu
          </h3>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleExport} 
              disabled={isLoading}
              className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium"
            >
              <div className="flex items-center gap-3"><Download size={20}/> Sao lưu (Backup)</div>
              <span className="text-xs bg-white/50 px-2 py-1 rounded">.JSON</span>
            </button>

            <button 
              onClick={handleImportClick} 
              disabled={isLoading}
              className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors font-medium"
            >
              <div className="flex items-center gap-3"><Upload size={20}/> Khôi phục (Restore)</div>
              <span className="text-xs bg-white/50 px-2 py-1 rounded">Upload</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </section>

        {/* SECTION 2: HỆ THỐNG */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16}/> Vùng nguy hiểm
          </h3>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors font-medium"
            >
              <RefreshCw size={20}/> Làm mới ứng dụng (Reload)
            </button>

            <button 
              onClick={handleReset} 
              className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium"
            >
              <Trash2 size={20}/> Xóa toàn bộ dữ liệu (Reset)
            </button>
          </div>
        </section>

        {/* FOOTER INFO */}
        <div className="text-center text-slate-300 text-xs mt-4">
          <p className="font-bold flex items-center justify-center gap-1"><Info size={12}/> MIND OS v5.4</p>
          <p className="mt-1">Dữ liệu được lưu cục bộ trên thiết bị của bạn.</p>
        </div>

      </div>
    </div>
  );
};
export default Setup;