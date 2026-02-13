import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { ITask, IThought } from '../../../database/types';

interface EntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * [MOD_INPUT]: Form nhập liệu đa năng hỗ trợ Task (Tần suất, Eisenhower) 
 * và Thought (Mood Tracking). [cite: 18, 34-41]
 */
export const EntryForm: React.FC<EntryFormProps> = ({ onSuccess, onCancel }) => {
  const { setInputFocused } = useUiStore();
  
  // --- States Chung ---
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  
  // --- States cho TASK --- [cite: 35-37]
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); // 1-7 (Thứ 2 - CN)
  
  // --- States cho THOUGHT --- [cite: 39-41]
  const [moodLevel, setMoodLevel] = useState<number>(3); // 1-5 (Rất khó chịu -> Rất vui)

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động focus vào textarea khi mở form 
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Logic Lưu trữ vào IndexedDB [cite: 3, 19]
   */
  const handleSave = async () => {
    if (!content.trim()) return;
    const now = Date.now();

    try {
      if (entryType === 'task') {
        // Xây dựng hệ thống Tag logic 
        const tags = [
          `freq:${freq}`,
          isUrgent ? 'p:urgent' : '',
          isImportant ? 'p:important' : '',
          ...selectedWeekDays.map(d => `d:${d}`)
        ].filter(Boolean);

        const newTask: ITask = {
          content: content.trim(),
          status: 'todo',
          createdAt: now,
          updatedAt: now,
          isFocusMode: false,
          tags,
          doneCount: 0,
          targetCount: 1
        };
        await db.tasks.add(newTask);
      } else {
        const newThought: IThought = {
          content: content.trim(),
          type: 'thought',
          wordCount: content.trim().split(/\s+/).length,
          createdAt: now,
          updatedAt: now,
          recordStatus: 'success'
        };
        await db.thoughts.add(newThought);
        
        // Lưu Mood vào bảng moods riêng biệt [cite: 32, 41]
        await db.moods.add({
          score: moodLevel,
          label: 'daily_reflection',
          createdAt: now
        });
      }

      triggerHaptic('success');
      onSuccess();
    } catch (error) {
      console.error("Lỗi lưu trữ Mind Cap:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. CHỌN LOẠI ENTRY */}
      <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5">
        {(['task', 'thought'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { triggerHaptic('light'); setEntryType(t); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all 
              ${entryType === t ? 'bg-white text-black shadow-xl' : 'opacity-20 hover:opacity-40'}`}
          >
            {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
          </button>
        ))}
      </div>

      {/* 2. TEXTAREA NHẬP LIỆU */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={entryType === 'task' ? "Hành động tiếp theo là gì?" : "Dòng suy nghĩ hiện tại..."}
        className="w-full bg-transparent text-xl font-medium focus:outline-none min-h-[120px] placeholder:opacity-10 resize-none leading-relaxed text-white/90"
      />

      {/* 3. TUỲ CHỌN RIÊNG BIỆT THEO LOẠI */}
      <div className="space-y-8 py-4 border-y border-white/5">
        {entryType === 'task' ? (
          <>
            {/* Tần suất Task */}
            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest opacity-30">Tần suất thực thi</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'once', label: '1 lần' },
                  { id: 'weekly', label: 'Hàng tuần' },
                  { id: 'days-week', label: 'Tùy chọn ngày' },
                  { id: 'days-month', label: 'Tùy chọn tháng' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFreq(f.id as any)}
                    className={`py-3 px-4 rounded-xl text-[10px] font-bold border transition-all 
                      ${freq === f.id ? 'border-white/20 bg-white/5 text-white' : 'border-transparent opacity-30'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eisenhower Matrix (Urgent/Important) */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all
                  ${isUrgent ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-zinc-950 border-white/5 opacity-40'}`}
              >
                Khẩn cấp
              </button>
              <button
                onClick={() => setIsImportant(!isImportant)}
                className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all
                  ${isImportant ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-zinc-950 border-white/5 opacity-40'}`}
              >
                Quan trọng
              </button>
            </div>
          </>
        ) : (
          /* Lựa chọn cảm xúc cho Thought */
          <div className="space-y-4">
            <label className="text-[8px] font-black uppercase tracking-widest opacity-30 block text-center">Tâm thế hiện tại</label>
            <div className="flex justify-between items-center px-4">
              {[
                { v: 1, s: '😫', l: 'Rất khó chịu' },
                { v: 2, s: '😕', l: 'Khó chịu' },
                { v: 3, s: '😐', l: 'Bình thường' },
                { v: 4, s: '😊', l: 'Vui' },
                { v: 5, s: '🤩', l: 'Rất vui' }
              ].map((m) => (
                <button
                  key={m.v}
                  onClick={() => { triggerHaptic('light'); setMoodLevel(m.v); }}
                  className={`flex flex-col items-center gap-2 transition-all 
                    ${moodLevel === m.v ? 'scale-125 opacity-100' : 'opacity-20 grayscale'}`}
                >
                  <span className="text-2xl">{m.s}</span>
                  <span className="text-[7px] font-bold uppercase tracking-tighter w-12 text-center leading-none">{m.l}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. ĐIỀU KHIỂN: LƯU & HUỶ */}
      <div className="flex flex-col gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="w-full py-5 bg-white text-black rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-10"
        >
          Lưu vào Mind Cap
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};