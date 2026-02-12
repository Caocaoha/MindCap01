import React, { useState, useRef, useEffect } from 'react';
import { useJourneyStore } from '../../store/journey-store'; // [STATE]
import { db } from '../../database/db'; // [CORE]
import type { ITask } from '../../database/types';

export const InputBar: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Lấy action từ Store
  const addEntryToStore = useJourneyStore((state) => state.addEntry);

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
    
    // [VELOCITY LOOP - PHASE 1]: Ingestion
    // Tạo object dữ liệu ban đầu
    const newEntry: ITask = {
      // id: để Dexie tự sinh (auto-increment)
      title: rawText,
      status: 'pending', // Trạng thái chờ xử lý NLP
      createdAt: new Date(),
      isFocusMode: false,
      tags: [], // Sẽ được Shadow Lane điền sau
    };

    try {
      // [VELOCITY LOOP - PHASE 2]: Shadow Sync (Fast Lane)
      // 1. Ghi vào DB (Source of Truth)
      const id = await db.tasks.add(newEntry);
      
      // 2. Cập nhật Store (Optimistic UI) để hiển thị ngay lập tức
      // Gán ID vừa sinh ra từ DB để Store đồng bộ
      addEntryToStore({ ...newEntry, id });

      // Reset UI
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      console.log(`[Input] 🚀 Fast Lane: Entry ${id} created. Waiting for Shadow Lane...`);
      
    } catch (error) {
      console.error("Failed to add entry:", error);
      alert("Lỗi: Không thể lưu dữ liệu. Vui lòng kiểm tra lại.");
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
    <div className="w-full max-w-2xl mx-auto p-4 fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập task, ý tưởng, hoặc cảm xúc... (Enter để gửi)"
          className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none min-h-[56px] max-h-[200px] shadow-sm transition-all"
          disabled={isSubmitting}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
            content.trim() 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {/* Icon Send đơn giản */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-2 text-center">
        Mind Cap v0.1 • Local-First • Zero-Network
      </div>
    </div>
  );
};