import React from 'react';
import { useIdentityStore } from '../identity-store';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [MOD_IDENTITY]: SunCompass Component
 * Biểu tượng trung tâm điều khiển luồng tự vấn và hiển thị trạng thái Identity.
 */
export const SunCompass = ({ status }: { status: string }) => {
  const { openAudit, checkCooldown, progress } = useIdentityStore();

  /**
   * Xác định style dựa trên trạng thái của Identity
   */
  const getStatusClass = () => {
    switch (status) {
      case 'paused': 
        return 'animate-pulse text-orange-400'; 
      case 'cooldown': 
        return 'opacity-40 grayscale animate-spin-slow'; 
      case 'enlightened': 
        return 'drop-shadow-[0_0_12px_rgba(255,165,0,0.9)] text-yellow-500'; 
      default: 
        return 'text-white/20 hover:text-orange-300'; 
    }
  };

  /**
   * Xử lý tương tác: Kiểm tra Cooldown 15 phút trước khi mở
   */
  const handleAction = () => {
    if (checkCooldown()) {
      triggerHaptic('warning'); // Phản hồi rung cảnh báo
      
      const remainingMs = (progress.cooldownEndsAt || 0) - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      
      alert(`Axit đang ngấm. Tâm trí cần nghỉ ngơi. Quay lại sau ${remainingMins} phút.`);
      return;
    }

    triggerHaptic('light');
    openAudit();
  };

  return (
    <button 
      onClick={handleAction} 
      className={`transition-all duration-700 outline-none ${getStatusClass()}`}
      title={status === 'cooldown' ? 'Đang trong thời gian nghỉ' : 'Bắt đầu tự vấn'}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </button>
  );
};