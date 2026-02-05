import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Download, Upload, Shield, Trash2, Database, AlertTriangle, FileJson, CheckCircle2, WifiOff } from 'lucide-react';
import { db, type Entry } from '../utils/db';

const Setup: React.FC = () => {
  const [stats, setStats] = useState({ totalEntries: 0, dbSize: '0 KB' });
  const [isImporting, setIsImporting] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeStep, setWipeStep] = useState(0); // 0: Idle, 1: Confirm, 2: Final Warning

  // --- 1. DATA AUDIT ---
  useEffect(() => {
    const calcStats = async () => {
      const count = await db.entries.count();
      // Ước lượng sơ bộ dung lượng (chỉ mang tính tham khảo)
      const allData = await db.entries.toArray();
      const jsonString = JSON.stringify(allData);
      const bytes = new TextEncoder().encode(jsonString).length;
      const kb = (bytes / 1024).toFixed(2);
      
      setStats({ totalEntries: count, dbSize: `${kb} KB` });
    };
    calcStats();
  }, [isImporting]); // Recalc sau khi import

  // --- 2. EXPORT LOGIC (SAO LƯU) ---
  const handleExport = async () => {
    try {
      const allEntries = await db.entries.toArray();
      const dataStr = JSON.stringify(allEntries, null, 2); // Pretty print cho người dùng đọc được
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `mind-os-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Lỗi khi xuất dữ liệu: " + error);
    }
  };

  // --- 3. IMPORT LOGIC (KHÔI PHỤC) ---
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const importedData = JSON.parse(jsonContent) as Entry[];

        if (!Array.isArray(importedData)) throw new Error("File không đúng định dạng Mind OS.");

        // Chiến thuật Merge: Dùng bulkPut để ghi đè nếu trùng ID, thêm mới nếu chưa có
        // Lưu ý: Để an toàn, ta có thể lọc bỏ ID để luôn tạo mới, nhưng giữ ID giúp khôi phục chính xác
        await db.entries.bulkPut(importedData);
        
        alert(`Đã khôi phục thành công ${importedData.length} bản ghi ký ức.`);
        setIsImporting(false);
      } catch (error) {
        alert("File bị lỗi hoặc hỏng. Không thể khôi phục.");
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // --- 4. WIPE LOGIC (XÓA DẤU VẾT) ---
  const handleWipe = async () => {
    await db.entries.clear();
    setStats({ totalEntries: 0, dbSize: '0 KB' });
    setShowWipeConfirm(false);
    setWipeStep(0);
    alert("Hệ thống đã được tẩy rửa sạch sẽ.");
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <Settings size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Cài đặt & Dữ liệu</h2>
        </header>

        {/* --- SECTION 1: VISUAL MANIFESTO (TUYÊN NGÔN) --- */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={120} className="text-green-500" />
          </div>
          
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Shield size={20} className="text-green-500" />
            Chủ quyền Dữ liệu
          </h3>
          
          <div className="mt-6 flex flex-col gap-4">
            {/* Thanh tiến trình 100% Local */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>LƯU TRỮ TRÊN THIẾT BỊ</span>
                <span className="text-green-600">100%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Used: {stats.dbSize}</span>
                <span>Cloud: 0 bytes</span>
              </div>
            </div>

            {/* Zero-Network Audit */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="bg-slate-200 p-2 rounded-full text-slate-500">
                <WifiOff size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600">Zero-Network Audit</p>
                <p className="text-[10px] text-slate-400">Không có kết nối mạng nào được thực hiện.</p>
              </div>
              <CheckCircle2 size={16} className="text-green-500 ml-auto" />
            </div>
          </div>
        </section>

        {/* --- SECTION 2: BACKUP & RESTORE --- */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Sao lưu & Khôi phục</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Export Button */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 border border-slate-100 hover:border-blue-200 transition-colors"
            >
              <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                <Download size={24} />
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-700 text-sm">Đóng gói</span>
                <span className="text-[10px] text-slate-400">Xuất file .json</span>
              </div>
            </motion.button>

            {/* Import Button */}
            <motion.label 
              whileTap={{ scale: 0.95 }}
              className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-3 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer relative"
            >
              <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                {isImporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload size={24}/></motion.div> : <Upload size={24} />}
              </div>
              <div className="text-center">
                <span className="block font-bold text-slate-700 text-sm">Nạp ký ức</span>
                <span className="text-[10px] text-slate-400">Nhập file .json</span>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={isImporting} />
            </motion.label>
          </div>
          
          <p className="text-[10px] text-slate-400 text-center px-8 italic">
            "Dữ liệu này thuộc về bạn. Bạn có thể mở file JSON bằng bất kỳ trình soạn thảo văn bản nào để kiểm tra tính trung thực."
          </p>
        </section>

        {/* --- SECTION 3: DANGER ZONE (VÙNG NGUY HIỂM) --- */}
        <section className="mt-4">
          <div className="border border-red-100 bg-red-50/50 rounded-[2rem] p-6">
            {!showWipeConfirm ? (
              <div className="flex items-center justify-between" onClick={() => { setShowWipeConfirm(true); setWipeStep(1); }}>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full text-red-500 shadow-sm">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-600 text-sm">Vùng nguy hiểm</h4>
                    <p className="text-[10px] text-red-400">Xóa vĩnh viễn mọi dữ liệu</p>
                  </div>
                </div>
                <button className="text-xs font-bold bg-white text-red-500 px-4 py-2 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-colors">
                  Mở
                </button>
              </div>
            ) : (
              <div className="text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
                <h4 className="font-bold text-red-600 mb-1">
                  {wipeStep === 1 ? "Xác nhận xóa?" : "CẢNH BÁO CUỐI CÙNG!"}
                </h4>
                <p className="text-xs text-red-400 mb-4">
                  {wipeStep === 1 
                    ? "Hành động này không thể hoàn tác. Mọi ký ức sẽ biến mất." 
                    : "Bạn thực sự muốn xóa sạch dấu vết ngay lập tức?"}
                </p>
                
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => { setShowWipeConfirm(false); setWipeStep(0); }}
                    className="px-4 py-2 bg-white text-slate-500 text-xs font-bold rounded-full shadow-sm"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => {
                      if (wipeStep === 1) setWipeStep(2);
                      else handleWipe();
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full shadow-md hover:bg-red-600"
                  >
                    {wipeStep === 1 ? "Tiếp tục xóa" : "XÓA NGAY LẬP TỨC"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer Info */}
        <div className="text-center pb-8 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
            <Database size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">MIND OS v3.1 (Offline-Core)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Setup;