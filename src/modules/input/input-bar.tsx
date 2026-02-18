import React, { useEffect, useState, useRef } from 'react';
import { useUiStore } from '../../store/ui-store';
import { triggerHaptic } from '../../utils/haptic';
import { db } from '../../database/db';
import { analyze } from '../../utils/nlp-engine';
import { GestureButton } from './components/gesture-button';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh v5.4 - Todo-First Policy.
 * Giai đoạn 6.35: 
 * 1. [Logic]: Loại bỏ tự động Focus. Mọi task mới đều vào Inbox (Todo).
 * 2. [Layout]: Nút Task căn giữa, Nút Thought căn phải.
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  // --- STORE CONNECTIONS ---
  const { 
    isInputFocused, 
    setInputFocused, 
    setTyping, 
    setParsedData,
    setActiveTab 
  } = useUiStore();

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
   * [ACTION]: Xử lý lưu dữ liệu (Todo-First).
   */
  const handleSave = async (data: any) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      triggerHaptic('error');
      return;
    }

    const now = Date.now();
    const nlpResult = analyze(trimmedContent);

    try {
      if (data.type === 'task') {
        const gestureTags = data.tags || [];
        const finalTags = [...new Set([...(nlpResult.tags || []), ...gestureTags])];
        
        // [LOGIC MỚI]: Luôn luôn vào Todo (Inbox), không bao giờ tự động vào Focus.
        // Dù có tag Urgent hay không, quyền quyết định Focus thuộc về người dùng tại Saban Board.
        const shouldEnterFocus = false; 

        await db.tasks.add({
          content: nlpResult.content || trimmedContent,
          status: 'todo',
          isFocusMode: shouldEnterFocus, 
          archiveStatus: 'active',
          createdAt: now,
          updatedAt: now,
          targetCount: nlpResult.quantity || 1,
          unit: nlpResult.unit || 'lần',
          tags: finalTags,
          completionLog: []
        });
      } else {
        await db.thoughts.add({
          content: trimmedContent,
          type: 'thought', 
          mood: data.moodScore || 3, 
          createdAt: now,
          isBookmarked: false,
          tags: nlpResult.tags || [],
          wordCount: trimmedContent.split(/\s+/).length,
          recordStatus: 'success',
          archiveStatus: 'active'
        });
      }

      triggerHaptic('success');
      resetInput();
    } catch (error) {
      console.error('Save failed:', error);
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
      className={`relative w-full h-full transition-all duration-500 ease-out bg-white/95 backdrop-blur-xl border-t border-slate-200 ${
        isInputFocused 
          ? 'items-start pt-6 rounded-t-none pb-safe' 
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

      {/* --- LAYER 2: CONTROL DECK (Bố cục Anchor Layout) --- */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[40%] w-full transition-all duration-500 transform ${
          isInputFocused && content.length > 0 
            ? 'opacity-100 translate-y-0 pb-safe' 
            : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
      >
        {/* Nút TASK: Căn giữa tuyệt đối */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GestureButton
            type="task"
            label="Task"
            isDimmed={activeKnob === 'thought'} 
            onInteractionStart={() => setActiveKnob('task')}
            onInteractionEnd={() => setActiveKnob(null)}
            onSelect={handleSave}
          />
        </div>

        {/* Nút THOUGHT: Căn phải (cách lề 24px) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
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