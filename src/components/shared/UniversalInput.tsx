import React, { useState, useEffect, useRef } from 'react';
import { X, Check, type, Hash, ArrowUpRight, Link as LinkIcon } from 'lucide-react';
import { db } from '../../core/db'; // Đảm bảo đường dẫn đúng tới DB instance
import { v4 as uuidv4 } from 'uuid';

export type InputMode = 'create' | 'edit';

export interface InputData {
  id?: string;
  content: string;
  type: 'task' | 'thought';
  tags: string[];
  projectId?: string;
  parentRef?: string; // ID của bản ghi cha nếu đang dùng chế độ Build
}

interface UniversalInputProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: InputMode;
  initialData?: Partial<InputData>; // Dữ liệu đầu vào (nếu Edit hoặc Build)
  onSuccess?: () => void; // Callback sau khi lưu xong (để refresh data nếu cần)
}

export const UniversalInput: React.FC<UniversalInputProps> = ({
  isOpen,
  onClose,
  mode = 'create',
  initialData,
  onSuccess
}) => {
  // --- STATE ---
  const [content, setContent] = useState('');
  const [type, setType] = useState<'task' | 'thought'>('thought');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setContent(initialData.content || '');
        setType(initialData.type || 'thought');
        setTags(initialData.tags || []);
      } else {
        // Reset form if opening fresh
        setContent('');
        setType('thought');
        setTags([]);
      }
      // Auto-focus
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialData]);

  // --- HANDLER: SAVE ---
  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);

    try {
      const timestamp = Date.now();

      if (mode === 'edit' && initialData?.id) {
        // --- LOGIC EDIT (Cập nhật) ---
        const table = type === 'task' ? db.tasks : db.thoughts;
        
        // Lưu ý: Nếu user đổi type từ Task -> Thought lúc edit, logic sẽ phức tạp hơn. 
        // Ở đây ta giả định user không đổi type khi edit để đơn giản, hoặc update bảng tương ứng.
        await table.update(initialData.id, {
          content,
          tags,
          // Không update createdAt để giữ lịch sử
          // Nếu là task, giữ nguyên status
        });
      } else {
        // --- LOGIC CREATE / BUILD (Tạo mới) ---
        const newEntry = {
          id: uuidv4(),
          content,
          tags,
          createdAt: timestamp,
          projectId: initialData?.projectId || undefined,
          // Nếu là Build mode, gắn link cha vào relatedIds (nếu schema hỗ trợ)
          relatedIds: initialData?.parentRef ? [initialData.parentRef] : [], 
          isBookmarked: false,
          ...(type === 'task' ? { status: 'active', priority: 'normal' } : {})
        };

        if (type === 'task') {
          await db.tasks.add(newEntry as any);
        } else {
          await db.thoughts.add(newEntry as any);
        }
      }

      // Xong phim
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Lỗi khi lưu. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setTags([]);
    onClose();
  };

  const toggleType = () => setType(prev => prev === 'task' ? 'thought' : 'task');

  // --- RENDER ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
             {/* Type Toggle */}
             <button 
               onClick={mode === 'edit' ? undefined : toggleType} // Không cho đổi type khi Edit để tránh lỗi DB
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 ${type === 'task' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}
                 ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}
               `}
             >
               {type === 'task' ? <Check className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
               <span className="uppercase tracking-wider">{type}</span>
             </button>

             {/* Context Badge (Nếu đang Build từ cha) */}
             {initialData?.parentRef && (
               <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-xs text-slate-400">
                 <LinkIcon className="w-3 h-3" />
                 <span>Linked</span>
               </div>
             )}
          </div>

          <button onClick={handleClose} className="p-2 text-slate-500 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'build' ? "Phát triển ý tưởng từ đây..." : "Đang nghĩ gì..."}
            className="w-full h-40 bg-transparent text-xl text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSave();
              }
            }}
          />
          
          {/* Tags Input (Giả lập đơn giản) */}
          <div className="flex items-center gap-2 mt-4 text-slate-500">
            <Hash className="w-4 h-4" />
            <input 
              type="text" 
              placeholder="Add tags (space separated)..."
              className="bg-transparent text-sm focus:outline-none text-slate-300 w-full"
              value={tags.join(' ')}
              onChange={(e) => setTags(e.target.value.split(' ').filter(t => t))}
            />
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all
              ${type === 'task' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSaving ? 'Saving...' : (
              <>
                <span>{mode === 'create' ? 'Capture' : mode === 'build' ? 'Derive' : 'Update'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};