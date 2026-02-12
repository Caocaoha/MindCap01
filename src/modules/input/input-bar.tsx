// src/modules/input/input-bar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useUiStore } from '../../store/ui-store';
import { useJourneyStore } from '../../store/journey-store';
import { parseInput } from '../../utils/nlp-engine';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';
import { GestureButton } from './components/gesture-button';

const HEADER_HEIGHT = '3.5rem'; 

export const InputBar: React.FC = () => {
  const { isInputFocused, setInputFocused } = useUiStore();
  const { updateActiveEntry } = useJourneyStore();

  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- [NEW] KEYBOARD INTELLIGENCE START ---
  
  // 1. Global Auto-focus: Bắt phím bất kỳ để mở Input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang focus vào input/textarea khác
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Bỏ qua các phím chức năng (Ctrl, Alt, Meta...)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Bỏ qua nếu có Modal đang mở (Check logic UI store nếu cần)

      // Kích hoạt
      if (e.key.length === 1) { // Chỉ bắt ký tự in được
        setInputFocused(true);
        // Lưu ý: Việc focus() ngay lập tức có thể bị chặn bởi browser policy nếu không từ user event direct
        // Nhưng ở đây ta set state -> render -> effect focus
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setInputFocused]);

  // 2. Shortcuts trong Textarea (Ctrl+S, Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl + Enter: Lưu Task (Normal)
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit('task', 'center'); // 'center' maps to pending/normal
    }
    
    // Ctrl + S: Lưu Mood/Note (Neutral)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSubmit('note', 'left'); // 'left' maps to Neutral/Save
    }

    // Escape: Đóng
    if (e.key === 'Escape') {
      handleDismiss();
    }
  };
  
  // --- KEYBOARD INTELLIGENCE END ---

  const handleFocus = () => {
    setInputFocused(true);
    triggerHaptic('light');
  };

  const handleDismiss = () => {
    if (!text.trim()) {
      setInputFocused(false);
      textareaRef.current?.blur();
    } else {
      setInputFocused(false);
      textareaRef.current?.blur();
    }
  };

  const handleSubmit = async (type: 'task' | 'note', railZone: string) => {
    if (!text.trim()) return;

    const parsed = parseInput(text);
    const now = new Date();

    try {
      if (type === 'task') {
        let status: 'pending' | 'processing' = 'pending';
        let priorityTag = 'normal';

        if (railZone === 'top-right') priorityTag = 'urgent';
        else if (railZone === 'bottom-right') priorityTag = 'critical';
        else if (railZone === 'left') status = 'processing';

        await db.tasks.add({
          title: parsed.cleanText,
          status: status, 
          createdAt: now,
          isFocusMode: false,
          tags: [...parsed.tags, priorityTag],
          // parsed.meta.frequency, parsed.meta.quantity sẽ được dùng nếu schema hỗ trợ mở rộng
        });
        
      } else {
        if (railZone === 'top' || railZone === 'bottom') {
           const moodScore = railZone === 'top' ? 2 : -2; 
           await db.moods.add({
             score: moodScore,
             note: parsed.cleanText,
             createdAt: now
           });
        }

        await db.thoughts.add({
          content: parsed.cleanText,
          type: 'note', 
          createdAt: now,
          keywords: parsed.tags
        });
      }

      triggerHaptic('success');
      setText('');
      updateActiveEntry('');
      handleDismiss();

    } catch (error) {
      console.error('Failed to save entry:', error);
      triggerHaptic('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    updateActiveEntry(newVal);
  };

  return (
    <>
      {isInputFocused && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 touch-none"
          onClick={handleDismiss}
        />
      )}

      <div 
        className={`
          fixed left-0 w-full z-50 transition-all duration-300 ease-out
          bg-white dark:bg-gray-900 shadow-2xl rounded-t-2xl border-t border-gray-200 dark:border-gray-800 overflow-hidden
        `}
        style={{ 
          top: isInputFocused ? HEADER_HEIGHT : 'auto', 
          bottom: isInputFocused ? 'auto' : 0 
        }}
      >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown} // [NEW] Attach Handler
            placeholder="Bạn đang nghĩ gì?..."
            className={`
              w-full bg-transparent text-lg p-4 outline-none resize-none
              placeholder-gray-400 text-gray-800 dark:text-gray-100
              transition-all duration-300
              ${isInputFocused ? 'h-48' : 'h-14'} 
            `}
          />

          {isInputFocused && (
            <div className="relative h-20 w-full bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="absolute left-1/2 -translate-x-1/2 -top-8">
                <GestureButton 
                  label="Task" 
                  type="task" 
                  className="bg-blue-600 hover:bg-blue-500 shadow-blue-500/50"
                  onAction={(zone) => handleSubmit('task', zone)}
                />
              </div>

              <div className="absolute right-6 -top-6">
                 <GestureButton 
                  label="Note" 
                  type="mood" 
                  className="bg-purple-600 w-12 h-12 text-sm hover:bg-purple-500 shadow-purple-500/50"
                  onAction={(zone) => handleSubmit('note', zone)}
                />
              </div>

              <div className="absolute bottom-2 w-full text-center text-xs text-gray-400 pointer-events-none">
                 Kéo nút để phân loại • Ctrl+Enter: Task • Ctrl+S: Note
              </div>
            </div>
          )}
      </div>
    </>
  );
};