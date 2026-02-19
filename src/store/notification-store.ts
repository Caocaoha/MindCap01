/**
 * Purpose: Quản lý trạng thái thông báo toàn cục (Global Notifications) (v1.1).
 * Business Rule: 
 * - Hỗ trợ thông báo tương tác với hành động đính kèm (onEdit).
 * - [NEW]: Tích hợp định danh 'type' để UI tự động thay đổi Theme (Emerald cho Forgiveness).
 */

import { create } from 'zustand';

// Định nghĩa các loại thông báo để UI xử lý hiển thị tương ứng
type NotificationType = 'default' | 'forgiveness';

interface NotificationState {
  isOpen: boolean;
  message: string;
  type: NotificationType; // [NEW]: Lưu trữ loại thông báo
  onEditAction?: () => void;
  showNotification: (message: string, onEdit?: () => void, type?: NotificationType) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isOpen: false,
  message: '',
  type: 'default', // Mặc định là indigo theme
  onEditAction: undefined,

  /**
   * Hiển thị thông báo.
   * @param type - Truyền 'forgiveness' để kích hoạt giao diện xanh lục bảo.
   */
  showNotification: (message, onEdit, type = 'default') => set({ 
    isOpen: true, 
    message, 
    onEditAction: onEdit,
    type: type // Cập nhật loại thông báo để GlobalToast nhận diện
  }),

  hideNotification: () => set({ 
    isOpen: false, 
    message: '', 
    type: 'default',
    onEditAction: undefined 
  }),
}));