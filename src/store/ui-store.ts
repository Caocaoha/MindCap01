/**
 * Purpose: Quản lý trạng thái giao diện hợp nhất (Unified UI State) và điều hướng Tab.
 * Inputs/Outputs: Cung cấp trạng thái (state) và các hành động (actions) điều khiển UI toàn cục.
 * Business Rule: 
 * - Hỗ trợ phân vùng tab chính bao gồm cả hệ thống duyệt đồng bộ Obsidian (sync-review).
 * - Tích hợp Middleware nlpListener để xử lý ngôn ngữ tự nhiên từ thanh nhập liệu.
 * - Thực hiện Scoped Reset dữ liệu khi chuyển đổi ngữ cảnh giữa các Tab.
 * - [NEW]: Cung cấp nguồn sự thật duy nhất cho số lượng bản ghi sẵn sàng đồng bộ Obsidian.
 */

import { create } from 'zustand';
import { ITask, IThought } from '../database/types';
// [NEW]: Import Middleware nlpListener để kích hoạt bộ não xử lý ngôn ngữ
import { nlpListener } from './middleware/nlp-listener';

/**
 * [STATE]: Quản lý trạng thái giao diện hợp nhất (v4.9).
 * [FIX]: Bổ sung 'sync-review' để hỗ trợ hệ thống đồng bộ Obsidian.
 */
export type ActiveTab = 'saban' | 'mind' | 'journey' | 'setup' | 'identity' | 'sync-review';

interface UiState {
  // --- States từ User (BẢO TỒN 100%) ---
  isSidebarOpen: boolean;
  isFocusModeActive: boolean;
  isTyping: boolean;
  isInputFocused: boolean; 

  // --- States điều phối Tab ---
  activeTab: ActiveTab;

  // --- [NEW] States cho Universal Edit Modal ---
  // Quản lý trạng thái hiển thị của Modal Sửa/Tạo mới
  isModalOpen: boolean;
  editingEntry: ITask | IThought | null;

  // --- [NEW PHASE 4.5]: States cho Unified Search & Scoped Reset ---
  searchQuery: string;
  searchContext: ActiveTab | null;

  // --- [NEW]: States cho NLP Parser Auto-fill ---
  // Lưu trữ dữ liệu định lượng bóc tách được để tự động điền vào Form nhập liệu.
  parsedQuantity: number | null;
  parsedUnit: string | null;
  parsedFrequency: string | null;

  // --- [NEW]: States cho Obsidian Sync ---
  // Lưu trữ số lượng bản ghi đã được duyệt (ready_to_export) để đồng bộ hiển thị.
  readyCount: number;

  // --- Actions từ User (BẢO TỒN 100%) ---
  toggleSidebar: () => void;
  setFocusMode: (isActive: boolean) => void;
  setTyping: (isTyping: boolean) => void;

  /**
   * [FIX]: Chuẩn hóa Interface để nhận diện Context.
   * Thêm dấu '?' để biến context thành tham số tùy chọn, giải quyết lỗi TS2554.
   */
  setInputFocused: (isFocused: boolean, context?: ActiveTab) => void;

  // --- Actions điều phối Tab ---
  setActiveTab: (tab: ActiveTab) => void;

  // --- [NEW] Actions cho Universal Edit Modal ---
  // Mở modal để sửa một entry cụ thể (Task hoặc Thought)
  openEditModal: (entry: ITask | IThought) => void;
  // Mở modal để tạo mới (editingEntry = null)
  openCreateModal: () => void; 
  // Đóng modal và reset data
  closeModal: () => void;

  /**
   * [FIX]: Chuẩn hóa Interface cho Unified Search.
   * Chuyển context thành tùy chọn để tương thích với các lệnh gọi xóa query nhanh.
   */
  setSearchQuery: (query: string, context?: ActiveTab) => void;
  clearSearch: () => void;

  // --- [NEW]: Action cập nhật dữ liệu NLP bóc tách ---
  // Nhận dữ liệu từ Ninja NLP Listener để cập nhật vào Form.
  setParsedData: (data: { quantity?: number; unit?: string; frequency?: string } | null) => void;

  // --- [NEW]: Action cập nhật số lượng chờ Sync ---
  setReadyCount: (count: number) => void;
}



/**
 * [CORE STORE]: Kích hoạt nlpListener middleware.
 * [FIX FINAL]: Bọc nlpListener quanh hàm khởi tạo state.
 */
export const useUiStore = create<UiState>(
  nlpListener((set) => ({
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

    // [NEW]: Khởi tạo mặc định cho dữ liệu NLP
    parsedQuantity: null,
    parsedUnit: null,
    parsedFrequency: null,

    // [NEW]: Khởi tạo mặc định cho Obsidian Sync
    readyCount: 0,

    // Tri triển khai Actions bảo tồn logic của User
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setFocusMode: (isActive) => set({ isFocusModeActive: isActive }),
    setTyping: (isTyping) => set({ isTyping }),

    /**
     * Triển khai setInputFocused với khả năng lưu trữ ngữ cảnh.
     * Nếu context được cung cấp, nó sẽ cập nhật searchContext để Ninja NLP nhận diện.
     */
    setInputFocused: (isFocused, context) => set((state) => ({ 
      isInputFocused: isFocused,
      searchContext: context ? context : state.searchContext
    })),

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
      searchContext: state.searchContext !== tab ? null : state.searchContext,
      // Reset dữ liệu NLP khi chuyển tab để tránh nhầm lẫn dữ liệu
      parsedQuantity: null,
      parsedUnit: null,
      parsedFrequency: null
    })),

    // Triển khai Actions mới cho Edit Modal
    openEditModal: (entry) => set({ isModalOpen: true, editingEntry: entry }),
    
    // [ADD]: Triển khai action mở modal tạo mới (editingEntry = null)
    openCreateModal: () => set({ isModalOpen: true, editingEntry: null }),
    
    closeModal: () => set({ isModalOpen: false, editingEntry: null }),

    /**
     * [NEW PHASE 4.5]: Triển khai hệ thống tìm kiếm hợp nhất.
     * Cho phép cập nhật Query có hoặc không có Context (mặc định giữ nguyên context cũ nếu không truyền).
     */
    setSearchQuery: (query, context) => set((state) => ({ 
      searchQuery: query, 
      searchContext: context ? context : state.searchContext 
    })),

    clearSearch: () => set({ 
      searchQuery: '', 
      searchContext: null,
      // Reset dữ liệu NLP khi xóa tìm kiếm
      parsedQuantity: null,
      parsedUnit: null,
      parsedFrequency: null
    }),

    // [NEW]: Triển khai cập nhật dữ liệu từ kết quả bóc tách NLP
    setParsedData: (data) => set({
      parsedQuantity: data?.quantity ?? null,
      parsedUnit: data?.unit ?? null,
      parsedFrequency: data?.frequency ?? null
    }),

    // [NEW]: Triển khai cập nhật số lượng chờ Sync Obsidian
    setReadyCount: (count) => set({ readyCount: count }),
  }), 'ui-store')
);