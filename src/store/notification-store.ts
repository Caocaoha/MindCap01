/**
 * Purpose: Quản lý trạng thái thông báo toàn cục (Global Notifications).
 * Business Rule: Hỗ trợ thông báo tương tác với hành động đính kèm (onEdit).
 */

import { create } from 'zustand';

interface NotificationState {
  isOpen: boolean;
  message: string;
  onEditAction?: () => void;
  showNotification: (message: string, onEdit?: () => void) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isOpen: false,
  message: '',
  onEditAction: undefined,

  showNotification: (message, onEdit) => set({ 
    isOpen: true, 
    message, 
    onEditAction: onEdit 
  }),

  hideNotification: () => set({ 
    isOpen: false, 
    message: '', 
    onEditAction: undefined 
  }),
}));