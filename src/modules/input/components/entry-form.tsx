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
 * [MOD_INPUT]: Form nhập liệu v4.0 - Thẩm mỹ Linear.app.
 * Đặc điểm: Nền trắng, Slate Border 1px, Bo góc 6px, Nhấn Blue #2563EB.
 * Bảo tồn 100%: Định lượng, Tần suất, Eisenhower, Mood và Sticky Footer.
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
    /* CONTAINER: Nền trắng tuyệt đối, Bo góc 6px, Không bóng đổ */
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[680px] overflow-hidden bg-white rounded-[6px]">
      
      {/* --- PHẦN 1: HEADER (Tab Switcher - Slate style) --- */}
      <div className="flex-none p-4 pb-2">
        <div className="flex bg-slate-50 p-1 rounded-[6px] border border-slate-200">
          {(['task', 'thought'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => { triggerHaptic('light'); setEntryType(t); }} 
              className={`flex-1 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all
                ${entryType === t ? 'bg-white text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>

      {/* --- PHẦN 2: BODY (Content Scroll - Linear aesthetic) --- */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar pb-6">
        
        {/* Textarea: Chữ Slate-900 đậm nét trên nền trắng */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={entryType === 'task' ? "Hành động cụ thể là gì?" : "Bạn đang trăn trở điều gì?"}
          className="w-full bg-transparent border-none text-xl font-medium focus:outline-none min-h-[120px] placeholder:text-slate-300 resize-none leading-relaxed text-slate-900"
        />

        {entryType === 'task' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-200">
            
            {/* HÀNG ĐỊNH LƯỢNG (Metrics - Flat style) */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[6px] border border-slate-200">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Mục tiêu số</label>
                <input 
                  type="number" 
                  value={targetCount} 
                  onChange={(e) => setTargetCount(Number(e.target.value))} 
                  className="bg-transparent w-full text-lg font-semibold outline-none text-slate-900" 
                />
              </div>
              <div className="w-[1px] h-8 bg-slate-200" />
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Đơn vị tính</label>
                <input 
                  type="text" 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                  placeholder="ly, trang, km..." 
                  className="bg-transparent w-full text-lg font-semibold outline-none placeholder:text-slate-300 text-slate-900" 
                />
              </div>
            </div>

            {/* TẦN SUẤT THÍCH ỨNG (Adaptive Frequency) */}
            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Chu kỳ lặp lại</label>
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
                    className={`py-2.5 rounded-[6px] text-[10px] font-bold uppercase border transition-all
                      ${freq === f.id ? 'bg-slate-100 border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sub-Selector: Ngày trong tuần (Xanh đậm làm nhấn) */}
              {freq === 'days-week' && (
                <div className="flex justify-between gap-1 py-2 animate-in zoom-in-95 duration-200">
                  {[1,2,3,4,5,6,7].map(d => (
                    <button 
                      key={d} 
                      onClick={() => toggleWeekDay(d)} 
                      className={`w-9 h-9 rounded-[6px] text-[10px] font-bold flex items-center justify-center transition-all
                        ${selectedWeekDays.includes(d) ? 'bg-[#2563EB] text-white' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}
                    >
                      {d === 7 ? 'CN' : `T${d+1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-Selector: Ngày trong tháng */}
              {freq === 'days-month' && (
                <div className="grid grid-cols-7 gap-1 py-2 animate-in zoom-in-95 duration-200">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <button 
                      key={d} 
                      onClick={() => toggleMonthDay(d)} 
                      className={`h-8 rounded-[4px] text-[10px] font-bold flex items-center justify-center transition-all
                        ${selectedMonthDays.includes(d) ? 'bg-[#2563EB] text-white' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EISENHOWER MATRIX (Slate tints) */}
            <div className="flex gap-3">
              <button 
                onClick={() => { triggerHaptic('light'); setIsUrgent(!isUrgent); }} 
                className={`flex-1 py-4 rounded-[6px] text-[10px] font-bold uppercase border transition-all
                  ${isUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                Khẩn cấp
              </button>
              <button 
                onClick={() => { triggerHaptic('light'); setIsImportant(!isImportant); }} 
                className={`flex-1 py-4 rounded-[6px] text-[10px] font-bold uppercase border transition-all
                  ${isImportant ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                Quan trọng
              </button>
            </div>
          </div>
        ) : (
          /* PHẦN SUY NGHĨ: Mood Selector (Slate/Monochrome focus) */
          <div className="space-y-8 pt-10 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4, 5].map((v) => (
                <button 
                  key={v} 
                  onClick={() => { triggerHaptic('light'); setMoodLevel(v); }} 
                  className={`transition-all duration-300 ${moodLevel === v ? 'scale-125 grayscale-0' : 'scale-100 grayscale opacity-30 hover:opacity-50'}`}
                >
                  <span className="text-4xl">{['😫', '😕', '😐', '😊', '🤩'][v-1]}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {['Rất khó chịu', 'Khó chịu', 'Bình thường', 'Vui', 'Rất vui'][moodLevel-1]}
            </p>
          </div>
        )}
      </div>

      {/* --- PHẦN 3: FOOTER (Sticky Footer - Linear style) --- */}
      <div className="flex-none p-4 border-t border-slate-200 bg-white">
        <button 
          onClick={handleSave} 
          disabled={!content.trim()} 
          className="w-full py-4 bg-[#2563EB] text-white rounded-[6px] text-[11px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale shadow-none"
        >
          {initialData ? 'Cập nhật thay đổi' : 'Lưu vào Mind Cap'}
        </button>
        <button 
          onClick={() => { triggerHaptic('light'); onCancel(); }} 
          className="w-full py-3 mt-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-colors"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};