import React, { useEffect } from 'react';
import { useUiStore } from '../../store/ui-store';
import { EntryForm } from './components/entry-form';
import { triggerHaptic } from '../../utils/haptic';
import { db } from '../../database/db';
import { analyze } from '../../utils/nlp-engine';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh v4.1.
 * Giai đoạn 6.19: Sửa lỗi TS2554 bằng cách cung cấp đối số 'context' bắt buộc là 'mind'.
 * Đảm bảo Shadow Sync nhận diện chính xác nguồn dữ liệu để kích hoạt NLP.
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  // BẢO TỒN 100% TRẠNG THÁI TỪ STORE
  const { 
    isInputFocused, 
    setInputFocused, 
    searchQuery, 
    setSearchQuery,
    setActiveTab 
  } = useUiStore();

  /**
   * [KEYBOARD INTELLIGENCE]: Quản lý hành vi bàn phím thông minh.
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // --- TRƯỜNG HỢP 1: TỰ ĐỘNG TẬP TRUNG (AUTO-FOCUS) ---
      if (!isInputFocused) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Escape') return;

        if (e.key.length === 1 || e.key === 'Enter') {
          triggerHaptic('light');
          
          // Chuyển tab và focus với context 'mind' (Today)
          setActiveTab('mind'); 
          setInputFocused(true, 'mind');
          onFocus();
        }
        return;
      }

      // --- TRƯỜNG HỢP 2: PHÍM TẮT LƯU TRỮ (VELOCITY LOOP) ---
      if (isInputFocused) {
        // Ctrl + Enter: Lưu Task
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleQuickSave('task');
        }

        // Ctrl + S: Lưu Mood
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleQuickSave('mood');
        }

        // Escape: Đóng khung nhập liệu
        if (e.key === 'Escape') {
          // Bổ sung context 'mind'
          setInputFocused(false, 'mind');
          onBlur();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInputFocused, searchQuery, onFocus, onBlur, setInputFocused, setActiveTab]);

  /**
   * [QUICK SAVE]: Xử lý lưu dữ liệu tức thì.
   */
  const handleQuickSave = async (type: 'task' | 'mood') => {
    const content = searchQuery.trim();
    if (!content) return;

    triggerHaptic('success');
    const now = Date.now();

    if (type === 'task') {
      const parsed = analyze(content);
      
      await db.tasks.add({
        content: parsed.content || content,
        status: 'todo',
        isFocusMode: false,
        archiveStatus: 'active',
        createdAt: now,
        updatedAt: now,
        targetCount: parsed.quantity || 1,
        unit: parsed.unit || 'mục tiêu',
        tags: parsed.tags,
        completionLog: []
      });
    } else {
      await db.moods.add({
        score: 0,
        label: content,
        createdAt: now
      });
    }

    /**
     * [FIX]: Reset trạng thái với đầy đủ 2 đối số theo yêu cầu của ui-store.ts.
     * Dòng 110: setSearchQuery yêu cầu 'context' để Ninja NLP xử lý.
     */
    setSearchQuery('', 'mind');
    setInputFocused(false, 'mind');
    onBlur();
  };

  return (
    <div className={`w-full transition-all duration-500 px-2`}>
      {!isInputFocused ? (
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            onFocus();
          }}
          className="w-full text-left bg-white border border-slate-200 rounded-[6px] p-4 text-slate-400 text-sm cursor-pointer hover:border-slate-300 transition-all active:scale-[0.98] outline-none shadow-none"
        >
          Ghi lại điều bạn đang nghĩ...
        </button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-none animate-in zoom-in-95 duration-300 pointer-events-auto">
          <EntryForm 
            onSuccess={() => { 
              // Bổ sung context 'mind'
              setInputFocused(false, 'mind'); 
              onBlur(); 
            }}
            onCancel={() => { 
              // Bổ sung context 'mind'
              setInputFocused(false, 'mind'); 
              onBlur(); 
            }}
          />
        </div>
      )}
    </div>
  );
};