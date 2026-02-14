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

  // --- [NEW] States cho Universal Edit Modal ---
  isModalOpen: boolean;
  editingEntry: ITask | IThought | null;

  // --- [NEW PHASE 4.5]: States cho Unified Search & Scoped Reset ---
  searchQuery: string;
  searchContext: ActiveTab | null;

  // --- Actions từ User (BẢO TỒN 100%) ---
  toggleSidebar: () => void;
  setFocusMode: (isActive: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setInputFocused: (isFocused: boolean) => void;

  // --- Actions điều phối Tab ---
  setActiveTab: (tab: ActiveTab) => void;

  // --- [NEW] Actions cho Universal Edit Modal ---
  openEditModal: (entry: ITask | IThought) => void;
  openCreateModal: () => void; // [ADD]: Action mở modal tạo mới để fix lỗi InputBar
  closeModal: () => void;

  // --- [NEW PHASE 4.5]: Actions cho Unified Search ---
  setSearchQuery: (query: string, context: ActiveTab) => void;
  clearSearch: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  // Khởi tạo giá trị mặc định (BẢO TỒN 100%)
  isSidebarOpen: false,
  isFocusModeActive: false,
  isTyping: false,
  isInputFocused: false,
  activeTab: 'mind',

  // Khởi tạo trạng thái cho Modal
  isModalOpen: false,
  editingEntry: null,

  // [NEW PHASE 4.5]: Khởi tạo trạng thái tìm kiếm
  searchQuery: '',
  searchContext: null,

  // Triển khai Actions bảo tồn logic của User
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setFocusMode: (isActive) => set({ isFocusModeActive: isActive }),
  setTyping: (isTyping) => set({ isTyping }),
  setInputFocused: (isFocused) => set({ isInputFocused: isFocused }),

  /**
   * Triển khai Action điều hướng Tab
   * Tích hợp kỹ thuật Scoped Reset: Tự động xóa tìm kiếm nếu chuyển sang Tab khác ngữ cảnh.
   */
  setActiveTab: (tab) => set((state) => ({ 
    activeTab: tab, 
    isTyping: false, 
    isInputFocused: false,
    // [FIX]: Nếu tab mới khác với ngữ cảnh đang tìm kiếm, thực hiện Reset Scoped
    searchQuery: state.searchContext !== tab ? '' : state.searchQuery,
    searchContext: state.searchContext !== tab ? null : state.searchContext
  })),

  // Triển khai Actions mới cho Edit Modal
  openEditModal: (entry) => set({ isModalOpen: true, editingEntry: entry }),
  
  // [ADD]: Triển khai action mở modal tạo mới (editingEntry = null)
  openCreateModal: () => set({ isModalOpen: true, editingEntry: null }),
  
  closeModal: () => set({ isModalOpen: false, editingEntry: null }),

  /**
   * [NEW PHASE 4.5]: Triển khai hệ thống tìm kiếm hợp nhất
   * Gắn chặt Query với Context để phục vụ logic lọc chính xác.
   */
  setSearchQuery: (query, context) => set({ 
    searchQuery: query, 
    searchContext: context 
  }),

  clearSearch: () => set({ 
    searchQuery: '', 
    searchContext: null 
  }),
}));