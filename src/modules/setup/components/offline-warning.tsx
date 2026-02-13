import React from 'react';
import { useSettingStore } from '../../../store/setting-store';

export const OfflineWarning: React.FC = () => {
  const { isStorageAtRisk } = useSettingStore();

  if (!isStorageAtRisk() || navigator.onLine) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
        <span className="text-4xl text-red-500 animate-pulse">⚠️</span>
      </div>
      <h2 className="text-white text-lg font-black uppercase tracking-widest mb-4">Cảnh báo sinh tồn dữ liệu</h2>
      <p className="text-white/40 text-sm mb-8 leading-relaxed max-w-xs">
        Bạn đã ngoại tuyến hơn 3 ngày. Để ngăn trình duyệt tự động xóa bộ nhớ đệm, vui lòng kết nối mạng trong giây lát.
      </p>
      <div className="w-full max-w-xs p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
        <p className="text-[10px] text-white/20 uppercase font-bold">Lý do kỹ thuật</p>
        <p className="text-[9px] text-white/40 mt-1 italic">Cơ chế tự động giải phóng dung lượng của hệ điều hành iOS/Safari.</p>
      </div>
    </div>
  );
};