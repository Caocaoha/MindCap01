// src/utils/haptic.ts
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
    if (!navigator.vibrate) return;
  
    switch (style) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(20); break;
      case 'heavy': navigator.vibrate(40); break;
      case 'success': navigator.vibrate([10, 30, 10]); break;
    }
  };