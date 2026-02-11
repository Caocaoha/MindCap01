import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, WifiOff, Trash2, Download, Upload, 
  Terminal, AlertTriangle, Fingerprint, FileJson, CheckCircle 
} from 'lucide-react';
import { db } from '../../core/db'; // Chỉnh lại đường dẫn import tùy theo cấu trúc thực tế

export const SettingsSanctuary = () => {
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [panicMode, setPanicMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Trạng thái đang xử lý import/export
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. HIỆU ỨNG GIẢ LẬP QUÉT MẠNG ---
  useEffect(() => {
    const steps = [
      "Khởi tạo giao thức bảo mật...",
      "Kiểm tra luồng dữ liệu ra (Outbound): 0 Kbps",
      "Trạng thái mạng: CÔ LẬP (AIR-GAPPED)",
      "XÁC NHẬN: 100% LOCAL STORAGE"
    ];
    let delay = 0;
    steps.forEach((step) => {
      delay += 400;
      setTimeout(() => setAuditLogs(prev => [...prev, `> ${step}`]), delay);
    });
  }, []);

  // --- 2. LOGIC EXPORT (XUẤT DỮ LIỆU) ---
  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Thu thập dữ liệu từ tất cả các bảng
      const [tasks, thoughts, userState] = await Promise.all([
        db.table('tasks').toArray(),
        db.table('thoughts').toArray(),     // Giả định bảng thoughts tồn tại
        db.table('userState').toArray()     // Giả định bảng userState tồn tại
      ]);
      
      const backupData = {
        meta: {
          app: "Mind Cap",
          version: "1.5",
          exportedAt: new Date().toISOString(),
          recordCount: tasks.length + thoughts.length
        },
        data: {
          tasks,
          thoughts,
          userState
        }
      };

      // Tạo file Blob & Tải xuống
      const fileName = `MindCap_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Feedback vào Audit Log
      setAuditLogs(prev => [...prev, `> [EXPORT] Thành công: ${fileName}`]);
    } catch (error) {
      console.error(error);
      alert("Lỗi xuất dữ liệu: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. LOGIC IMPORT (NHẬP DỮ LIỆU) ---
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const parsedData = JSON.parse(jsonContent);

        // A. Validation cơ bản
        if (!parsedData.meta || parsedData.meta.app !== "Mind Cap") {
          throw new Error("File không hợp lệ hoặc không phải của Mind Cap.");
        }

        const { tasks, thoughts, userState } = parsedData.data;
        const totalRecords = (tasks?.length || 0) + (thoughts?.length || 0);

        if (!confirm(`Tìm thấy bản sao lưu ngày ${new Date(parsedData.meta.exportedAt).toLocaleDateString()}.\nTổng số bản ghi: ${totalRecords}.\n\nBạn có muốn HỢP NHẤT (Merge) dữ liệu này vào app không?`)) {
          setIsProcessing(false);
          return;
        }

        // B. Thực hiện Transaction (Nguyên tử - All or Nothing)
        await db.transaction('rw', db.table('tasks'), db.table('thoughts'), db.table('userState'), async () => {
          
          // Sử dụng bulkPut để Upsert (Cập nhật nếu trùng ID, Thêm mới nếu chưa có)
          if (tasks && tasks.length) {
            await db.table('tasks').bulkPut(tasks);
          }
          if (thoughts && thoughts.length) {
            await db.table('thoughts').bulkPut(thoughts);
          }
          if (userState && userState.length) {
            await db.table('userState').bulkPut(userState);
          }
        });

        setAuditLogs(prev => [...prev, `> [IMPORT] Khôi phục thành công ${totalRecords} items.`]);
        alert("Khôi phục thành công! Ứng dụng sẽ tải lại.");
        window.location.reload();

      } catch (error) {
        console.error(error);
        alert("Lỗi nhập dữ liệu: File bị hỏng hoặc sai cấu trúc.");
        setAuditLogs(prev => [...prev, `> [IMPORT] FAILED: ${(error as Error).message}`]);
      } finally {
        setIsProcessing(false);
        // Reset input để cho phép chọn lại file đó lần sau nếu muốn
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // --- 4. LOGIC NUKE (XÓA DỮ LIỆU) ---
  const handleNuke = async () => {
    const code = prompt("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn LocalStorage.\nNhập 'DELETE-ALL' để xác nhận:");
    if (code === 'DELETE-ALL') {
      await db.delete();
      await db.open(); // Mở lại DB sạch
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
          <ShieldCheck /> THE VAULT
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Nơi duy nhất nắm giữ linh hồn số của bạn.</p>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* === SECTION 1: VISUAL SOVEREIGNTY === */}
        <section className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-10 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Donut Chart SVG */}
            <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset="0" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">100%</span>
                    <span className="text-[9px] text-emerald-500 font-bold tracking-widest uppercase">Local</span>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-zinc-100">Chủ quyền Dữ liệu Tuyệt đối</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                   Dữ liệu của bạn không bao giờ rời khỏi thiết bị này. Không Cloud. Không Tracking.
                </p>
            </div>
        </section>

        {/* === SECTION 2: IMPORT / EXPORT OPERATIONS === */}
        <section>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileJson size={14}/> Giao thức Sao lưu (JSON)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nút Export */}
            <button 
                onClick={handleExport}
                disabled={isProcessing}
                className="group relative flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
            >
                <div className="mb-3 p-3 bg-zinc-950 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                  <Upload className="text-zinc-400 group-hover:text-emerald-400" size={24} />
                </div>
                <span className="text-sm font-medium text-zinc-200">Sao lưu (Export)</span>
                <span className="text-[10px] text-zinc-500 mt-1">Đóng gói dữ liệu thành JSON</span>
            </button>

            {/* Nút Import */}
            <label className={`group relative flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all active:scale-[0.98] cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="mb-3 p-3 bg-zinc-950 rounded-full group-hover:bg-blue-500/10 transition-colors">
                  <Download className="text-zinc-400 group-hover:text-blue-400" size={24} />
                </div>
                <span className="text-sm font-medium text-zinc-200">Khôi phục (Import)</span>
                <span className="text-[10px] text-zinc-500 mt-1">Nạp lại ký ức từ file</span>
                <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImport} 
                />
            </label>
          </div>
        </section>

        {/* === SECTION 3: AUDIT CONSOLE === */}
        <section className="bg-black rounded-lg border border-zinc-800 overflow-hidden font-mono text-[11px] shadow-inner">
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-400 flex items-center gap-2"><Terminal size={12}/> SYSTEM_AUDIT_LOG</span>
              <span className="text-emerald-600 font-bold text-[9px] animate-pulse">● SECURE</span>
            </div>
            <div className="p-4 h-32 overflow-y-auto space-y-1 custom-scrollbar text-zinc-500">
                {auditLogs.map((log, i) => (
                    <div key={i} className={i === auditLogs.length - 1 ? "text-emerald-500" : ""}>{log}</div>
                ))}
            </div>
        </section>

        {/* === SECTION 4: DANGER ZONE === */}
        <section className="border-t border-zinc-800/50 pt-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-rose-700 font-medium text-sm">
                  <AlertTriangle size={16}/> VÙNG NGUY HIỂM
               </div>
               <button 
                  onClick={() => setPanicMode(!panicMode)}
                  className="text-xs text-zinc-600 hover:text-rose-500 transition-colors"
               >
                 {panicMode ? "Đóng bảng điều khiển" : "Mở bảng điều khiển"}
               </button>
            </div>
            
            {panicMode && (
              <div className="mt-4 p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl animate-in slide-in-from-top-2">
                 <p className="text-xs text-rose-300/70 mb-4">
                   Các hành động dưới đây không thể hoàn tác. Hãy chắc chắn bạn đã Sao lưu (Export) dữ liệu.
                 </p>
                 <button 
                    onClick={handleNuke}
                    className="w-full py-3 bg-transparent border border-rose-800/50 text-rose-500 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                 >
                    <Trash2 size={14} /> Xóa dấu vết (Wipe All Data)
                 </button>
              </div>
            )}
        </section>

      </div>
    </div>
  );
};