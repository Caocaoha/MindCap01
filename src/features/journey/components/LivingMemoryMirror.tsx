// src/features/journey/components/LivingMemoryMirror.tsx
import React, { useState } from 'react';
import { calculateOpacity } from '../utils';

export const LivingMemoryMirror = ({ entries }) => {
  // Lưu ID của dòng đang được hover và danh sách liên kết của nó
  const [activeContext, setActiveContext] = useState<{ id: string, links: string[] } | null>(null);

  return (
    <div className="flex flex-col gap-4 p-6">
      {entries.map((item) => {
        // 1. Tính opacity tự nhiên dựa trên Entropy Shield
        const baseOpacity = calculateOpacity(item);
        
        // 2. Xác định trạng thái trong "Sợi chỉ đỏ"
        let finalOpacity = baseOpacity;
        let isHighlighted = false;

        if (activeContext) {
          const isCurrent = activeContext.id === item.id;
          const isLinked = activeContext.links.includes(item.id);
          
          if (isCurrent || isLinked) {
            finalOpacity = 1.0; // Sáng rực nếu liên quan
            isHighlighted = true;
          } else {
            finalOpacity = 0.1; // Mờ hẳn nếu không liên quan
          }
        }

        return (
          <div
            key={item.id}
            onMouseEnter={() => setActiveContext({ id: item.id, links: item.body.linkedIds || [] })}
            onMouseLeave={() => setActiveContext(null)}
            style={{ opacity: finalOpacity }}
            className={`transition-all duration-300 ease-out border-l-2 ${
              isHighlighted ? 'border-indigo-500 pl-4' : 'border-transparent'
            }`}
          >
            {/* Component hiển thị nội dung dòng - EntryRow */}
            <div className="py-2">
               <p className="text-slate-800">{item.content}</p>
               <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};