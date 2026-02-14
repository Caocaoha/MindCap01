import React, { useState, useEffect } from 'react';
import { useUiStore } from '../../store/ui-store';
import { triggerHaptic } from '../../utils/haptic';

interface SearchBarProps {
  context: 'saban' | 'mind' | 'journey' | 'setup' | 'identity';
  placeholder?: string;
}

/**
 * [SHARED_UI]: Thanh tìm kiếm hợp nhất với DNA Linear.app.
 * Giai đoạn 4.5: Tích hợp Debounce (300ms) và Scoped Reset.
 * Tối ưu hóa CPU cho iPhone bằng cách giảm tần suất lọc dữ liệu.
 */
export const SearchBar: React.FC<SearchBarProps> = ({ 
  context, 
  placeholder = "Tìm kiếm..." 
}) => {
  const { searchQuery, setSearchQuery } = useUiStore();
  
  // State cục bộ để đảm bảo phản hồi gõ phím tức thì (60fps)
  const [localValue, setLocalValue] = useState(searchQuery);

  /**
   * KỸ THUẬT DEBOUNCE:
   * Chỉ cập nhật Store sau khi người dùng ngừng gõ 300ms.
   * Giúp iPhone không phải chạy logic lọc Dexie liên tục trên mỗi phím nhấn.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localValue, context);
    }, 300);

    return () => clearTimeout(handler);
  }, [localValue, context, setSearchQuery]);

  // Đồng bộ lại localValue nếu Store bị Reset (do Scoped Reset)
  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  return (
    <div className="relative w-full group">
      {/* ICON KÍNH LÚP: Slate-300 chuyên nghiệp */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg 
          width="14" height="14" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" strokeWidth="2.5" 
          className="text-slate-300 group-focus-within:text-[#2563EB] transition-colors"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>

      {/* INPUT: DNA Linear - Nền trắng, Border Slate-200, Bo góc 6px */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          if (e.target.value === '') triggerHaptic('light');
        }}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-[6px] py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/10 transition-all shadow-none"
      />

      {/* NÚT XÓA NHANH: Hiển thị khi có chữ */}
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            triggerHaptic('medium');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
};