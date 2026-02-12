import React, { useState, useRef, useEffect } from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { useUiStore } from '../../store/ui-store'; // [NEW]
import { db } from '../../database/db';
import type { ITask } from '../../database/types';

export const InputBar: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const addEntryToStore = useJourneyStore((state) => state.addEntry);
  const { setInputMode } = useUiStore(); // [NEW]

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const rawText = content.trim();
    
    // Tạo object dữ liệu
    const newEntry: ITask = {
      title: rawText,
      status: 'pending',
      createdAt: new Date(),
      isFocusMode: false,
      frequency: 'ONCE',
      tags: [],
      streakCurrent: 0,
      streakRecoveryCount: 0
    };

    try {
      const id = await db.tasks.add(newEntry);
      addEntryToStore({ ...newEntry, id });
      
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      // [OPTIONAL] Sau khi submit có thể giữ focus hoặc blur tùy trải nghiệm
      // Ở đây ta blur để trả lại giao diện bình thường
      textareaRef.current?.blur();
      
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="relative shadow-lg rounded-xl bg-white border border-indigo-100">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          // [NEW] Logic Step-by-step Disclosure
          onFocus={() => setInputMode(true)}
          onBlur={() => {
            // Delay nhỏ để tránh flicker nếu user click nút gửi (mất focus)
            setTimeout(() => setInputMode(false), 200);
          }}
          placeholder="Bạn đang nghĩ gì? (Nhập task, idea...)"
          className="w-full p-4 pr-12 rounded-xl focus:outline-none resize-none min-h-[56px] max-h-[150px] bg-transparent text-gray-700 placeholder:text-gray-400"
          disabled={isSubmitting}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
            content.trim() 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 scale-100' 
              : 'bg-transparent text-gray-300 scale-90'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};