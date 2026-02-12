export const triggerHaptic = (level: 'light' | 'medium' | 'heavy') => {
  if (!window.navigator.vibrate) return;
  
  switch (level) {
    case 'light': window.navigator.vibrate(10); break;
    case 'medium': window.navigator.vibrate(20); break;
    case 'heavy': window.navigator.vibrate([10, 30, 10]); break;
  }
};