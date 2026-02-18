/**
 * [FIX]: Bản an toàn không phụ thuộc plugin animation và thêm log debug.
 */
import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/notification-store';
import { triggerHaptic } from '../../utils/haptic';

export const GlobalToast: React.FC = () => {
  const { isOpen, message, onEditAction, hideNotification } = useNotificationStore();

  // Debug log để kiểm tra state
  useEffect(() => {
    if (isOpen) console.log("🔔 Notification Triggered:", message);
  }, [isOpen, message]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pointer-events-none">
      {/* Backdrop: Tăng độ đậm để dễ nhận biết */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto" 
        onClick={hideNotification}
      />
      
      <div className="relative bg-white border-2 border-slate-100 shadow-2xl rounded-[24px] p-6 flex flex-col items-center gap-4 max-w-xs w-full pointer-events-auto transform transition-all">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-2xl">✨</span>
        </div>
        
        <p className="text-sm font-bold text-slate-800 text-center leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2 w-full mt-2">
          <button 
            onClick={() => { triggerHaptic('light'); hideNotification(); }}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 active:scale-95 transition-all"
          >
            Đóng
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