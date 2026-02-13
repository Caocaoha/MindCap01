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
 * [MOD_INPUT]: Form nhập liệu v3.8 - Tích hợp định lượng và Tần suất thích ứng.
 * Giải quyết lỗi tràn màn hình bằng cấu trúc Scrollable Body + Sticky Footer.
 */
export const EntryForm: React.FC<EntryFormProps> = ({ onSuccess, onCancel }) => {
  const { setInputFocused } = useUiStore();
  
  // --- States Chung ---
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  
  // --- States cho TASK (Định lượng & Eisenhower) --- [cite: 35, 37]
  const [targetCount, setTargetCount] = useState<number>(1);
  const [unit, setUnit] = useState<string>('');
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  
  // States cho Tần suất chi tiết
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); 
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]); 
  
  // --- States cho THOUGHT --- [cite: 39, 41]
  const [moodLevel, setMoodLevel] = useState<number>(3); 

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Logic Xử lý Lưu trữ
   */
  const handleSave = async () => {
    if (!content.trim()) return;
    const now = Date.now();

    try {
      if (entryType === 'task') {
        // Logic gán mặc định thông minh
        let finalWeekDays = selectedWeekDays;
        if (freq === 'days-week' && selectedWeekDays.length === 0) {
          const today = new Date().getDay();
          finalWeekDays = [today === 0 ? 7 : today]; 
        }

        let finalMonthDays = selectedMonthDays;
        if (freq === 'days-month' && selectedMonthDays.length === 0) {
          finalMonthDays = [new Date().getDate()];
        }

        const tags = [
          `freq:${freq}`,
          isUrgent ? 'p:urgent' : '',
          isImportant ? 'p:important' : '',
          ...finalWeekDays.map(d => `d:${d}`),
          ...finalMonthDays.map(m => `m:${m}`)
        ].filter(Boolean);

        const newTask: ITask = {
          content: content.trim(),
          status: 'todo',
          createdAt: now,
          updatedAt: now,
          isFocusMode: false,
          targetCount: Number(targetCount),
          unit: unit.trim(),
          doneCount: 0,
          tags
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
        await db.moods.add({ score: moodLevel, label: 'entry', createdAt: now });
      }

      triggerHaptic('success');
      onSuccess();
    } catch (error) {
      console.error("Lỗi lưu trữ:", error);
    }
  };

  const toggleWeekDay = (day: number) => {
    setSelectedWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[650px] overflow-hidden">
      
      {/* --- HEADER (Cố định) --- */}
      <div className="flex-none pb-4">
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
          {(['task', 'thought'] as const).map(t => (
            <button key={t} onClick={() => { triggerHaptic('light'); setEntryType(t); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryType === t ? 'bg-white text-black' : 'opacity-30'}`}>
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>

      {/* --- BODY (Cuộn được) --- */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
        
        {/* Nhập nội dung */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={entryType === 'task' ? "Hành động cụ thể..." : "Ghi lại điều đang nghĩ..."}
          className="w-full bg-transparent border-none text-xl focus:outline-none min-h-[100px] placeholder:opacity-20 resize-none leading-relaxed"
        />

        {entryType === 'task' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hàng Định lượng: Số lượng + Đơn vị  */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex-1">
                <label className="text-[8px] font-black uppercase opacity-20 block mb-1">Số lượng</label>
                <input type="number" value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} className="bg-transparent w-full text-lg font-bold outline-none" />
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex-1">
                <label className="text-[8px] font-black uppercase opacity-20 block mb-1">Đơn vị</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ly, trang..." className="bg-transparent w-full text-lg font-bold outline-none placeholder:opacity-20" />
              </div>
            </div>

            {/* Tần suất thực thi */}
            <div className="space-y-4">
              <label className="text-[8px] font-black uppercase tracking-widest opacity-20">Lặp lại chu kỳ</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'once', label: 'Một lần' },
                  { id: 'weekly', label: 'Hàng tuần' },
                  { id: 'days-week', label: 'Tùy chọn ngày' },
                  { id: 'days-month', label: 'Tùy chọn tháng' }
                ].map(f => (
                  <button key={f.id} onClick={() => setFreq(f.id as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${freq === f.id ? 'bg-white/10 border-white/20' : 'border-transparent opacity-30'}`}>{f.label}</button>
                ))}
              </div>

              {/* Sub-Selector cho Tuần */}
              {freq === 'days-week' && (
                <div className="flex justify-between gap-1 py-2 animate-in zoom-in-95">
                  {[1,2,3,4,5,6,7].map(d => (
                    <button key={d} onClick={() => toggleWeekDay(d)} className={`w-9 h-9 rounded-full text-[9px] font-black flex items-center justify-center transition-all ${selectedWeekDays.includes(d) ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 opacity-20'}`}>
                      {d === 7 ? 'CN' : `T${d+1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-Selector cho Tháng */}
              {freq === 'days-month' && (
                <div className="grid grid-cols-7 gap-1 py-2 animate-in zoom-in-95">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <button key={d} onClick={() => toggleMonthDay(d)} className={`h-8 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${selectedMonthDays.includes(d) ? 'bg-purple-500 text-white' : 'bg-white/5 opacity-20'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Eisenhower Matrix */}
            <div className="flex gap-3">
              <button onClick={() => setIsUrgent(!isUrgent)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isUrgent ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-zinc-900 border-white/5 opacity-20'}`}>Khẩn cấp</button>
              <button onClick={() => setIsImportant(!isImportant)} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isImportant ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-zinc-900 border-white/5 opacity-20'}`}>Quan trọng</button>
            </div>
          </div>
        ) : (
          /* Mood Selector */
          <div className="space-y-6 pt-10">
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => { triggerHaptic('light'); setMoodLevel(v); }} className={`transition-all duration-500 ${moodLevel === v ? 'scale-150 grayscale-0' : 'scale-100 grayscale opacity-20'}`}>
                  <span className="text-3xl">{['😫', '😕', '😐', '😊', '🤩'][v-1]}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
              {['Rất khó chịu', 'Khó chịu', 'Bình thường', 'Vui', 'Rất vui'][moodLevel-1]}
            </p>
          </div>
        )}
      </div>

      {/* --- FOOTER (Cố định - Sticky) --- */}
      <div className="flex-none space-y-2 pt-4 border-t border-white/5 bg-black">
        <button 
          onClick={handleSave} 
          disabled={!content.trim()} 
          className="w-full py-5 bg-white text-black rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-10"
        >
          Lưu lại entry
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-xl text-[10px] font-bold uppercase opacity-30 hover:opacity-100 tracking-widest transition-opacity">
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};