import { create } from 'zustand';

export interface JourneyState {
  viewMode: 'stats' | 'diary';
  searchQuery: string;
  setViewMode: (mode: 'stats' | 'diary') => void;
  setSearchQuery: (query: string) => void;
  calculateOpacity: (lastUpdate: number, isBookmarked?: boolean) => number;
  isDiaryEntry: (item: any) => boolean;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  viewMode: 'stats',
  searchQuery: '',

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  /**
   * Tính toán độ mờ (Entropy)
   * Công thức: $$Opacity = 1 - \left( \frac{\text{DaysSinceLastUpdate}}{40} \right)$$
   */
  calculateOpacity: (lastUpdate, isBookmarked) => {
    if (isBookmarked) return 1; // Hạt giống không tan rã
    const diffDays = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (diffDays / 40);
    return Math.max(0, Math.min(1, opacity));
  },

  /**
   * Logic lọc dữ liệu để không trùng lặp với Sa bàn
   */
  isDiaryEntry: (item) => {
    // Điều kiện loại trừ: status 'active' và không nằm trong tiêu điểm
    if (item.status === 'active' && !item.isFocusMode) {
      return false;
    }
    return true;
  }
}));