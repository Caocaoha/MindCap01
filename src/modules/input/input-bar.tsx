import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';
import { ITask, IThought } from '../../database/types';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Task States
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);

  // Thought State
  const [moodScore, setMoodScore] = useState(0); // -2 to 2

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Tín hiệu bàn phím: Tự động focus và xử lý Ctrl+S
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Tự động focus khi bắt đầu gõ (nếu không đang gõ ở đâu khác)
      if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        if (e.key.length === 1 || e.key === 'Enter') {
          textareaRef.current?.focus();
        }
      }

      // Phím tắt Lưu: Ctrl+S (Win) hoặc Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [content, entryType, moodScore, isUrgent, isImportant]);

  const handleSave = async () => {
    if (!content.trim()) return;

    const now = Date.now();
    if (entryType === 'task') {
      const newTask: ITask = {
        content,
        status: 'todo',
        createdAt: now,
        updatedAt: now,
        isFocusMode: false,
        tags: [
          `freq:${freq}`,
          isUrgent ? 'p:urgent' : '',
          isImportant ? 'p:important' : '',
          ...selectedDays.map(d => `d:${d}`)
        ].filter(Boolean)
      };
      await db.tasks.add(newTask);
    } else {
      const newThought: IThought = {
        content,
        type: 'thought',
        wordCount: content.split(/\s+/).length,
        createdAt: now,
        recordStatus: 'success'
      };
      await db.thoughts.add(newThought);
      // Lưu mood đi kèm vào bảng moods
      await db.moods.add({ score: moodScore, label: 'thought-entry', createdAt: now });
    }

    // Reset Form
    setContent('');
    triggerHaptic('success');
    textareaRef.current?.blur();
  };

  return (
    <div className={`transition-all duration-300 ${isFocused ? 'shadow-[0_0_30px_rgba(59,130,246,0.2)]' : ''}`}>
      
      {/* TOGGLE SELECTOR */}
      <div className="flex gap-4 mb-4">
        {['task', 'thought'].map((t) => (
          <button
            key={t}
            onClick={() => setEntryType(t as any)}
            className={`text-[10px] font-black tracking-[0.2em] uppercase py-1 px-3 rounded-full border transition-all ${
              entryType === t ? 'border-blue-500 text-blue-500' : 'border-white/10 opacity-40'
            }`}
          >
            {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
          </button>
        ))}
      </div>

      {/* TEXTAREA INPUT */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => { setIsFocused(true); onFocus(); }}
        onBlur={() => { setIsFocused(false); onBlur(); }}
        placeholder={entryType === 'task' ? "Bạn cần thực thi điều gì?" : "Bạn đang cảm thấy thế nào?"}
        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-lg focus:outline-none focus:border-blue-500/50 min-h-[120px] transition-all resize-none"
      />

      {/* OPTIONS PANEL (Only show when focused) */}
      <div className={`mt-4 space-y-4 overflow-hidden transition-all duration-500 ${isFocused ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        
        {entryType === 'task' ? (
          <div className="space-y-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
            {/* Tần suất */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'once', label: '1 Lần' },
                { id: 'weekly', label: 'Hàng Tuần' },
                { id: 'days-week', label: 'Thứ trong tuần' },
                { id: 'days-month', label: 'Ngày trong tháng' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFreq(f.id as any)}
                  className={`text-[9px] px-2 py-1 rounded border ${freq === f.id ? 'bg-white text-black' : 'border-white/10 opacity-50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Matrix Eisenhower */}
            <div className="flex gap-4">
              <button 
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/5 opacity-30'}`}
              >
                KHẨN CẤP
              </button>
              <button 
                onClick={() => setIsImportant(!isImportant)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${isImportant ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-white/5 opacity-30'}`}
              >
                QUAN TRỌNG
              </button>
            </div>
          </div>
        ) : (
          /* Emotion Scale cho Thought */
          <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
            {[-2, -1, 0, 1, 2].map((score) => (
              <button
                key={score}
                onClick={() => setMoodScore(score)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  moodScore === score ? 'bg-blue-500 scale-125' : 'bg-zinc-800 opacity-40'
                }`}
              >
                {score === -2 && '😠'}
                {score === -1 && '🙁'}
                {score === 0 && '😐'}
                {score === 1 && '😊'}
                {score === 2 && '🥰'}
              </button>
            ))}
          </div>
        )}

        <p className="text-[9px] opacity-20 text-center uppercase tracking-widest">Nhấn Ctrl + S để lưu nhanh</p>
      </div>
    </div>
  );
};