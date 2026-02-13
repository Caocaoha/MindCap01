import { create } from 'zustand';
import { ITask, IThought } from '../database/types';

// Định nghĩa các phân vùng tab chính trong Project Structure
type ActiveTab = 'saban' | 'mind' | 'journey' | 'setup' | 'identity';

interface UiState {
  // --- States từ User (BẢO TỒN 100%) ---
  isSidebarOpen: boolean;
  isFocusModeActive: boolean;
  isTyping: boolean;
  isInputFocused: boolean; 

  // --- States điều phối Tab ---
  activeTab: ActiveTab;

  // --- [NEW] States cho Universal Edit Modal ---]
  isModalOpen: boolean;
  editingEntry: ITask | IThought | null;

  // --- Actions từ User (BẢO TỒN 100%) ---
  toggleSidebar: () => void;
  setFocusMode: (isActive: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setInputFocused: (isFocused: boolean) => void;

  // --- Actions điều phối Tab ---
  setActiveTab: (tab: ActiveTab) => void;

  // --- [NEW] Actions cho Universal Edit Modal ---]
  openEditModal: (entry: ITask | IThought) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  // Khởi tạo giá trị mặc định (BẢO TỒN 100%)
  isSidebarOpen: false,
  isFocusModeActive: false,
  isTyping: false,
  isInputFocused: false,
  activeTab: 'mind',

  // Khởi tạo trạng thái mới cho Modal
  isModalOpen: false,
  editingEntry: null,

  // Triển khai Actions bảo tồn logic của User
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setFocusMode: (isActive) => set({ isFocusModeActive: isActive }),
  setTyping: (isTyping) => set({ isTyping }),
  setInputFocused: (isFocused) => set({ isInputFocused: isFocused }),

  // Triển khai Action điều hướng
  setActiveTab: (tab) => set({ 
    activeTab: tab, 
    isTyping: false, 
    isInputFocused: false 
  }),

  // Triển khai Actions mới cho Edit Modal]
  openEditModal: (entry) => set({ isModalOpen: true, editingEntry: entry }),
  closeModal: () => set({ isModalOpen: false, editingEntry: null }),
}));