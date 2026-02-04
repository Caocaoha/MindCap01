import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks'; // Import thêm để lấy dữ liệu
import { db, Entry } from '../db';
import { usePrompts } from '../hooks/usePrompts';
import { getDateMetadata } from '../utils/date';
import { v4 as uuidv4 } from 'uuid';
import { Send, CheckCircle2, Circle, Zap, Square, X } from 'lucide-react'; // Thêm icon

export const MindTab = () => {
  const [content, setContent] = useState('');
  const [isTask, setIsTask] = useState(false);
  
  const { currentPrompt, refreshPrompt } = usePrompts();
  const dateMeta = getDateMetadata();

  // 1. LẤY DỮ LIỆU TIÊU ĐIỂM (FOCUS)
  // Chỉ lấy những việc đang Active + Đang Focus
  const focusList = useLiveQuery(async () => {
    const entries = await db.entries.toArray();
    return entries
      .filter(e => e.status === 'active' && !!e.is_focus)
      .sort((a, b) => a.created_at - b.created_at);
  }, [], [] as Entry[]);

  // 2. HANDLERS CHO NHẬP LIỆU
  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await db.entries.add({
        id: uuidv4(),
        content: content.trim(),
        created_at: Date.now(),
        date_str: new Date().toISOString().split('T')[0],
        type: 'text',
        is_task: isTask,
        is_focus: false, // Mặc định vào Kho (Todo), không vào Focus ngay
        status: isTask ? 'active' : undefined,
      });
      setContent('');
      setIsTask(false);
      refreshPrompt(); 
    } catch (error) { console.error(error); }
  };

  // 3. HANDLERS CHO TIÊU ĐIỂM (XỬ LÝ VIỆC)
  const handleCompleteFocus = async (id: string) => {
    // Xong việc -> Lưu vào lịch sử (completed) -> Biến mất khỏi Tâm trí
    await db.entries.update(id, { 
      status: 'completed', 
      is_focus: false,
      completed_at: Date.now() 
    });
    db.activity_logs.add({ id: crypto.randomUUID(), created_at: Date.now(), action_type: 'TASK_DONE', entry_id: id });
  };

  const handleDemoteToInbox = async (id: string) => {
    // Chưa làm -> Đá về Kho (Todo) -> Biến mất khỏi Tâm trí
    await db.entries.update(id, { 
      is_focus: false,
      created_at: Date.now() // Reset time để nhảy lên đầu Kho
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* PHẦN 1: HEADER & INPUT (GIỮ NGUYÊN) */}
      <div className="flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-3xl font-serif font-bold text-slate-900">{dateMeta.dayOfWeek}</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide">{dateMeta.fullDate}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium text-slate-800 leading-relaxed">{currentPrompt}</h3>
        </div>

        <div className="w-full space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chạm để viết..."
            className="w-full bg-transparent text-lg text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none min-h-[80px]"
          />
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsTask(!isTask)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                ${isTask ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              {isTask ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>{isTask ? 'Biến thành Hành động' : 'Chỉ là suy nghĩ'}</span>
            </button>
            <button onClick={handleSubmit} disabled={!content.trim()} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* PHẦN 2: TIÊU ĐIỂM (CHUYỂN NHÀ TỪ TODO SANG ĐÂY) */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-4 border-t border-dashed border-slate-200">
        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap size={14} fill="currentColor" /> Đang xử lý ({focusList?.length || 0}/4)
        </h3>
        
        {(!focusList || focusList.length === 0) ? (
          <p className="text-sm text-slate-400 italic text-center mt-8">
            Tâm trí đang thảnh thơi...<br/>Hãy sang Kho việc để chọn việc cần làm.
          </p>
        ) : (
          <div className="space-y-3">
            {focusList.map(task => (
              <div key={task.id} className="bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-100 p-4 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                {/* Nút Check: Hoàn thành ngay tại đây */}
                <button 
                  onClick={() => handleCompleteFocus(task.id)} 
                  className="mt-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                  title="Đã làm xong"
                >
                  <Square size={22} strokeWidth={2} />
                </button>
                
                <p className="flex-1 text-base font-medium text-slate-800 leading-snug">
                  {task.content}
                </p>

                {/* Nút X: Trả về kho */}
                <button 
                  onClick={() => handleDemoteToInbox(task.id)} 
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Để sau làm"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};