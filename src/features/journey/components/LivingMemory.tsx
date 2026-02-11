import React, { useState } from 'react';
import { JourneyEntry } from '../types';
import { Book, Edit2, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface LivingMemoryProps {
  entries: JourneyEntry[];
  onToggleBookmark: (id: string, type: any) => void;
  onEdit: (entry: JourneyEntry) => void;
  onBuild: (parentEntry: JourneyEntry) => void;
}

export const LivingMemory: React.FC<LivingMemoryProps> = ({ 
  entries, 
  onToggleBookmark,
  onEdit,
  onBuild
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Tìm danh sách ID liên quan để highlight
  const relatedIds = hoveredId 
    ? entries.find(e => e.id === hoveredId)?.relatedIds || []
    : [];

  return (
    <div className="space-y-4 pb-20">
      {entries.map((entry) => {
        // Logic Echo Context (Flashlight)
        const isDimmed = hoveredId && hoveredId !== entry.id && !relatedIds.includes(entry.id);
        const isHighlighted = hoveredId && (hoveredId === entry.id || relatedIds.includes(entry.id));

        return (
          <div
            key={entry.id}
            onMouseEnter={() => setHoveredId(entry.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ opacity: isDimmed ? 0.1 : entry.opacity }} // Entropy + Echo Effect
            className={`
              group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300
              ${isHighlighted ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg scale-[1.01]' : 'bg-transparent border-transparent hover:bg-slate-800/30'}
              ${entry.isBookmarked ? 'border-yellow-500/20 bg-yellow-500/5' : ''}
            `}
          >
            {/* Left: Time & Icon */}
            <div className="flex flex-col items-center gap-2 min-w-[60px] pt-1">
               <span className="text-xs font-mono text-slate-500">
                 {format(entry.createdAt, 'HH:mm')}
               </span>
               <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'task' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            </div>

            {/* Middle: Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{entry.type}</span>
                 <span className="text-xs text-slate-600">• {format(entry.createdAt, 'dd/MM/yyyy', { locale: vi })}</span>
              </div>
              <p className={`text-base text-slate-200 ${entry.isBookmarked ? 'font-medium text-yellow-100' : ''}`}>
                {entry.content}
              </p>
              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {entry.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Action Bar (3 Icons) - Only show on Hover or if Bookmarked */}
            <div className={`
              flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
              ${entry.isBookmarked ? 'opacity-100' : ''}
            `}>
              {/* 1. Bookmark */}
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleBookmark(entry.id, entry.type); }}
                className={`p-2 rounded-lg transition-colors ${entry.isBookmarked ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-yellow-400 hover:bg-slate-800'}`}
                title="Gieo hạt (Lưu giữ)"
              >
                <Book className="w-4 h-4" fill={entry.isBookmarked ? "currentColor" : "none"} />
              </button>

              {/* 2. Edit */}
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Sửa chữa ký ức"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* 3. Build */}
              <button 
                onClick={(e) => { e.stopPropagation(); onBuild(entry); }}
                className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Nảy mầm (Tạo mới từ đây)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
      
      {entries.length === 0 && (
        <div className="text-center py-20 text-slate-600">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Chưa có ký ức nào trôi về đây.</p>
          <p className="text-sm">Hãy hoàn thành việc hôm nay, ngày mai chúng sẽ xuất hiện.</p>
        </div>
      )}
    </div>
  );
};