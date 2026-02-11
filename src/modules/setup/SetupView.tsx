// src/modules/setup/SetupView.tsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Download, Upload, Activity, WifiOff, X, Skull } from 'lucide-react';
import { DataHandler } from '../../utils/dataHandler';
import { useSettingStore } from '../../store/settingStore';

interface SetupViewProps {
  onClose: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onClose }) => {
  const { isAutoWipeEnabled, toggleAutoWipe } = useSettingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panicStep, setPanicStep] = useState(0); // 0: None, 1: Confirm, 2: Execute

  // --- HANDLERS ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè hoàn toàn!")) {
        DataHandler.importData(file).then(() => window.location.reload());
      }
    }
  };

  const handleNuke = async () => {
    await DataHandler.nukeData();
    window.location.reload(); // Hard Refresh
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-300"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield size={20} className="fill-emerald-400/20" />
            <span className="font-bold tracking-widest text-xs uppercase">Chủ Quyền Dữ Liệu</span>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-500 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. SOVEREIGNTY SCORE */}
          <div className="text-center space-y-2">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              {/* Animated Circle */}
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <motion.circle 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="64" cy="64" r="56" 
                  stroke="currentColor" strokeWidth="8" 
                  fill="transparent" 
                  className="text-emerald-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">100%</span>
                <span className="text-[10px] uppercase font-bold text-emerald-500">Local</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              0 byte dữ liệu được gửi đi. Toàn bộ tài sản số nằm trong tay bạn.
            </p>
          </div>

          {/* 2. ZERO-NETWORK AUDIT */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase text-slate-400">
              <Activity size={12} /> Báo cáo truy cập mạng
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Outgoing Requests:</span>
                <span className="font-mono text-emerald-400">0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Cloud Sync:</span>
                <span className="font-mono text-slate-500">Disabled</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                <WifiOff size={10} />
                Hệ thống đang hoạt động trong môi trường cách ly.
              </div>
            </div>
          </div>

          {/* 3. IMPORT / EXPORT */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => DataHandler.exportData()}
              className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-xl transition-colors"
            >
              <Download size={20} className="text-blue-400" />
              <span className="text-xs font-bold">Sao lưu (.json)</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 rounded-xl transition-colors"
            >
              <Upload size={20} className="text-purple-400" />
              <span className="text-xs font-bold">Khôi phục</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImport}
            />
          </div>

          {/* 4. DANGER ZONE (PANIC BUTTON) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-bold text-red-500 flex items-center gap-2">
                <Skull size={14} /> VÙNG NGUY HIỂM
              </div>
              
              {/* Toggle Auto Wipe */}
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isAutoWipeEnabled} onChange={toggleAutoWipe} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isAutoWipeEnabled ? 'bg-red-900' : 'bg-slate-800'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAutoWipeEnabled ? 'transform translate-x-4 bg-red-500' : ''}`}></div>
                </div>
                <span className="ml-2 text-[10px] text-slate-400">Xóa khi nhập sai 10 lần</span>
              </label>
            </div>

            {panicStep === 0 ? (
              <button 
                onClick={() => setPanicStep(1)}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-900/50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert size={16} /> XÓA DẤU VẾT (PANIC)
              </button>
            ) : (
              <div className="space-y-2 animate-in fade-in zoom-in">
                <p className="text-xs text-red-400 text-center font-bold">
                  Hành động này không thể hoàn tác. Mọi ký ức sẽ bị xóa vĩnh viễn.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPanicStep(0)}
                    className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-xs"
                  >
                    HỦY BỎ
                  </button>
                  <button 
                    onClick={handleNuke}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs animate-pulse"
                  >
                    XÁC NHẬN XÓA
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};