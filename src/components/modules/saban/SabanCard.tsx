// src/components/modules/saban/SabanCard.tsx
import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Edit2, Trash2, Target } from 'lucide-react';
import { db } from '../../../database/db';

interface Props {
  item: any;
  onEdit: (item: any) => void;
  onSwipeSuccess: (item: any) => void;
}

export const SabanCard = ({ item, onEdit, onSwipeSuccess }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Logic gạt phải + chéo xuống (x > 100, y > 20)
    if (info.offset.x > 100 && info.offset.y > 20) {
      onSwipeSuccess(item);
    }
  };

  const deleteItem = async () => {
    if (confirm('Xóa task này?')) {
      await db.table('entities').delete(item.uuid);
    }
  };

  return (
    <motion.div 
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 150 }}
      onDragEnd={handleDragEnd}
      className="relative mb-3 group"
    >
      {/* Background Action Hint */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center px-4 -z-10">
        <Target className="text-blue-500 animate-pulse" size={20} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div className="flex-1">
          <h4 className={`text-slate-800 font-medium ${item.status === 'completed' ? 'line-through opacity-50' : ''}`}>
            {item.content}
          </h4>
          
          {/* 1) Hiển thị tiến độ (Số thực hiện/Số mục tiêu) */}
          {item.quantity && item.quantity > 1 && (
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400" 
                  style={{ width: `${(item.currentQty || 0) / item.quantity * 100}%` }}
                />
              </div>
              {item.currentQty || 0}/{item.quantity} {item.unit}
            </div>
          )}
        </div>

        {/* 2) Chức năng Sửa & Hủy */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(item)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
            <Edit2 size={16} />
          </button>
          <button onClick={deleteItem} className="p-1 hover:bg-red-50 rounded text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};