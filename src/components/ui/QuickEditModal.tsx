import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Scale, Repeat } from 'lucide-react';
import { Entry, Frequency } from '../../utils/db';

interface QuickEditModalProps {
  task: Entry;
  onSave: (updates: Partial<Entry>) => void;
  onClose: () => void;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({ task, onSave, onClose }) => {
  const [qty, setQty] = useState(task.quantity);
  const [unit, setUnit] = useState(task.unit);
  const [freq, setFreq] = useState<Frequency>(task.frequency);

  const handleSave = () => {
    onSave({
      quantity: Number(qty),
      unit: unit,
      frequency: freq
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 text-lg">Sửa nhanh</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          {/* Số lượng & Đơn vị */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Scale size={12}/> Định lượng</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(Number(e.target.value))} 
                className="w-20 p-3 bg-slate-50 rounded-xl font-bold text-center text-slate-800 outline-none focus:ring-2 ring-blue-200"
              />
              <input 
                type="text" 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)} 
                className="flex-1 p-3 bg-slate-50 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 ring-blue-200"
                placeholder="Đơn vị (km, lần...)"
              />
            </div>
          </div>

          {/* Tần suất */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Repeat size={12}/> Tần suất</label>
            <select 
              value={freq} 
              onChange={(e) => setFreq(e.target.value as Frequency)}
              className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 ring-blue-200 appearance-none"
            >
              <option value="once">Một lần (Không lặp)</option>
              <option value="daily">Mỗi ngày</option>
              <option value="weekly">Mỗi tuần</option>
              <option value="monthly">Mỗi tháng</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-6 bg-blue-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Save size={18}/> Cập nhật
        </button>
      </motion.div>
    </div>
  );
};

export default QuickEditModal;