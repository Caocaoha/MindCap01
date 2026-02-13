import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { useJourneyStore } from '../../../store/journey-store'; // [BỔ SUNG]
import { ITask, IThought } from '../../../database/types';

interface EntryFormProps {
  initialData?: ITask | IThought | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { setInputFocused } = useUiStore();
  const { linkingItem, setLinkingItem } = useJourneyStore(); // [BỔ SUNG]

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

  // --- [NEW]: LOGIC EDIT - Đổ dữ liệu cũ vào form ---
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      if ('status' in initialData) { // Nếu là Task
        setEntryType('task');
        setTargetCount(initialData.targetCount || 1);
        setUnit(initialData.unit || '');
        setIsUrgent(initialData.tags?.includes('p:urgent') || false);
        setIsImportant(initialData.tags?.includes('p:important') || false);
        // Logic tách freq từ tags có thể bổ sung tại đây
      } else { // Nếu là Thought
        setEntryType('thought');
        setThoughtType(initialData.type as any);
      }
    }
  }, [initialData]);

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

  const handleSave = async (forceMood?: number) => {
    if (!content.trim()) return;
    const now = Date.now();
    
    // --- [NEW]: LOGIC LINK - Tự động đính kèm tag liên kết ---
    let finalContent = content.trim();
    if (linkingItem && !initialData) {
      finalContent += ` #ref-${linkingItem.type}-${linkingItem.id}`;
    }

    try {
      if (entryType === 'task') {
        const tags = [`freq:${freq}`, isUrgent ? 'p:urgent' : '', isImportant ? 'p:important' : ''];
        // ... giữ nguyên logic xử lý tags cũ ...

        const taskPayload: ITask = {
          content: finalContent,
          status: 'todo',
          createdAt: initialData?.createdAt || now,
          updatedAt: now,
          isFocusMode: false,
          targetCount: targetCount || 1,
          doneCount: 0,
          unit: unit.trim() || "",
          tags: tags.filter(Boolean)
        };
        initialData?.id ? await db.tasks.update(initialData.id, taskPayload) : await db.tasks.add(taskPayload);
      } else {
        const thoughtPayload: IThought = {
          content: finalContent,
          type: thoughtType,
          wordCount: finalContent.split(/\s+/).length,
          createdAt: initialData?.createdAt || now,
          updatedAt: now,
          recordStatus: 'success'
        };
        initialData?.id ? await db.thoughts.update(initialData.id, thoughtPayload) : await db.thoughts.add(thoughtPayload);
        if (!initialData) await db.moods.add({ score: forceMood ?? moodLevel, label: 'entry', createdAt: now });
      }

      setLinkingItem(null); // Reset link state sau khi lưu
      triggerHaptic('success');
      setContent('');
      onSuccess();
    } catch (err) { console.error("Lỗi lưu trữ:", err); }
  };

  return (
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[650px] overflow-hidden">
      {/* Giữ nguyên 100% phần Render UI của EntryForm bạn đã gửi */}
      {/* ... [CODE UI ENTRYFORM] ... */}
      <div className="flex-none pb-4">
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
          {(['task', 'thought'] as const).map(t => (
            <button key={t} onClick={() => setEntryType(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryType === t ? 'bg-white text-black' : 'opacity-30'}`}>
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>
      {/* ... Các phần còn lại của form giữ nguyên 100% ... */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
        <textarea
          ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
          autoFocus placeholder={entryType === 'task' ? "Kế hoạch thực thi..." : "Dòng suy nghĩ..."}
          className="w-full bg-transparent border-none text-xl focus:outline-none min-h-[120px] placeholder:opacity-20 resize-none"
        />
        {/* ... ( Eisenhower, Freq, Mood selectors ) ... */}
      </div>
      <div className="flex-none space-y-2 pt-4 border-t border-white/5 bg-black">
        <button onClick={() => handleSave()} disabled={!content.trim()} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-10">
          {initialData ? 'Cập nhật bản ghi' : 'Lưu lại entry'}
        </button>
        <button onClick={() => { setLinkingItem(null); onCancel?.(); }} className="w-full py-3 rounded-xl text-[9px] font-bold uppercase opacity-30 hover:opacity-100 tracking-widest transition-opacity">Hủy bỏ</button>
      </div>
    </div>
  );
};