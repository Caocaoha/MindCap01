// src/components/system/SystemGuard.tsx
import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// [SAFEGUARD]: Ngưỡng cảnh báo (3 ngày = 259200000 ms)
const MAX_OFFLINE_TIME = 259200000; 

export const SystemGuard: React.FC = () => {
  const [isOfflineRisk, setIsOfflineRisk] = useState(false);
  
  // 1. Update Mechanism Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW Registration error', error);
    },
  });

  // 2. Offline Safeguard Logic
  useEffect(() => {
    const checkVitality = () => {
      const lastOnline = Number(localStorage.getItem('mc_last_online') || Date.now());
      const now = Date.now();
      
      if (navigator.onLine) {
        localStorage.setItem('mc_last_online', now.toString());
        setIsOfflineRisk(false);
      } else {
        // Nếu offline quá lâu
        if (now - lastOnline > MAX_OFFLINE_TIME) {
          setIsOfflineRisk(true);
        }
      }
    };

    window.addEventListener('online', checkVitality);
    window.addEventListener('offline', checkVitality);
    const interval = setInterval(checkVitality, 3600000); // Check mỗi giờ

    return () => {
      window.removeEventListener('online', checkVitality);
      window.removeEventListener('offline', checkVitality);
      clearInterval(interval);
    };
  }, []);

  if (isOfflineRisk) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600 text-white p-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">⚠️ DỮ LIỆU GẶP NGUY HIỂM</h1>
          <p className="text-xl">Đã 3 ngày bạn chưa kết nối mạng.</p>
          <p className="mb-8">iOS có thể xóa dữ liệu của bạn vĩnh viễn. Vui lòng bật mạng ngay lập tức để gia hạn "sự sống".</p>
        </div>
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-4 rounded shadow-lg flex gap-4 items-center">
        <span>Có bản cập nhật mới.</span>
        <button 
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1 bg-blue-600 rounded font-bold"
        >
          Làm mới
        </button>
      </div>
    );
  }

  return null; // Hệ thống ổn định
};