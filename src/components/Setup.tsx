import React from 'react';
import { Settings, Cpu, ShieldAlert, Palette, Download } from 'lucide-react';

const Setup: React.FC = () => {
  return (
    <div className="p-6">
      <header className="pt-2 mb-5">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <Settings className="text-slate-500" /> SETUP
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Cấu hình hệ điều hành</p>
      </header>

      <div className="flex flex-col gap-4">
        {[
          { icon: <Cpu size={18}/>, label: "AI Prompts", desc: "Quản lý trí tuệ NLP" },
          { icon: <Palette size={18}/>, label: "Giao diện", desc: "Entropy UI & Chế độ tối" },
          { icon: <ShieldAlert size={18}/>, label: "Bảo mật", desc: "Mã hóa Mật đạo" },
          { icon: <Download size={18}/>, label: "Dữ liệu", desc: "Sao lưu & Khôi phục" },
        ].map((item, i) => (
          <button key={i} className="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-left">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-600">{item.icon}</div>
            <div>
              <div className="text-sm font-bold text-slate-800">{item.label}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default Setup;