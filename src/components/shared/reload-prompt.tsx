import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSettingStore } from '../../store/setting-store';

/**
 * [SHARED_UI]: Thành phần thông báo cập nhật và quản lý trạng thái ngoại tuyến.
 * Cập nhật Giai đoạn 2: Thẩm mỹ Linear.app (White background, Slate borders, 6px radius).
 */
export const ReloadPrompt: React.FC = () => {
  const { updateOnlineTimestamp } = useSettingStore();
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) { // [FIX]: Gán kiểu tường minh cho 'r' (Bảo tồn)
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
    setNeedRefresh(false); // [FIX]: Đã sửa từ setRefresh thành setNeedRefresh (Bảo tồn)
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    /* CONTAINER: Chuyển sang nền trắng, border slate-200, bo góc 6px, loại bỏ shadow-2xl */
    <div className="fixed bottom-6 left-6 right-6 z-[200] sm:left-auto sm:w-80 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-slate-200 p-6 rounded-[6px] shadow-none backdrop-blur-none">
        
        {/* TIÊU ĐỀ: Chuyển sang Slate-900 chuẩn Linear */}
        <h4 className="text-slate-900 text-[10px] font-bold uppercase tracking-widest mb-2">
          {needRefresh ? 'Cập nhật hệ thống' : 'Trạng thái bộ nhớ'}
        </h4>
        
        {/* NỘI DUNG: Chuyển sang Slate-500 */}
        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
          {needRefresh 
            ? 'Phiên bản mới của Mind Cap đã sẵn sàng. Hãy làm mới để áp dụng.' 
            : 'Ứng dụng đã sẵn sàng hoạt động ngoại tuyến 100%.'}
        </p>

        <div className="flex gap-3">
          {needRefresh && (
            /* BUTTON PRIMARY: Xanh đậm #2563EB, bo góc 6px */
            <button 
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-[#2563EB] text-white py-2.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
            >
              Làm mới ngay
            </button>
          )}
          
          {/* BUTTON SECONDARY: Slate style, loại bỏ opacity thay bằng màu slate-400 */}
          <button 
            onClick={close} 
            className="flex-1 py-2.5 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};