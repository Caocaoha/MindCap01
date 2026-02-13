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
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  
  // States cho Task
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); 
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [targetCount, setTargetCount] = useState(1);
  const [unit, setUnit] = useState('');

  // States cho Thought
  const [moodLevel, setMoodLevel] = useState<number>(0); 

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setInputFocused } = useUiStore();

  // Logic Ctrl+S & Keyboard Focus nội bộ
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(entryType === 'thought' ? 0 : undefined); 
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [content, entryType, moodLevel]);

  const handleSave = async (forceMood?: number) => {
    if (!content.trim()) return;
    const now = Date.now();
    try {
      if (entryType === 'task') {
        const tags = [`freq:${freq}`, isUrgent ? 'p:urgent' : '', isImportant ? 'p:important' : ''];
        if (freq === 'days-week') selectedWeekDays.forEach(d => tags.push(`d:${d}`));
        if (freq === 'days-month') selectedMonthDays.forEach(d => tags.push(`m:${d}`));

        await db.tasks.add({
          content: content.trim(), status: 'todo', createdAt: now, isFocusMode: false,
          targetCount, unit: unit.trim(), doneCount: 0, tags: tags.filter(Boolean)
        });
      } else {
        await db.thoughts.add({
          content: content.trim(), type: 'thought', wordCount: content.trim().split(/\s+/).length,
          createdAt: now, recordStatus: 'success'
        });
        await db.moods.add({ score: forceMood ?? moodLevel, label: 'entry', createdAt: now });
      }
      triggerHaptic('success');
      setContent('');
      onSuccess();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
        {(['task', 'thought'] as const).map(t => (
          <button key={t} onClick={() => setEntryType(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryType === t ? 'bg-white text-black' : 'opacity-30'}`}>
            {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
        autoFocus
        placeholder={entryType === 'task' ? "Kế hoạch thực thi..." : "Dòng suy nghĩ..."}
        className="w-full bg-transparent border-none text-xl focus:outline-none min-h-[140px] placeholder:opacity-20 resize-none"
      />

      <div className="space-y-6 border-t border-white/5 pt-6">
        {entryType === 'task' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {[ {id:'once', l:'1 Lần'}, {id:'weekly', l:'Hàng tuần'}, {id:'days-week', l:'Thứ trong tuần'}, {id:'days-month', l:'Ngày trong tháng'} ].map(f => (
                <button key={f.id} onClick={() => setFreq(f.id as any)} className={`py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${freq === f.id ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/5 opacity-20'}`}>{f.l}</button>
              ))}
            </div>

            {freq === 'days-week' && (
              <div className="flex justify-between gap-1">
                {[2, 3, 4, 5, 6, 7, 1].map(d => (
                  <button key={d} onClick={() => setSelectedWeekDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`w-10 h-10 rounded-full text-[10px] border transition-all ${selectedWeekDays.includes(d) ? 'bg-white text-black' : 'opacity-20'}`}>
                    {d === 1 ? 'CN' : `T${d}`}
                  </button>
                ))}
              </div>
            )}

            {freq === 'days-month' && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                  <button key={d} onClick={() => setSelectedMonthDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`h-8 rounded-lg text-[9px] border transition-all ${selectedMonthDays.includes(d) ? 'bg-white text-black' : 'opacity-20'}`}>{d}</button>
                ))}
              </div>
            )}

            <div className="flex gap-4 items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
              <div className="flex-1 flex gap-2">
                <button onClick={() => setIsUrgent(!isUrgent)} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/5 opacity-20'}`}>KHẨN CẤP</button>
                <button onClick={() => setIsImportant(!isImportant)} className={`flex-1 py-3 rounded-xl text-[9px] font-black border ${isImportant ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-white/5 opacity-20'}`}>QUAN TRỌNG</button>
              </div>
              <div className="flex flex-col gap-1 w-20">
                <input type="number" value={targetCount} onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))} className="bg-black/40 border border-white/10 rounded-lg py-2 text-center text-xs" placeholder="SL" />
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="bg-black/20 border border-white/5 rounded-md py-1 text-[8px] text-center uppercase" placeholder="Đơn vị" />
              </div>
            </div>
          </div>
        ) : (
          /* FIX: Đảm bảo Mood Scale luôn trả về JSX hợp lệ */
          <div className="flex justify-between items-end px-2 py-4">
            {[ {v:-2, l:'😠', n:'Rất khó chịu'}, {v:-1, l:'🙁', n:'Khó chịu'}, {v:0, l:'😐', n:'Bình thường'}, {v:1, l:'😊', n:'Vui'}, {v:2, l:'🥰', n:'Rất vui'} ].map(m => (
              <button key={m.v} onClick={() => setMoodLevel(m.v)} className={`flex flex-col items-center gap-3 transition-all ${moodLevel === m.v ? 'scale-125 opacity-100' : 'opacity-20 hover:opacity-40'}`}>
                <span className="text-3xl">{m.l}</span>
                <span className="text-[7px] uppercase font-black tracking-tighter w-12 text-center leading-tight">{m.n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <button onClick={() => handleSave()} disabled={!content.trim()} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-10">Lưu lại entry</button>
        <button onClick={onCancel} className="w-full py-3 rounded-xl text-[9px] font-bold uppercase opacity-30 hover:opacity-100 tracking-widest transition-opacity">Hủy bỏ</button>
      </div>
    </div>
  );
};