import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSettingStore } from '../../store/setting-store';

/**
 * [SHARED_UI]: Thành phần thông báo cập nhật và quản lý trạng thái ngoại tuyến.
 * Tuân thủ chiến lược Offline-First và bảo mật Cache. [cite: 17, 20]
 */
export const ReloadPrompt: React.FC = () => {
  const { updateOnlineTimestamp } = useSettingStore();
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) { // [FIX]: Gán kiểu tường minh cho 'r'
      if (r) {
        // Cập nhật timestamp mỗi khi Service Worker được kiểm tra thành công 
        if (navigator.onLine) updateOnlineTimestamp();
        console.log('SW Registered:', r);
      }
    },
    onRegisterError(error) {
      console.error('SW Registration Error:', error);
    }
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false); // [FIX]: Đã sửa từ setRefresh thành setNeedRefresh
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[200] sm:left-auto sm:w-80">
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
        <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-2">
          {needRefresh ? 'Cập nhật hệ thống' : 'Trạng thái bộ nhớ'}
        </h4>
        <p className="text-white/40 text-xs mb-6 leading-relaxed">
          {needRefresh 
            ? 'Phiên bản mới của Mind Cap đã sẵn sàng. Hãy làm mới để áp dụng.' 
            : 'Ứng dụng đã sẵn sàng hoạt động ngoại tuyến 100%.'}
        </p>
        <div className="flex gap-3">
          {needRefresh && (
            <button 
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-white text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform"
            >
              Làm mới ngay
            </button>
          )}
          <button 
            onClick={close} 
            className="flex-1 py-3 text-[10px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};