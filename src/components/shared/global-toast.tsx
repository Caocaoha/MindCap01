/**
 * [FIX]: Bản an toàn không phụ thuộc plugin animation và thêm log debug.
 * [UPDATE v1.3]: Chuyển đổi logic nhận diện theme sang sử dụng 'type' từ store.
 */
import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/notification-store';
import { triggerHaptic } from '../../utils/haptic';

export const GlobalToast: React.FC = () => {
  // Bổ sung lấy trường 'type' từ store để định danh theme
  const { isOpen, message, type, onEditAction, hideNotification } = useNotificationStore();

  // Xác định theme Emerald dựa trên type 'forgiveness' thay vì dò tìm string
  const isForgivenessType = type === 'forgiveness';

  // Debug log để kiểm tra state
  useEffect(() => {
    if (isOpen) console.log("🔔 Notification Triggered:", message, "| Type:", type);
  }, [isOpen, message, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pointer-events-none">
      {/* Backdrop: Tăng độ đậm để dễ nhận biết */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto" 
        onClick={hideNotification}
      />
      
      <div className={`relative bg-white border-2 shadow-2xl rounded-[24px] p-6 flex flex-col items-center gap-4 max-w-xs w-full pointer-events-auto transform transition-all 
        ${isForgivenessType ? 'border-emerald-100' : 'border-slate-100'}`}
      >
        {/* ICON AREA: Hiển thị icon dựa trên logic type */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-bounce 
          ${isForgivenessType ? 'bg-emerald-50' : 'bg-indigo-50'}`}
        >
          <span className="text-2xl">
            {isForgivenessType ? '🌿' : '✨'}
          </span>
        </div>
        
        <p className={`text-sm font-bold text-center leading-relaxed 
          ${isForgivenessType ? 'text-emerald-800' : 'text-slate-800'}`}
        >
          {message}
        </p>

        <div className="flex gap-2 w-full mt-2">
          <button 
            onClick={() => { triggerHaptic('light'); hideNotification(); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all 
              ${isForgivenessType 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-slate-100 text-slate-500'}`}
          >
            {isForgivenessType ? 'Nhận lấy' : 'Đóng'}
          </button>
          
          {onEditAction && (
            <button 
              onClick={() => {
                triggerHaptic('medium');
                onEditAction();
                hideNotification();
              }}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-lg shadow-indigo-200"
            >
              Sửa lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};