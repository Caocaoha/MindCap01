import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { usePrompts } from '../hooks/usePrompts';
import { getDateMetadata } from '../utils/date'; // Import Helper
import { v4 as uuidv4 } from 'uuid';
import { 
  Send, Target, Zap, Eye, Fingerprint, 
  CheckCircle2, Circle 
} from 'lucide-react';

// --- Helper Component: Slider (Giữ nguyên) ---
const MetricSlider = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="flex items-center justify-between py-3 group animate-in fade-in slide-in-from-bottom-2">
    <div className="flex items-center gap-3 text-slate-500">
      <Icon size={16} strokeWidth={1.5} />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-slate-400 w-4 text-right">{value}</span>
      <input 
        type="range" min="-5" max="5" step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
      />
    </div>
  </div>
);

export const MindTab = () => {
  const { activeQuestion } = usePrompts();
  
  // Refs để xử lý Click Outside
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [metrics, setMetrics] = useState({ feeling: 0, vision: 0, identity: 0 });
  const [isTask, setIsTask] = useState(false);

  // Data Query
  const focusList = useLiveQuery(() => 
    db.entries.where('is_focus').equals(1).filter(e => e.status !== 'completed').toArray()
  );

  // --- LOGIC 1: CLICK OUTSIDE (Tự động đóng) ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Nếu click nằm NGOÀI containerRef thì tắt Focus
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Chỉ đóng nếu nội dung trống (để tránh mất bài đang viết dở) 
        // Hoặc người dùng chấp nhận việc đóng này như hành động "Hủy focus"
        if (!content.trim()) {
             setIsFocused(false);
        }
        // Nếu có nội dung, ta vẫn giữ focus hoặc có thể chọn đóng Action Bar thôi. 
        // Ở đây tôi chọn đóng Action Bar nhưng giữ text để trải nghiệm mượt.
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [content]);

  // --- LOGIC 2: SAVE WITH HELPER ---
  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      const now = new Date();
      // Sử dụng Helper đã tách [Data Fix]
      const timeData = getDateMetadata(now); 

      await db.entries.add({
        id: uuidv4(),
        content: content.trim(),
        created_at: timeData.timestamp,
        
        // Metrics từ state object
        feeling: metrics.feeling,
        vision: metrics.vision,
        identity: metrics.identity,
        
        // Time logic từ Helper
        year: timeData.year,
        month: timeData.month,
        date_str: timeData.date_str,

        // Task Config
        is_task: isTask,
        status: 'active',
        is_focus: false,
      });

      // Reset Sạch sẽ
      setContent('');
      setMetrics({ feeling: 0, vision: 0, identity: 0 });
      setIsTask(false);
      setIsFocused(false); // Đóng Action Bar ngay lập tức
      
    } catch (error) {
      console.error("Lỗi lưu:", error);
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col transition-all duration-500 ease-out ${isFocused ? 'gap-2' : 'gap-6'}`}>
      
      {/* INPUT AREA */}
      <div className="relative group">
        
        {/* Save Button: Bay từ góc phải vào */}
        <button 
          onClick={handleSave}
          disabled={!content.trim()}
          className={`absolute right-0 top-0 z-10 p-2 text-blue-600 bg-blue-50 rounded-md transition-all duration-300
            ${isFocused && content.trim() ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-90 pointer-events-none'}`}
        >
          <Send size={18} strokeWidth={2.5} />
        </button>

        {/* Prompt: Mờ đi khi focus [cite: 15] */}
        <div className={`transition-all duration-500 mb-2 ${isFocused ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
          <h2 className="text-slate-400 font-medium text-sm select-none">
            {activeQuestion || "Tâm trí bạn đang ở đâu?"}
          </h2>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isFocused ? "Viết đi, đừng ngại..." : "Chạm để viết..."}
          className={`w-full bg-transparent text-lg text-slate-800 placeholder:text-slate-300 resize-none outline-none transition-all duration-300
            ${isFocused ? 'min-h-[120px]' : 'min-h-[60px]'}`}
        />
        
        {/* Task Toggle */}
        <div className={`transition-all duration-300 origin-top ${isFocused ? 'opacity-100 max-h-12 mt-2' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <button 
                onClick={() => setIsTask(!isTask)}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border transition-all
                    ${isTask ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
                {isTask ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {isTask ? "Biến thành Hành động" : "Chỉ là Suy nghĩ"}
            </button>
        </div>
      </div>

      {/* ACTION BAR: Trượt ra khi focus [cite: 16] */}
      {/* Sửa logic: Không còn nút đóng thủ công */}
      {isFocused && (
        <div className="pt-4 border-t border-slate-100 space-y-1">
            <MetricSlider 
                icon={Zap} label="Năng lượng" value={metrics.feeling} 
                onChange={(v: number) => setMetrics({...metrics, feeling: v})} 
            />
            <MetricSlider 
                icon={Eye} label="Tầm nhìn" value={metrics.vision} 
                onChange={(v: number) => setMetrics({...metrics, vision: v})} 
            />
            <MetricSlider 
                icon={Fingerprint} label="Bản sắc" value={metrics.identity} 
                onChange={(v: number) => setMetrics({...metrics, identity: v})} 
            />
        </div>
      )}

      {/* FOCUS LIST: Mờ đi khi focus [cite: 14] */}
      <div className={`transition-all duration-500 delay-100 ${isFocused ? 'opacity-20 blur-[1px] grayscale' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-3 mt-4">
          <Target size={14} className="text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tiêu điểm</span>
        </div>
        
        {focusList?.length === 0 ? (
           <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg">
             <span className="text-slate-300 text-sm">Chưa có tiêu điểm hôm nay</span>
           </div>
        ) : (
          <div className="space-y-2">
            {focusList?.map(task => (
              <div key={task.id} className="flex items-start gap-3 py-2 px-1 border-b border-slate-50 last:border-0">
                <div className="mt-1 w-3 h-3 rounded-full border border-slate-300" />
                <span className="text-slate-600 text-sm leading-snug">{task.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};