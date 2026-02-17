/**
 * Purpose: Giao dien nguoi dung (UI) cho form nhap lieu Mind Cap.
 * Inputs/Outputs: Nhan vao Props dieu khien va hien thi du lieu tu useEntryLogic.
 * Business Rule: Tap trung vao trai nghiem nhap lieu nhanh, phan tach ro rang giua UI va Logic.
 */

import React, { useRef, useEffect } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { useEntryLogic } from './use-entry-logic';
import { EntryFormProps } from './entry-types';

export const EntryForm: React.FC<EntryFormProps> = (props) => {
  const { onCancel } = props;
  const logic = useEntryLogic(props);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-[75vh] sm:h-auto max-h-[680px] overflow-hidden bg-white rounded-[6px]">
      {/* HEADER: Tab Switcher */}
      <div className="flex-none p-4 pb-2">
        <div className="flex bg-slate-50 p-1 rounded-[6px] border border-slate-200">
          {(['task', 'thought'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => { triggerHaptic('light'); logic.setEntryType(t); }} 
              className={`flex-1 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all
                ${logic.entryType === t ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t === 'task' ? 'Nhiệm vụ' : 'Suy nghĩ'}
            </button>
          ))}
        </div>
      </div>

      {/* BODY: Content area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar pb-6">
        <textarea
          ref={textareaRef}
          value={logic.content}
          onChange={(e) => logic.handleContentChange(e.target.value)}
          placeholder={logic.entryType === 'task' ? "Hành động cụ thể là gì?" : "Bạn đang trăn trở điều gì?"}
          className="w-full bg-transparent border-none text-xl font-medium focus:outline-none min-h-[120px] placeholder:text-slate-300 resize-none leading-relaxed text-slate-900"
        />

        {logic.entryType === 'task' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[6px] border border-slate-200">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Mục tiêu số</label>
                <input type="number" value={logic.targetCount} onChange={(e) => logic.setTargetCount(Number(e.target.value))} className="bg-transparent w-full text-lg font-semibold outline-none" />
              </div>
              <div className="w-[1px] h-8 bg-slate-200" />
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Đơn vị tính</label>
                <input type="text" value={logic.unit} onChange={(e) => logic.setUnit(e.target.value)} placeholder="ly, trang..." className="bg-transparent w-full text-lg font-semibold outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase text-slate-400">Chu kỳ lặp lại</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'once', label: 'Làm một lần' }, { id: 'weekly', label: 'Mỗi tuần' },
                  { id: 'days-week', label: 'Tùy chọn ngày' }, { id: 'days-month', label: 'Tùy chọn tháng' }
                ].map(f => (
                  <button key={f.id} onClick={() => { triggerHaptic('light'); logic.setFreq(f.id as any); }}
                    className={`py-2.5 rounded-[6px] text-[10px] font-bold uppercase border transition-all ${logic.freq === f.id ? 'bg-slate-100 border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {logic.freq === 'days-week' && (
                <div className="flex justify-between gap-1 py-2 animate-in zoom-in-95 duration-200">
                  {[1,2,3,4,5,6,7].map(d => (
                    <button key={d} onClick={() => logic.toggleWeekDay(d)}
                      className={`w-9 h-9 rounded-[6px] text-[10px] font-bold flex items-center justify-center transition-all ${logic.selectedWeekDays.includes(d) ? 'bg-[#2563EB] text-white' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}
                    >
                      {d === 7 ? 'CN' : `T${d+1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { triggerHaptic('light'); logic.setIsUrgent(!logic.isUrgent); }}
                className={`flex-1 py-4 rounded-[6px] text-[10px] font-bold uppercase border transition-all ${logic.isUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                Khẩn cấp
              </button>
              <button onClick={() => { triggerHaptic('light'); logic.setIsImportant(!logic.setIsImportant); }}
                className={`flex-1 py-4 rounded-[6px] text-[10px] font-bold uppercase border transition-all ${logic.isImportant ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              >
                Quan trọng
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pt-10 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => { triggerHaptic('light'); logic.setMoodLevel(v); }}
                  className={`transition-all duration-300 ${logic.moodLevel === v ? 'scale-125 grayscale-0' : 'scale-100 grayscale opacity-30'}`}
                >
                  <span className="text-4xl">{['😫', '😕', '😐', '😊', '🤩'][v-1]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-none p-4 border-t border-slate-200 bg-white">
        <button onClick={logic.handleSave} disabled={!logic.content.trim()}
          className="w-full py-4 bg-[#2563EB] text-white rounded-[6px] text-[11px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-30"
        >
          {props.initialData?.id ? 'Cập nhật thay đổi' : 'Lưu vào Mind Cap'}
        </button>
        <button onClick={() => { triggerHaptic('light'); onCancel(); }}
          className="w-full py-3 mt-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 tracking-widest"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};