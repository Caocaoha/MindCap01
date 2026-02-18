/**
 * Purpose: Hiển thị thông báo tương tác tại tâm điểm màn hình.
 * Business Rule: Xuất hiện chính giữa, tích hợp nút Sửa để kích hoạt lại Modal.
 */

import React from 'react';
import { useNotificationStore } from '../../store/notification-store';
import { triggerHaptic } from '../../utils/haptic';

export const GlobalToast: React.FC = () => {
  const { isOpen, message, onEditAction, hideNotification } = useNotificationStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pointer-events-none animate-in fade-in zoom-in duration-300">
      {/* Backdrop mờ nhẹ */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
      
      <div className="relative bg-white border border-slate-200 shadow-2xl rounded-[20px] p-5 flex flex-col items-center gap-4 max-w-xs w-full pointer-events-auto">
        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
          <span className="text-xl">✨</span>
        </div>
        
        <p className="text-[13px] font-bold text-slate-800 text-center leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2 w-full mt-2">
          <button 
            onClick={() => {
              triggerHaptic('light');
              hideNotification();
            }}
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
              className="flex-1 py-3 rounded-xl bg-purple-600 text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-lg shadow-purple-100"
            >
              Sửa lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};