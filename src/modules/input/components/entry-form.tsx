import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { ITask, IThought } from '../../../database/types';

/**
 * [PROPS]: Hỗ trợ đầy đủ cho cả chế độ Thêm mới và Chỉnh sửa (Edit Mode).
 * initialData được truyền từ EntryModal để xử lý lỗi TS2322.
 */
interface EntryFormProps {
  initialData?: ITask | IThought | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * [MOD_INPUT]: Form nhập liệu v3.8.2 - Phiên bản Toàn năng.
 * Bảo tồn 100%: Định lượng, Tần suất thích ứng, Eisenhower, Mood và Sticky Footer.
 */
export const EntryForm: React.FC<EntryFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { setInputFocused } = useUiStore();
  
  // --- 1. STATES CHUNG ---
  const [entryType, setEntryType] = useState<'task' | 'thought'>('task');
  const [content, setContent] = useState('');
  
  // --- 2. STATES CHO TASK (Định lượng & Chiến lược) ---
  const [targetCount, setTargetCount] = useState<number>(1);
  const [unit, setUnit] = useState<string>('');
  const [freq, setFreq] = useState<'once' | 'weekly' | 'days-week' | 'days-month'>('once');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  
  // States cho Tần suất chi tiết (Tuần/Tháng)
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]); 
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]); 
  
  // --- 3. STATES CHO THOUGHT (Cảm xúc) ---
  const [moodLevel, setMoodLevel] = useState<number>(3); 

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * [LIFE-CYCLE]: Khởi tạo và Đổ dữ liệu (nếu là chế độ Chỉnh sửa)
   */
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      
      // Phân tích dữ liệu nếu là Task
      if ('status' in initialData) {
        setEntryType('task');
        setTargetCount(initialData.targetCount || 1);
        setUnit(initialData.unit || '');
        setIsUrgent(initialData.tags?.includes('p:urgent') || false);
        setIsImportant(initialData.tags?.includes('p:important') || false);
        
        // Trích xuất Freq từ tags
        const freqTag = initialData.tags?.find(t => t.startsWith('freq:'));
        if (freqTag) setFreq(freqTag.split(':')[1] as any);
        
        // Trích xuất Ngày trong tuần (d:1-7) và Ngày trong tháng (m:1-31)
        const dTags = initialData.tags?.filter(t => t.startsWith('d:')).map(t => parseInt(t.split(':')[1]));
        const mTags = initialData.tags?.filter(t => t.startsWith('m:')).map(t => parseInt(t.split(':')[1]));
        if (dTags) setSelectedWeekDays(dTags);
        if (mTags) setSelectedMonthDays(mTags);
      } else {
        // Nếu là Thought
        setEntryType('thought');
      }
    }
    textareaRef.current?.focus();
  }, [initialData]);

  /**
   * [ACTION]: Logic Lưu trữ (Add/Update) và Xử lý Tag thông minh
   */
  const handleSave = async () => {
    if (!content.trim()) return;
    const now = Date.now();

    try {
      if (entryType === 'task') {
        // --- Logic Mặc định Thông minh cho Tần suất ---
        let finalWeekDays = selectedWeekDays;
        if (freq === 'days-week' && selectedWeekDays.length === 0) {
          const today = new Date().getDay();
          finalWeekDays = [today === 0 ? 7 : today]; 
        }

        let finalMonthDays = selectedMonthDays;
        if (freq === 'days-month' && selectedMonthDays.length === 0) {
          finalMonthDays = [new Date().getDate()];
        }

        // Tạo mảng Tags chuẩn hóa
        const tags = [
          `freq:${freq}`,
          isUrgent ? 'p:urgent' : '',
          isImportant ? 'p:important' : '',
          ...finalWeekDays.map(d => `d:${d}`),
          ...finalMonthDays.map(m => `m:${m}`)
        ].filter(Boolean);

        const taskPayload: ITask = {
          content: content.trim(),
          status: (initialData as ITask)?.status || 'todo',
          createdAt: initialData?.createdAt || now,
          updatedAt: now,
          isFocusMode: (initialData as ITask)?.isFocusMode || false,
          targetCount: Number(targetCount),
          unit: unit.trim(),
          doneCount: (initialData as ITask)?.doneCount || 0,
          tags
        };

        // Thực thi vào Database
        if (initialData?.id) {
          await db.tasks.update(initialData.id, taskPayload);
        } else {
          await db.tasks.add(taskPayload);
        }
      } else {
        // Xử lý lưu Thought và Mood
        const thoughtPayload: IThought = {
          content: content.trim(),
          type: 'thought',
          wordCount: content.trim().split(/\s+/).length,
          createdAt: initialData?.createdAt || now,
          updatedAt: now,
          recordStatus: 'success'
        };

        if (initialData?.id) {
          await db.thoughts.update(initialData.id, thoughtPayload);
        } else {
          await db.thoughts.add(thoughtPayload);
          // Ghi nhận cảm xúc vào bảng moods
          await db.moods.add({ score: moodLevel, label: 'entry_reflection', createdAt: now });
        }
      }

      triggerHaptic('success');
      onSuccess();
    } catch (error) {
      console.error("Lỗi lưu trữ Mind Cap:", error);
    }
  };

  const toggleWeekDay = (day: number) => {
    triggerHaptic('light');
    setSelectedWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleMonthDay = (day: number) => {
    triggerHaptic('light');
    setSelectedMonthDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[680px] overflow-hidden bg-black">
      
      {/* --- PHẦN 1: HEADER (Cố định) --- */}
      <div className="flex-none pb-4">
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
          {(['task', 'thought'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => { triggerHaptic('light'); setEntryType(t); }} 
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryType === t ? 'bg-white text-black' : 'opacity-30 hover:opacity-100'}`}
            >
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>

      {/* --- PHẦN 2: BODY (Cuộn nội dung) --- */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-8 custom-scrollbar pb-6">
        
        {/* Textarea nhập liệu */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={entryType === 'task' ? "Hành động cụ thể là gì?" : "Bạn đang trăn trở điều gì?"}
          className="w-full bg-transparent border-none text-xl focus:outline-none min-h-[100px] placeholder:opacity-20 resize-none leading-relaxed text-white/90"
        />

        {entryType === 'task' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* HÀNG ĐỊNH LƯỢNG (Metrics) */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex-1">
                <label className="text-[8px] font-black uppercase opacity-20 block mb-1">Mục tiêu số</label>
                <input 
                  type="number" 
                  value={targetCount} 
                  onChange={(e) => setTargetCount(Number(e.target.value))} 
                  className="bg-transparent w-full text-lg font-bold outline-none text-white" 
                />
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex-1">
                <label className="text-[8px] font-black uppercase opacity-20 block mb-1">Đơn vị tính</label>
                <input 
                  type="text" 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                  placeholder="ly, trang, km..." 
                  className="bg-transparent w-full text-lg font-bold outline-none placeholder:opacity-20 text-white" 
                />
              </div>
            </div>

            {/* TẦN SUẤT THÍCH ỨNG (Adaptive Frequency) */}
            <div className="space-y-4">
              <label className="text-[8px] font-black uppercase tracking-widest opacity-20">Chu kỳ lặp lại</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'once', label: 'Làm một lần' },
                  { id: 'weekly', label: 'Mỗi tuần' },
                  { id: 'days-week', label: 'Tùy chọn ngày' },
                  { id: 'days-month', label: 'Tùy chọn tháng' }
                ].map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => { triggerHaptic('light'); setFreq(f.id as any); }} 
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${freq === f.id ? 'bg-white/10 border-white/20 text-white' : 'border-transparent opacity-30 hover:opacity-100'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sub-Selector: Thứ trong tuần */}
              {freq === 'days-week' && (
                <div className="flex justify-between gap-1 py-2 animate-in zoom-in-95 duration-300">
                  {[1,2,3,4,5,6,7].map(d => (
                    <button 
                      key={d} 
                      onClick={() => toggleWeekDay(d)} 
                      className={`w-9 h-9 rounded-full text-[9px] font-black flex items-center justify-center transition-all ${selectedWeekDays.includes(d) ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 opacity-20 hover:opacity-50'}`}
                    >
                      {d === 7 ? 'CN' : `T${d+1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-Selector: Ngày trong tháng */}
              {freq === 'days-month' && (
                <div className="grid grid-cols-7 gap-1 py-2 animate-in zoom-in-95 duration-300">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <button 
                      key={d} 
                      onClick={() => toggleMonthDay(d)} 
                      className={`h-8 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${selectedMonthDays.includes(d) ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 opacity-20 hover:opacity-50'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EISENHOWER MATRIX */}
            <div className="flex gap-3">
              <button 
                onClick={() => { triggerHaptic('light'); setIsUrgent(!isUrgent); }} 
                className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isUrgent ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-zinc-900 border-white/5 opacity-20 hover:opacity-50'}`}
              >
                Khẩn cấp
              </button>
              <button 
                onClick={() => { triggerHaptic('light'); setIsImportant(!isImportant); }} 
                className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${isImportant ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-zinc-900 border-white/5 opacity-20 hover:opacity-50'}`}
              >
                Quan trọng
              </button>
            </div>
          </div>
        ) : (
          /* PHẦN SUY NGHĨ: Mood Selector */
          <div className="space-y-8 pt-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4, 5].map((v) => (
                <button 
                  key={v} 
                  onClick={() => { triggerHaptic('light'); setMoodLevel(v); }} 
                  className={`transition-all duration-500 outline-none ${moodLevel === v ? 'scale-150 grayscale-0' : 'scale-100 grayscale opacity-20 hover:opacity-50'}`}
                >
                  <span className="text-4xl">{['😫', '😕', '😐', '😊', '🤩'][v-1]}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              {['Rất khó chịu', 'Khó chịu', 'Bình thường', 'Vui', 'Rất vui'][moodLevel-1]}
            </p>
          </div>
        )}
      </div>

      {/* --- PHẦN 3: FOOTER (Cố định - Sticky) --- */}
      <div className="flex-none space-y-2 pt-4 border-t border-white/5 bg-black z-10">
        <button 
          onClick={handleSave} 
          disabled={!content.trim()} 
          className="w-full py-5 bg-white text-black rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-10"
        >
          {initialData ? 'Cập nhật thay đổi' : 'Gieo mầm vào Mind Cap'}
        </button>
        <button 
          onClick={() => { triggerHaptic('light'); onCancel(); }} 
          className="w-full py-3 rounded-xl text-[10px] font-bold uppercase opacity-30 hover:opacity-100 tracking-widest transition-opacity"
        >
          Hủy bỏ thao tác
        </button>
      </div>
    </div>
  );
};