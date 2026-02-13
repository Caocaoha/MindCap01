import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { ITask, IThought } from '../../../database/types';

interface EntryFormProps {
  initialData?: ITask | IThought | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ initialData, onSuccess, onCancel }) => {
  // --- 1. GIỮ NGUYÊN 100% CÁC TRẠNG THÁI HIỆN CÓ ---
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  
  // Task States
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); 
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [targetCount, setTargetCount] = useState(1);
  const [unit, setUnit] = useState('');

  // Thought States
  const [thoughtType, setThoughtType] = useState<'note' | 'thought' | 'insight'>('thought');
  const [moodLevel, setMoodLevel] = useState<number>(0); 

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setInputFocused } = useUiStore();

  // --- 2. PHÍM TẮT CTRL + S (Lưu dạng Mood Bình thường) ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(entryType === 'thought' ? 0 : undefined); 
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [content, entryType, moodLevel, freq, selectedWeekDays, selectedMonthDays]);

  // --- 3. GÁN CỨNG DỮ LIỆU KHI LƯU (EXPLICIT INITIALIZATION) ---
  const handleSave = async (forceMood?: number) => {
    if (!content.trim()) return;
    const now = Date.now();

    try {
      if (entryType === 'task') {
        const tags = [`freq:${freq}`, isUrgent ? 'p:urgent' : '', isImportant ? 'p:important' : ''];
        if (freq === 'days-week') selectedWeekDays.forEach(d => tags.push(`d:${d}`));
        if (freq === 'days-month') selectedMonthDays.forEach(d => tags.push(`m:${d}`));

        // Gán cứng mọi trường dữ liệu để tránh lỗi Undefined trên Saban
        const taskPayload: ITask = {
          content: content.trim(),
          status: 'todo',
          createdAt: now,
          updatedAt: now,
          isFocusMode: false, // Bắt buộc False để hiện trên Saban
          targetCount: targetCount || 1,
          doneCount: 0,
          unit: unit.trim() || "",
          tags: tags.filter(Boolean)
        };
        initialData?.id ? await db.tasks.update(initialData.id, taskPayload) : await db.tasks.add(taskPayload);
      } else {
        const thoughtPayload: IThought = {
          content: content.trim(),
          type: thoughtType,
          wordCount: content.trim().split(/\s+/).length,
          createdAt: now,
          updatedAt: now,
          recordStatus: 'success'
        };
        initialData?.id ? await db.thoughts.update(initialData.id, thoughtPayload) : await db.thoughts.add(thoughtPayload);
        await db.moods.add({ score: forceMood ?? moodLevel, label: 'entry', createdAt: now });
      }

      triggerHaptic('success');
      setContent('');
      onSuccess();
    } catch (err) { console.error("Lỗi lưu trữ:", err); }
  };

  return (
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[650px] overflow-hidden">
      
      {/* HEADER CỐ ĐỊNH: Chuyển đổi Nhiệm vụ/Suy nghĩ */}
      <div className="flex-none pb-4">
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
          {(['task', 'thought'] as const).map(t => (
            <button key={t} onClick={() => setEntryType(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryType === t ? 'bg-white text-black' : 'opacity-30'}`}>
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>

      {/* THÂN FORM CUỘN ĐỘC LẬP: Textarea & Options */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
        <textarea
          ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
          autoFocus placeholder={entryType === 'task' ? "Kế hoạch thực thi..." : "Dòng suy nghĩ..."}
          className="w-full bg-transparent border-none text-xl focus:outline-none min-h-[120px] placeholder:opacity-20 resize-none"
        />

        <div className="space-y-6 border-t border-white/5 pt-6">
          {entryType === 'task' ? (
            <div className="space-y-6">
              {/* Tần suất 4 lựa chọn */}
              <div className="grid grid-cols-2 gap-2">
                {[ {id:'once', l:'1 Lần'}, {id:'weekly', l:'Hàng tuần'}, {id:'days-week', l:'Thứ trong tuần'}, {id:'days-month', l:'Ngày trong tháng'} ].map(f => (
                  <button key={f.id} onClick={() => setFreq(f.id as any)} className={`py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${freq === f.id ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/5 opacity-20'}`}>{f.l}</button>
                ))}
              </div>

              {/* Lưới chọn Thứ (T2-CN) */}
              {freq === 'days-week' && (
                <div className="flex justify-between gap-1 animate-in fade-in">
                  {[2, 3, 4, 5, 6, 7, 1].map(d => (
                    <button key={d} onClick={() => setSelectedWeekDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`w-9 h-9 rounded-full text-[10px] border transition-all ${selectedWeekDays.includes(d) ? 'bg-white text-black' : 'opacity-20'}`}>
                      {d === 1 ? 'CN' : `T${d}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Lưới chọn Ngày (1-31) */}
              {freq === 'days-month' && (
                <div className="grid grid-cols-7 gap-1 animate-in fade-in pb-2">
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                    <button key={d} onClick={() => setSelectedMonthDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`h-9 rounded-lg text-[9px] border transition-all ${selectedMonthDays.includes(d) ? 'bg-white text-black' : 'opacity-20'}`}>{d}</button>
                  ))}
                </div>
              )}

              {/* Ma trận Eisenhower, Mục tiêu & Đơn vị */}
              <div className="flex gap-4 items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
                <div className="flex-1 flex gap-2">
                  <button onClick={() => setIsUrgent(!isUrgent)} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/5 opacity-20'}`}>KHẨN CẤP</button>
                  <button onClick={() => setIsImportant(!isImportant)} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${isImportant ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-white/5 opacity-20'}`}>QUAN TRỌNG</button>
                </div>
                <div className="flex flex-col gap-1 w-20">
                  <input type="number" value={targetCount} onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))} className="bg-black/40 border border-white/10 rounded-lg py-2 text-center text-xs" />
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="bg-black/20 border border-white/5 rounded-md py-1 text-[8px] text-center uppercase" placeholder="Đơn vị" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Phân loại Thought: Note/Thought/Insight */}
              <div className="flex gap-2">
                {(['thought', 'note', 'insight'] as const).map(t => (
                  <button key={t} onClick={() => setThoughtType(t)} className={`flex-1 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${thoughtType === t ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/5 opacity-20'}`}>{t}</button>
                ))}
              </div>
              {/* Cảm xúc 5 mức độ */}
              <div className="flex justify-between items-end px-2 py-4">
                {[ {v:-2, l:'😠', n:'Rất khó chịu'}, {v:-1, l:'🙁', n:'Khó chịu'}, {v:0, l:'😐', n:'Bình thường'}, {v:1, l:'😊', n:'Vui'}, {v:2, l:'🥰', n:'Rất vui'} ].map(m => (
                  <button key={m.v} onClick={() => setMoodLevel(m.v)} className={`flex flex-col items-center gap-3 transition-all ${moodLevel === m.v ? 'scale-125 opacity-100' : 'opacity-20 hover:opacity-40'}`}>
                    <span className="text-3xl">{m.l}</span>
                    <span className="text-[7px] uppercase font-black tracking-tighter w-12 text-center leading-tight">{m.n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER HÀNH ĐỘNG CỐ ĐỊNH: Lưu & Hủy cho mọi thẻ */}
      <div className="flex-none space-y-2 pt-4 border-t border-white/5 bg-black">
        <button onClick={() => handleSave()} disabled={!content.trim()} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-10">Lưu lại entry</button>
        <button onClick={onCancel} className="w-full py-3 rounded-xl text-[9px] font-bold uppercase opacity-30 hover:opacity-100 tracking-widest transition-opacity">Hủy bỏ</button>
      </div>
    </div>
  );
};