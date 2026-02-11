// src/components/Input/QuickEditModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, CheckCircle } from 'lucide-react';

interface QuickEditModalProps {
  isOpen: boolean;
  type: 'task' | 'thought'; // Context-aware
  initialData: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  isOpen, type, initialData, onClose, onSave
}) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }}
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {type === 'task' ? 'Edit Task' : 'Edit Mood'}
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content Input */}
        <input 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full text-lg p-3 bg-slate-50 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* CONTEXT AWARE UI */}
        {type === 'task' ? (
          <div className="space-y-4">
            {/* Frequency Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-1 text-sm rounded-md transition-all ${frequency === 'weekly' ? 'bg-white shadow-sm' : ''}`}
              >Weekly</button>
              <button 
                onClick={() => setFrequency('monthly')}
                className={`flex-1 py-1 text-sm rounded-md transition-all ${frequency === 'monthly' ? 'bg-white shadow-sm' : ''}`}
              >Monthly</button>
            </div>

            {/* Weekly Selector (T2-CN) */}
            {frequency === 'weekly' && (
              <div className="flex justify-between">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <button key={i} className="w-8 h-8 rounded-full bg-slate-200 text-xs font-bold hover:bg-blue-100 hover:text-blue-600">
                    {day}
                  </button>
                ))}
              </div>
            )}
             {/* Monthly Grid (Simply 1-10 for demo) */}
             {frequency === 'monthly' && (
               <div className="grid grid-cols-7 gap-1">
                 {Array.from({length: 10}).map((_, i) => (
                   <div key={i} className="aspect-square flex items-center justify-center bg-slate-50 rounded text-xs">{i+1}</div>
                 ))}
                 <span className="text-xs text-slate-400 col-span-7 text-center">... (Full grid implemented later)</span>
               </div>
             )}
          </div>
        ) : (
          /* Mood Selector */
          <div className="flex justify-around py-4">
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500">
              <div className="p-3 bg-slate-100 rounded-full text-2xl">😭</div>
              <span className="text-xs">Sad</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-purple-500">
              <div className="p-3 bg-slate-100 rounded-full text-2xl">😐</div>
              <span className="text-xs">Neutral</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-green-500">
              <div className="p-3 bg-slate-100 rounded-full text-2xl">😍</div>
              <span className="text-xs">Happy</span>
            </button>
          </div>
        )}

        <button 
          onClick={() => onSave({ content })} // Demo save
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform"
        >
          Save Changes
        </button>
      </motion.div>
    </div>
  );
};