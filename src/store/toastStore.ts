import { create } from 'zustand';

interface ToastState {
  message: string | null;
  type: 'success' | 'error' | 'undo';
  visible: boolean;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  visible: false,
  showToast: (msg, type = 'success') => {
    set({ message: msg, type, visible: true });
    // Tự động ẩn sau 3s
    setTimeout(() => set({ visible: false }), 3000);
  },
  hideToast: () => set({ visible: false })
}));