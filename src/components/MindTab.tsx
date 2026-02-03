import React, { useState, useRef } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Circle, ArrowRight, Zap, Check, Target, Eye, Fingerprint, Calendar } from 'lucide-react';
import clsx from 'clsx';

// Minimal Slider Component
const LinearSlider = ({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: number, onChange: (v: number) => void }) => {
  return (
    <div className="flex items-center gap-4 py-2 group select-none">
      <div className="flex items-center gap-2 w-24 text-slate-400 group-hover:text-slate-600 transition-colors">
        <Icon size={14} strokeWidth={1.5} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex-1 relative h-4 flex items-center">
        <input type="range" min="-5" max="5" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-300 hover:[&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:transition-colors" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-2 bg-slate-200 pointer-events-none" />
      </div>
      <div className={clsx("w-6 text-right text-xs font-mono font-medium", value > 0 ? "text-blue-600" : value < 0 ? "text-red-500" : "text-slate-300")}>
        {value > 0 ? `+${value}` : value}
      </div>
    </div>
  );
};

export const MindTab = () => {
  const [promptText] = useState("Điều gì quan trọng nhất lúc này?");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState(0);
  const [impacts, setImpacts] = useState({ vision: 0, identity: 0, year: 0, month: 0 });
  
  const [isTaskMode, setIsTaskMode] = useState(false);
  const [taskConfig, setTaskConfig] = useState({
    urgent: false, important: false,
    frequency: 'ONCE' as any, target: 1, unit: 'Lần', repeat_days: [] as number[]
  });

  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  const focusList = useLiveQuery(() => db.entries.where('is_focus').equals(1).toArray());

  const handleSave = async () => {
    if (!content.trim()) return;
    await db.entries.add({
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
      feeling,
      impact_vision: impacts.vision, impact_identity: impacts.identity,
      impact_year: impacts.year, impact_month: impacts.month,
      is_task: isTaskMode,
      status: 'ACTIVE',
      is_focus: false,
      urgent: taskConfig.urgent, important: taskConfig.important,
      target_value: taskConfig.target, target_unit: taskConfig.unit,
      frequency: taskConfig.frequency, repeat_days: taskConfig.repeat_days
    });
    setContent(''); setFeeling(0); setImpacts({vision:0, identity:0, year:0, month:0});
    setIsTaskMode(false); setIsFocused(false);
    textareaRef.current?.blur();
  };

  const handleCompleteFocus = async (item: any) => {
    await db.entries.update(item.id, { status: 'COMPLETED', is_focus: false, completed_at: new Date().toISOString() });
    await db.activity_logs.add({ entry_id: item.id, action_type: 'TASK_DONE', created_at: new Date().toISOString() });
    setActiveFocusId(null);
  };

  const handleCancelFocus = async (item: any) => {
    await db.entries.update(item.id, { is_focus: false });
    setActiveFocusId(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-4 pb-32">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className={clsx("transition-all duration-500 ease-in-out px-1", isFocused ? "opacity-30 blur-[1px]" : "opacity-100")}>
           <h1 className="text-lg font-medium text-slate-500 tracking-tight">{promptText}</h1>
        </div>

        <div className={clsx("relative bg-white rounded-lg border transition-all duration-300 ease-out overflow-hidden z-20", (isFocused || content) ? "border-slate-300 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] ring-1 ring-slate-100" : "border-slate-200 hover:border-slate-300")}>
            <textarea ref={textareaRef} onFocus={() => setIsFocused(true)}
                className="w-full min-h-[64px] p-5 text-[16px] text-slate-800 placeholder:text-slate-300 bg-transparent border-none outline-none resize-none leading-relaxed font-normal"
                placeholder="Ghi nhanh suy nghĩ..." value={content} onChange={e => setContent(e.target.value)}
                style={{ minHeight: (isFocused || content) ? '100px' : '64px' }}
            />
            <div className={clsx("bg-slate-50/40 border-t border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden", (isFocused || content) ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="px-5 py-4 space-y-1">
                    <LinearSlider label="Cảm giác" icon={Eye} value={feeling} onChange={setFeeling} />
                    <div className="h-px bg-slate-200/50 my-2 w-full" />
                    <LinearSlider label="Vision" icon={Target} value={impacts.vision} onChange={v => setImpacts({...impacts, vision: v})} />
                    <LinearSlider label="Identity" icon={Fingerprint} value={impacts.identity} onChange={v => setImpacts({...impacts, identity: v})} />
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="px-3 py-2 bg-white flex items-center justify-between">
                    <button onClick={() => setIsTaskMode(!isTaskMode)} className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-colors border", isTaskMode ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-transparent border-transparent text-slate-400 hover:bg-slate-50")}>
                        <Zap size={14} fill={isTaskMode ? "currentColor" : "none"} /> Task
                    </button>
                    <div className="flex items-center gap-2">
                         {content.trim() && <button onClick={() => { setIsFocused(false); textareaRef.current?.blur(); }} className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600">Đóng</button>}
                         <button onClick={handleSave} disabled={!content.trim()} className={clsx("h-8 px-4 rounded-md text-xs font-semibold flex items-center gap-2 transition-all shadow-sm", content.trim() ? "bg-[#2563EB] text-white hover:bg-blue-700 active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed")}>
                            <span>Lưu</span><ArrowRight size={14} strokeWidth={2} />
                        </button>
                    </div>
                </div>
                {isTaskMode && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-4 animate-in slide-in-from-top-2">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={taskConfig.urgent} onChange={e => setTaskConfig({...taskConfig, urgent: e.target.checked})} className="accent-blue-600 w-3.5 h-3.5" /> Gấp</label>
                        <div className="h-4 w-px bg-slate-200" />
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={taskConfig.important} onChange={e => setTaskConfig({...taskConfig, important: e.target.checked})} className="accent-blue-600 w-3.5 h-3.5" /> Quan trọng</label>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                             <Calendar size={12} className="text-slate-400" />
                             <select value={taskConfig.frequency} onChange={e => setTaskConfig({...taskConfig, frequency: e.target.value as any})} className="bg-transparent outline-none font-medium cursor-pointer">
                                <option value="ONCE">Một lần</option><option value="DAILY">Hàng ngày</option>
                             </select>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className={clsx("transition-all duration-500 ease-in-out", (isFocused || content) ? "opacity-20 blur-[2px] pointer-events-none" : "opacity-100")}>
            <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiêu điểm</h3>
            </div>
            <div className="space-y-0">
               {(!focusList || focusList.length === 0) && <div className="p-6 border border-dashed border-slate-200 rounded-lg text-center"><p className="text-xs text-slate-400 italic">Chưa có tiêu điểm nào.</p></div>}
               {focusList?.map(item => {
                   const isActive = activeFocusId === item.id;
                   return (
                       <div key={item.id} className={clsx("group rounded-md border bg-white overflow-hidden transition-all mb-2", isActive ? "border-blue-300 ring-1 ring-blue-100 shadow-sm" : "border-slate-200 hover:border-slate-300")}>
                           <div onClick={() => setActiveFocusId(isActive ? null : item.id)} className="flex items-center gap-3 p-3 cursor-pointer select-none">
                               <div className={clsx("transition-colors", isActive ? "text-blue-600" : "text-slate-300 group-hover:text-slate-400")}><Circle size={18} strokeWidth={2} /></div>
                               <span className={clsx("flex-1 text-[13px] font-medium leading-snug", isActive ? "text-slate-900" : "text-slate-600")}>{item.content}</span>
                               {item.streak_current > 0 && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 rounded">🔥 {item.streak_current}</span>}
                           </div>
                           {isActive && (
                               <div className="flex items-center justify-between px-3 pb-3 pt-0 bg-white animate-in slide-in-from-top-1">
                                    <span className="text-[10px] text-slate-400">Hành động:</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleCancelFocus(item)} className="px-3 py-1.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">Hủy bỏ</button>
                                        <button onClick={() => handleCompleteFocus(item)} className="px-3 py-1.5 rounded bg-[#2563EB] text-white text-[11px] font-medium hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-colors"><Check size={12} strokeWidth={3} /> Hoàn thành</button>
                                    </div>
                               </div>
                           )}
                       </div>
                   );
               })}
            </div>
        </div>
      </div>
    </div>
  );
};