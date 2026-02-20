/**
 * Purpose: Quản trị hệ thống, dữ liệu và thiết lập đồng bộ MindCap (v6.46).
 * Business Rule: 
 * - Quản lý Export/Import JSON chuẩn.
 * - [UI UPDATE]: Sắp xếp theo thứ tự: 1. Knowledge Bridge, 2. Export/Import, 3. Spark & Forgiveness (Hàng đôi đối xứng).
 * - [FIX]: Hợp nhất nút Test vào khối Spark để tạo sự cân bằng thị giác.
 */

import React, { useRef, useState, useEffect } from 'react';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';
import { useUiStore } from '../../store/ui-store';
import { NotificationManager } from '../spark/notification-manager';

export const SetupPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [forgivenessHour, setForgivenessHour] = useState<number>(19); // Mặc định là 19h
  const { setActiveTab } = useUiStore();

  /**
   * [INITIALIZATION]: Load cấu hình người dùng từ Database.
   */
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }

    const loadSettings = async () => {
      const profile = await db.userProfile.toCollection().first();
      if (profile && profile.forgivenessHour !== undefined) {
        setForgivenessHour(profile.forgivenessHour);
      }
    };
    loadSettings();
  }, []);

  /**
   * [ACTION]: Cập nhật Giờ tha thứ vào hồ sơ người dùng.
   */
  const handleUpdateForgivenessHour = async (hour: number) => {
    try {
      setForgivenessHour(hour);
      await db.userProfile.toCollection().modify({ forgivenessHour: hour });
      triggerHaptic('light');
    } catch (err) {
      console.error("Cập nhật Giờ tha thứ thất bại:", err);
    }
  };

  // --- 0. KÍCH HOẠT & THỬ NGHIỆM SPARK NOTIFICATION ---
  const handleEnableNotifications = async () => {
    triggerHaptic('medium');

    if (!("Notification" in window)) {
      alert("Trình duyệt này không hỗ trợ thông báo hệ thống.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        alert("Kích hoạt thành công! Hãy thử nút 'Test Spark' bên dưới.");
      } else if (permission === 'denied') {
        alert("Quyền bị từ chối. Hãy kiểm tra Cài đặt > Mind Cap.");
      }
    } catch (err) {
      console.error("Lỗi yêu cầu quyền:", err);
    }
  };

  /**
   * [TEST ACTION]: Gửi thông báo thử nghiệm sau 5 giây. 
   */
  const handleTestNotification = () => {
    triggerHaptic('success');
    alert("Thông báo sẽ gửi sau 5 giây. Hãy KHÓA MÀN HÌNH ngay bây giờ!");
    NotificationManager.sendTestNotification();
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

  // --- 2. IMPORT JSON CHUẨN (WITH SANITIZATION) ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!imported.data) throw new Error("Định dạng file không đúng");

        const sanitizedTasks = (imported.data.tasks || []).map((t: any) => ({
          ...t,
          syncStatus: t.syncStatus || 'pending'
        }));

        const sanitizedThoughts = (imported.data.thoughts || []).map((t: any) => ({
          ...t,
          syncStatus: t.syncStatus || 'pending'
        }));

        await db.transaction('rw', db.tasks, db.thoughts, db.moods, async () => {
          await db.tasks.bulkPut(sanitizedTasks);
          await db.thoughts.bulkPut(sanitizedThoughts);
          await db.moods.bulkPut(imported.data.moods || []);
        });

        alert("Nhập dữ liệu thành công! Toàn bộ ý tưởng đã được đưa vào hàng chờ Review.");
        triggerHaptic('success');
      } catch (err) {
        alert("Lỗi khi nhập file: " + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-32 space-y-8 animate-in fade-in duration-700 select-none">
      <header>
        <h2 className="text-2xl font-black tracking-tighter text-slate-900">SETUP</h2>
        <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Quản trị dữ liệu & Hệ thống</p>
      </header>

      {/* 1) CẦU NỐI TRI THỨC (OBSIDIAN SYNC) */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-500/50">Knowledge Bridge</h3>
        <button 
          onClick={() => { triggerHaptic('medium'); setActiveTab('sync-review'); }}
          className="w-full p-5 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="text-left">
            <p className="text-[11px] font-bold text-purple-700 group-hover:text-purple-900">Sync Review Mode</p>
            <p className="text-[8px] opacity-40 uppercase mt-0.5">Duyệt ý tưởng trước khi đẩy vào Obsidian</p>
          </div>
          <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </button>
      </section>

      {/* 2) DỮ LIỆU HỆ THỐNG (EXPORT/IMPORT) */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">Dữ liệu hệ thống</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all group">
            <span className="text-xs font-bold">Export JSON</span>
            <span className="text-[8px] opacity-40 uppercase mt-1">Sao lưu toàn bộ</span>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all group">
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            <span className="text-xs font-bold">Import JSON</span>
            <span className="text-[8px] opacity-40 uppercase mt-1">Khôi phục gốc</span>
          </button>
        </div>
      </section>

      {/* 3 & 4) HÀNG ĐÔI ĐỐI XỨNG: SPARK ENGINE & PSYCHOLOGICAL RELIEF */}
      <section className="grid grid-cols-2 gap-3">
        {/* SPARK ENGINE (TRÁI) - Cấu trúc hợp nhất khối */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500/50">Spark Engine</h3>
          <div className={`p-4 border rounded-2xl flex flex-col justify-between min-h-[110px] transition-all
            ${permissionStatus === 'granted' ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'}`}
          >
            <button 
              onClick={handleEnableNotifications}
              disabled={permissionStatus === 'granted'}
              className="flex flex-col items-start gap-1 text-left w-full"
            >
              <p className={`text-[10px] font-bold leading-tight ${permissionStatus === 'granted' ? 'text-blue-600/60' : 'text-blue-600'}`}>
                {permissionStatus === 'granted' ? 'Đã bật' : 'Kích hoạt'}
              </p>
              <p className="text-[8px] opacity-40 uppercase">Thông báo</p>
            </button>

            {permissionStatus === 'granted' && (
              <button 
                onClick={handleTestNotification}
                className="py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-[0.95] transition-all"
              >
                🚀 Test (5s)
              </button>
            )}
          </div>
        </div>

        {/* PSYCHOLOGICAL RELIEF (PHẢI) - Giờ Tha Thứ */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Psychological</h3>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-between min-h-[110px]">
            <div className="text-left">
              <p className="text-[10px] font-bold text-emerald-700 leading-tight">Giờ Tha Thứ</p>
              <p className="text-[8px] opacity-40 uppercase">Giải phóng Focus</p>
            </div>
            <select 
              value={forgivenessHour}
              onChange={(e) => handleUpdateForgivenessHour(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-emerald-200 text-emerald-700 text-[11px] font-black px-2 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i < 10 ? `0${i}` : i}:00</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <footer className="pt-10 pb-10 opacity-10 text-center font-black uppercase tracking-[0.4em] text-[8px]">
        Mind Cap Engine v1.0
      </footer>
    </div>
  );
};