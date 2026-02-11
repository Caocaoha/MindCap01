// src/components/modules/saban/QuickEditModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Target, BarChart2 } from 'lucide-react';
import { db } from '../../../database/db';

interface Props {
  item: any;
  onClose: () => void;
}

export const QuickEditModal = ({ item, onClose }: Props) => {
  const [formData, setFormData] = useState({
    content: item.content,
    priority: item.priority || 'normal',
    quantity: item.quantity || 0,
    unit: item.unit || ''
  });

  const handleSave = async () => {
    await db.table('entities').update(item.uuid, {
      ...formData,
      updatedAt: Date.now() // Trigger EchoObserver sau 4 phút
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Edit</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nội dung nhiệm vụ</label>
            <input 
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full text-lg font-medium text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-2 transition-colors"
              placeholder="Bạn đang nghĩ gì?"
            />
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {['critical', 'urgent', 'important', 'normal'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFormData({...formData, priority: p})}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    formData.priority === p 
                    ? 'bg-slate-800 text-white shadow-lg scale-105' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Target size={12} /> Mục tiêu (Qty)
              </label>
              <input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 ring-blue-500/20 font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <BarChart2 size={12} /> Đơn vị (Unit)
              </label>
              <input 
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                placeholder="vd: trang, km, m..."
              />
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Save size={20} />
            LƯU THAY ĐỔI
          </button>
        </div>
      </motion.div>
    </div>
  );
};