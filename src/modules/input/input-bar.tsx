import React, { useEffect, useState, useRef } from 'react';
import { useUiStore } from '../../store/ui-store';
import { useNotificationStore } from '../../store/notification-store'; // [NEW]: Kêt nối Notification Store
import { triggerHaptic } from '../../utils/haptic';
import { db } from '../../database/db';
import { analyze } from '../../utils/nlp-engine';
import { GestureButton } from './components/gesture-button';
import { EntryService } from '../../services/entry-service'; // [NEW]: Kết nối tổng kho điều phối

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh v5.8 - Unified Service Integration.
 * Giai đoạn 6.39: 
 * 1. [UI Update]: Đổi màu nền sang slate-50 và thêm viền bao quanh để nổi bật trên nền Today.
 * 2. [Centralized]: Ủy quyền lưu trữ hoàn toàn cho EntryService để kích hoạt Spark & Saban Routing.
 * 3. [Logic]: Giữ nguyên 100% logic xử lý cũ để bảo tồn tính ổn định.
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  // --- STORE CONNECTIONS ---
  const { 
    isInputFocused, 
    setInputFocused, 
    setTyping, 
    setParsedData,
    setActiveTab,
    openEditModal // [NEW]: Để truyền vào callback của thông báo
  } = useUiStore();

  const { showNotification } = useNotificationStore(); // [NEW]: Để hiện Toast chính giữa

  // --- LOCAL STATE ---
  const [content, setContent] = useState('');
  const [activeKnob, setActiveKnob] = useState<'task' | 'thought' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * [RESET]: Đưa giao diện về trạng thái ban đầu.
   */
  const resetInput = () => {
    setContent('');
    setTyping(false);
    setInputFocused(false, 'mind'); 
    setActiveKnob(null);
    setParsedData(null);
    onBlur();
    textareaRef.current?.blur();
  };

  /**
   * [ACTION]: Xử lý lưu dữ liệu thông qua EntryService
   */
  const handleSave = async (data: any) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      triggerHaptic('error');
      return;
    }

    const nlpResult = analyze(trimmedContent);

    try {
      let payload: any;
      const type = data.type; // 'task' hoặc 'thought'

      if (type === 'task') {
        const gestureTags = data.tags || [];
        const finalTags = [...new Set([...(nlpResult.tags || []), ...gestureTags])];
        
        // Chuẩn bị dữ liệu Task tối giản cho Service xử lý tiếp
        payload = {
          content: nlpResult.content || trimmedContent,
          status: 'todo',
          archiveStatus: 'active',
          targetCount: nlpResult.quantity || 1,
          unit: nlpResult.unit || 'lần',
          tags: finalTags,
          completionLog: [],
          sourceTable: 'tasks'
        };
      } else {
        // Chuẩn bị dữ liệu Thought tối giản
        payload = {
          content: trimmedContent,
          type: 'thought', 
          mood: data.moodScore || 3, 
          isBookmarked: false,
          tags: nlpResult.tags || [],
          wordCount: trimmedContent.split(/\s+/).length,
          recordStatus: 'success',
          archiveStatus: 'active',
          sourceTable: 'thoughts'
        };
      }

      // [UNIFIED CALL]: Gọi Service duy nhất để xử lý Smart Routing và Spark Waterfall
      const result = await EntryService.saveEntry(payload, type);

      if (result.success) {
        // Hiển thị thông báo phản hồi từ kết quả điều hướng của Service
        showNotification(result.message, () => openEditModal(result.record));
        
        triggerHaptic('success');
        resetInput();
      }
    } catch (error) {
      console.error('Fast-lane save failed:', error);
      triggerHaptic('error');
    }
  };

  /**
   * [KEYBOARD INTELLIGENCE]
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isInputFocused) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Escape') return;

        if (e.key.length === 1 || e.key === 'Enter') {
          triggerHaptic('light');
          setActiveTab('mind'); 
          setInputFocused(true, 'mind');
          onFocus();
          setTimeout(() => textareaRef.current?.focus(), 50);
        }
        return;
      }

      if (isInputFocused) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSave({ type: 'task', tags: [] });
        }
        if (e.key === 'Escape') {
          resetInput();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInputFocused, content, onFocus, onBlur, setInputFocused, setActiveTab]);

  useEffect(() => {
    if (isInputFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isInputFocused]);

  return (
    <div 
      className={`relative w-full h-full transition-all duration-500 ease-out bg-slate-50 backdrop-blur-xl border border-slate-300/60 flex flex-col ${
        isInputFocused 
          ? 'items-start pt-6 rounded-t-none pb-safe border-x-0 border-b-0 border-t-slate-200' 
          : 'pb-2 rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' 
      }`}
    >
      {/* --- LAYER 1: TEXTAREA --- */}
      <div className={`relative px-6 w-full transition-all duration-500 ${isInputFocused ? 'h-[60%]' : 'h-auto'}`}>
        {!isInputFocused ? (
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              triggerHaptic('light');
              setInputFocused(true, 'mind');
              onFocus();
            }}
            className="w-full text-left bg-transparent p-3 text-slate-400 text-sm cursor-pointer outline-none"
          >
            Ghi lại điều bạn đang nghĩ...
          </button>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setTyping(e.target.value.length > 0);
              }}
              placeholder="Đang suy nghĩ gì..."
              className="w-full h-full bg-transparent resize-none outline-none text-slate-800 placeholder:text-slate-300 font-medium leading-relaxed text-xl animate-in fade-in duration-300"
            />
            
            <button 
              onClick={resetInput}
              className="absolute top-[-10px] right-0 p-4 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* --- LAYER 2: CONTROL DECK (Split Layout + Anti-Scroll Zone) --- */}
      <div 
        className={`relative w-full h-[40%] mt-auto transition-all duration-500 transform touch-none ${
          isInputFocused && content.length > 0 
            ? 'opacity-100 translate-y-0 pb-safe' 
            : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
        // [FIX]: Chèn kiểm tra cancelable để tránh lỗi passive event listener
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault();
        }}
      >
        {/* Nút TASK: Căn giữa nửa trái (25%) */}
        <div 
            className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center touch-none"
            onTouchStart={(e) => e.stopPropagation()}
        >
          <GestureButton
            type="task"
            label="Task"
            isDimmed={activeKnob === 'thought'} 
            onInteractionStart={() => setActiveKnob('task')}
            onInteractionEnd={() => setActiveKnob(null)}
            onSelect={handleSave}
          />
        </div>

        {/* Nút THOUGHT: Căn giữa nửa phải (75%) */}
        <div 
            className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center touch-none"
            onTouchStart={(e) => e.stopPropagation()}
        >
          <GestureButton
            type="thought"
            label="Thought"
            isDimmed={activeKnob === 'task'} 
            onInteractionStart={() => setActiveKnob('thought')}
            onInteractionEnd={() => setActiveKnob(null)}
            onSelect={handleSave}
          />
        </div>
      </div>

      {/* --- LAYER 3: HINT --- */}
      {isInputFocused && content.length > 0 && !activeKnob && (
        <div className="absolute bottom-24 left-0 right-0 text-center animate-pulse pointer-events-none pb-safe">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Kéo để phân loại
          </p>
        </div>
      )}
    </div>
  );
};