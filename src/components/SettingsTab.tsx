import React, { useRef } from 'react';
import { db } from '../db';
import { Download, Upload, Trash2, ShieldAlert, Database } from 'lucide-react';

// --- ĐỊNH NGHĨA COMPONENT CON (Helper Components) ---
// Phải đặt trước SettingsTab hoặc bên ngoài để hệ thống hiểu

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{title}</h3>
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      {children}
    </div>
  </div>
);

const Row = ({ icon: Icon, label, onClick, isDanger = false, subLabel }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors text-left group"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-md transition-colors ${isDanger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
          <span className={`block text-sm font-medium ${isDanger ? 'text-red-600' : 'text-slate-700'}`}>
          {label}
          </span>
          {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
      </div>
    </div>
  </button>
);

// --- MAIN COMPONENT ---

export const SettingsTab = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const allData = {
        entries: await db.entries.toArray(),
        logs: await db.activity_logs.toArray(),
        settings: await db.prompt_configs.toArray(),
        exported_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mind-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) { alert("Lỗi backup: " + e); }
  };

  const handleImportTrigger = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (confirm(`Khôi phục ${data.entries?.length || 0} mục?`)) {
            await db.transaction('rw', db.entries, db.activity_logs, db.prompt_configs, async () => {
                if (data.entries) await db.entries.bulkPut(data.entries);
                if (data.logs) await db.activity_logs.bulkPut(data.logs);
                if (data.settings) await db.prompt_configs.bulkPut(data.settings);
            });
            alert("Thành công! Tải lại trang...");
            window.location.reload();
        }
      } catch (err) { alert("Lỗi file: " + err); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleHardReset = async () => {
    if (confirm("CẢNH BÁO: Xóa sạch dữ liệu?")) {
      if (confirm("Chắc chắn 100%?")) {
        await db.delete();
        window.location.reload();
      }
    }
  };

  return (
    <div className="pb-20">
      <h2 className="text-lg font-bold text-slate-800 mb-6 px-1">Cài đặt hệ thống</h2>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      <Section title="Dữ liệu">
        <Row icon={Download} label="Sao lưu dữ liệu" subLabel="Tải xuống JSON" onClick={handleExport} />
        <Row icon={Upload} label="Khôi phục dữ liệu" subLabel="Nhập từ file Backup" onClick={handleImportTrigger} />
        <Row icon={Database} label="Bộ nhớ trình duyệt" subLabel="IndexedDB" onClick={() => {}} />
      </Section>

      <Section title="Vùng nguy hiểm">
        <Row icon={Trash2} label="Xóa toàn bộ dữ liệu" subLabel="Factory Reset" isDanger={true} onClick={handleHardReset} />
      </Section>

      <div className="text-center mt-12">
        <ShieldAlert className="mx-auto text-slate-300 mb-2" size={24} />
        <p className="text-xs text-slate-400">Mind OS v1.0.0 (Beta)</p>
      </div>
    </div>
  );
};