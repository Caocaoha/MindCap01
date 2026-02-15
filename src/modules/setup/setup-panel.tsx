import React, { useRef, useState, useEffect } from 'react';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';

export const SetupPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);
  
  // Trạng thái hiển thị quyền thông báo hiện tại
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // --- 0. KÍCH HOẠT SPARK NOTIFICATION (NEW) ---
  const handleEnableNotifications = async () => {
    triggerHaptic('medium');

    if (!("Notification" in window)) {
      alert("Trình duyệt này không hỗ trợ thông báo hệ thống.");
      return;
    }

    try {
      // Bắt buộc gọi trong scope của hàm click để iOS chấp nhận 
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        alert("Kích hoạt thành công! Hệ thống Spark Messenger đã sẵn sàng.");
        
        // Gửi thử một thông báo kiểm tra (Spotlight) 
        new Notification("Mind Cap Spark", {
          body: "Hệ thống thông báo đã kết nối thành công với thiết bị của bạn.",
          icon: "/icon-192x192.png"
        });
      } else if (permission === 'denied') {
        alert("Quyền thông báo bị từ chối. Bạn cần vào Cài đặt > Mind Cap để bật lại.");
      }
    } catch (err) {
      console.error("Lỗi yêu cầu quyền:", err);
      alert("Không thể yêu cầu quyền thông báo. Hãy đảm bảo bạn đã Add to Home Screen.");
    }
  };

  // --- 1. EXPORT JSON CHUẨN ---
  const handleExport = async () => {
    try {
      const tasks = await db.tasks.toArray();
      const thoughts = await db.thoughts.toArray();
      const moods = await db.moods.toArray();

      const backupData = {
        version: 1.0,
        timestamp: new Date().toISOString(),
        data: { tasks, thoughts, moods }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindCap_Full_Backup_${new Date().toLocaleDateString()}.json`;
      a.click();
      triggerHaptic('success');
    } catch (err) {
      console.error("Export thất bại:", err);
    }
  };

  // --- 2. IMPORT JSON CHUẨN ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!imported.data) throw new Error("Định dạng file không đúng");

        await db.transaction('rw', db.tasks, db.thoughts, db.moods, async () => {
          await db.tasks.bulkPut(imported.data.tasks || []);
          await db.thoughts.bulkPut(imported.data.thoughts || []);
          await db.moods.bulkPut(imported.data.moods || []);
        });

        alert("Nhập dữ liệu thành công!");
        triggerHaptic('success');
      } catch (err) {
        alert("Lỗi khi nhập file: " + err);
      }
    };
    reader.readAsText(file);
  };

  // --- 3. IMPORT LEGACY (MindCap_Backup_2026-02-13.json) ---
  const handleLegacyImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        const entries = backup.entries || [];

        await db.transaction('rw', db.thoughts, db.moods, async () => {
          for (const entry of entries) {
            const timestamp = new Date(entry.createdAt).getTime();
            
            // Gán content và createdAt, mặc định thought
            await db.thoughts.add({
              content: entry.content,
              type: 'thought',
              wordCount: entry.content.split(/\s+/).length,
              createdAt: timestamp,
              updatedAt: timestamp,
              recordStatus: 'success'
            });

            // Mặc định mood là Normal (score: 0)
            await db.moods.add({
              score: 0,
              label: 'imported',
              createdAt: timestamp
            });
          }
        });

        alert(`Đã nhập thành công ${entries.length} bản ghi legacy!`);
        triggerHaptic('success');
      } catch (err) {
        alert("Lỗi import legacy: " + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-2xl font-black tracking-tighter">SETUP</h2>
        <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Quản trị dữ liệu & Hệ thống</p>
      </header>

      {/* [NEW]: HỆ THỐNG SPARK NOTIFICATION [cite: 18, 19] */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500/50">Spark Engine</h3>
        <button 
          onClick={handleEnableNotifications}
          disabled={permissionStatus === 'granted'}
          className={`w-full p-5 border rounded-2xl flex items-center justify-between group active:scale-95 transition-all
            ${permissionStatus === 'granted' 
              ? 'bg-blue-500/5 border-blue-500/10 opacity-60 cursor-default' 
              : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'}`}
        >
          <div className="text-left">
            <p className={`text-[11px] font-bold ${permissionStatus === 'granted' ? 'text-blue-400' : 'text-blue-500'}`}>
              {permissionStatus === 'granted' ? 'Hệ thống thông báo: Đã bật' : 'Kích hoạt Spark Notification'}
            </p>
            <p className="text-[8px] opacity-40 uppercase mt-0.5">
              {permissionStatus === 'granted' 
                ? 'Đang lắng nghe mốc Thác đổ (Waterfall) ' 
                : 'Cần thiết để nhắc nhở ký ức Spotlight '}
            </p>
          </div>
          <div className={`p-2 rounded-full ${permissionStatus === 'granted' ? 'bg-blue-500/20' : 'bg-blue-500/40 animate-pulse'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </button>
      </section>

      {/* Cụm nút Import/Export */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">Dữ liệu hệ thống</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-white/5 rounded-[2rem] hover:bg-white hover:text-black transition-all group"
          >
            <span className="text-xs font-bold">Export JSON</span>
            <span className="text-[8px] opacity-40 uppercase mt-1 group-hover:opacity-100">Sao lưu toàn bộ</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-white/5 rounded-[2rem] hover:bg-blue-500 hover:text-white transition-all group"
          >
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            <span className="text-xs font-bold">Import JSON</span>
            <span className="text-[8px] opacity-40 uppercase mt-1 group-hover:opacity-100">Khôi phục gốc</span>
          </button>
        </div>
      </section>

      {/* Nút Import file Legacy */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/50">Legacy Port</h3>
        <button 
          onClick={() => legacyInputRef.current?.click()}
          className="w-full p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
        >
          <input type="file" ref={legacyInputRef} onChange={handleLegacyImport} className="hidden" accept=".json" />
          <div className="text-left">
            <p className="text-[11px] font-bold text-yellow-500">Nhập MindCap Legacy</p>
            <p className="text-[8px] opacity-40 uppercase mt-0.5">Content & CreatedAt (Mood: Normal)</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500 opacity-50">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </button>
      </section>

      <footer className="pt-10 opacity-10 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">Mind Cap Engine v1.0</p>
      </footer>
    </div>
  );
};