/**
 * Purpose: Quản trị hệ thống, dữ liệu và thiết lập đồng bộ MindCap.
 * Inputs/Outputs: Giao diện người dùng (JSX.Element).
 * Business Rule: 
 * - Quản lý Export/Import JSON chuẩn và Legacy.
 * - Kích hoạt và thử nghiệm hệ thống thông báo Spark.
 * - Cung cấp lối vào cho hệ thống đồng bộ Obsidian (Sync Review).
 */

import React, { useRef, useState, useEffect } from 'react';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';
import { useUiStore } from '../../store/ui-store';
import { NotificationManager } from '../spark/notification-manager';

export const SetupPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

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

  // --- 3. IMPORT LEGACY ---
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
            await db.thoughts.add({
              content: entry.content,
              type: 'thought',
              wordCount: entry.content.split(/\s+/).length,
              createdAt: timestamp,
              updatedAt: timestamp,
              recordStatus: 'success'
            });
            await db.moods.add({ score: 0, label: 'imported', createdAt: timestamp });
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
        <h2 className="text-2xl font-black tracking-tighter text-slate-900">SETUP</h2>
        <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Quản trị dữ liệu & Hệ thống</p>
      </header>

      {/* [NEW]: CẦU NỐI TRI THỨC (OBSIDIAN SYNC) */}
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

      {/* [NEW]: HỆ THỐNG SPARK NOTIFICATION  */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500/50">Spark Engine</h3>
        <div className="space-y-2">
          <button 
            onClick={handleEnableNotifications}
            disabled={permissionStatus === 'granted'}
            className={`w-full p-5 border rounded-2xl flex items-center justify-between transition-all
              ${permissionStatus === 'granted' ? 'bg-blue-50/50 border-blue-100 opacity-60' : 'bg-blue-500/10 border-blue-500/20'}`}
          >
            <div className="text-left">
              <p className="text-[11px] font-bold text-blue-600">
                {permissionStatus === 'granted' ? 'Thông báo: Đã bật' : 'Kích hoạt Spark Messenger'}
              </p>
              <p className="text-[8px] opacity-40 uppercase mt-0.5">Cấp quyền hệ thống cho iOS/Android</p>
            </div>
            {permissionStatus !== 'granted' && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
          </button>

          {permissionStatus === 'granted' && (
            <button 
              onClick={handleTestNotification}
              className="w-full p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-blue-500/10"
            >
              🚀 Chạy thử Spark (5 giây)
            </button>
          )}
        </div>
      </section>

      {/* Cụm nút Import/Export */}
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

      {/* Nút Import file Legacy */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-600/50">Legacy Port</h3>
        <button onClick={() => legacyInputRef.current?.click()} className="w-full p-5 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between active:scale-95 transition-all">
          <input type="file" ref={legacyInputRef} onChange={handleLegacyImport} className="hidden" accept=".json" />
          <div className="text-left">
            <p className="text-[11px] font-bold text-yellow-700">Nhập MindCap Legacy</p>
            <p className="text-[8px] opacity-40 uppercase mt-0.5">Dành cho dữ liệu phiên bản cũ</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 opacity-50"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>
      </section>

      <footer className="pt-10 opacity-10 text-center font-black uppercase tracking-[0.4em] text-[8px]">
        Mind Cap Engine v1.0
      </footer>
    </div>
  );
};