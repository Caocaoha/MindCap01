import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Scale, Repeat, CalendarDays, Smile, FileText } from 'lucide-react';
import { Entry, Frequency } from '../../utils/db';

interface QuickEditModalProps {
  task: Entry;
  onSave: (updates: Partial<Entry>) => void;
  onClose: () => void;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({ task, onSave, onClose }) => {
  // State chung
  const [content, setContent] = useState(task.content);
  
  // State cho Task
  const [qty, setQty] = useState(task.quantity);
  const [unit, setUnit] = useState(task.unit);
  const [freq, setFreq] = useState<Frequency>(task.frequency);
  const [freqDetail, setFreqDetail] = useState(task.frequency_detail || '');
  
  // State cho Mood
  const [moodScore, setMoodScore] = useState(task.mood_score);

  // Helper toggle ngày trong tuần
  const toggleWeekDay = (day: string) => {
    let current = freqDetail ? freqDetail.split(',') : [];
    if (current.includes(day)) current = current.filter(d => d !== day);
    else current = [...current, day].sort();
    setFreqDetail(current.join(','));
  };

  const handleSave = () => {
    const updates: Partial<Entry> = { content }; // Luôn cho sửa nội dung
    
    if (task.is_task) {
        updates.quantity = Number(qty);
        updates.unit = unit;
        updates.frequency = freq;
        updates.frequency_detail = freqDetail;
    } else {
        updates.mood_score = moodScore;
        // Map lại mood string từ score
        if (moodScore === 2) updates.mood = 'v-positive';
        else if (moodScore === 1) updates.mood = 'positive';
        else if (moodScore === -1) updates.mood = 'negative';
        else if (moodScore === -2) updates.mood = 'v-negative';
        else updates.mood = 'neutral';
    }
    onSave(updates);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {task.is_task ? <Scale size={20} className="text-blue-500"/> : <Smile size={20} className="text-purple-500"/>}
            Sửa nhanh
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={18}/></button>
        </div>

        <div className="space-y-6">
          {/* 1. SỬA NỘI DUNG TEXT (CHUNG CHO CẢ 2) */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><FileText size={12}/> Nội dung</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 ring-blue-200 resize-none h-20"/>
          </div>

          {/* 2. GIAO DIỆN RIÊNG CHO TASK */}
          {task.is_task && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Scale size={12}/> Định lượng</label>
                <div className="flex gap-2">
                  <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-20 p-3 bg-slate-50 rounded-xl font-bold text-center text-slate-800 outline-none focus:ring-2 ring-blue-200"/>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1 p-3 bg-slate-50 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 ring-blue-200" placeholder="Đơn vị"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Repeat size={12}/> Tần suất</label>
                <select value={freq} onChange={(e) => { setFreq(e.target.value as Frequency); setFreqDetail(''); }} className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 ring-blue-200 appearance-none mb-3">
                  <option value="once">Một lần (Không lặp)</option>
                  <option value="daily">Mỗi ngày</option>
                  <option value="weekly">Hàng tuần</option>
                  <option value="monthly">Hàng tháng</option>
                </select>

                {/* TÙY CHỌN NÂNG CAO */}
                {freq === 'weekly' && (
                   <div className="flex justify-between gap-1">
                      {['2','3','4','5','6','7','CN'].map(d => (
                          <button key={d} onClick={() => toggleWeekDay(d)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${freqDetail.includes(d) ? 'bg-blue-600 text-white shadow-md scale-110' : 'bg-slate-100 text-slate-400'}`}>{d}</button>
                      ))}
                   </div>
                )}

                {freq === 'monthly' && (
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <CalendarDays size={18} className="text-slate-400"/>
                        <input type="text" value={freqDetail} onChange={(e) => setFreqDetail(e.target.value)} placeholder="Nhập ngày (vd: 1, 15, 30)" className="bg-transparent w-full outline-none text-sm font-medium"/>
                    </div>
                )}
              </div>
            </>
          )}

          {/* 3. GIAO DIỆN RIÊNG CHO MOOD */}
          {!task.is_task && (
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Smile size={12}/> Mức độ cảm xúc ({moodScore})</label>
                <input type="range" min="-2" max="2" step="1" value={moodScore} onChange={(e) => setMoodScore(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
                <div className="flex justify-between text-xl mt-2 px-1">
                    <span onClick={() => setMoodScore(-2)} className="cursor-pointer grayscale hover:grayscale-0 transition-all">😫</span>
                    <span onClick={() => setMoodScore(-1)} className="cursor-pointer grayscale hover:grayscale-0 transition-all">😔</span>
                    <span onClick={() => setMoodScore(0)} className="cursor-pointer grayscale hover:grayscale-0 transition-all">😐</span>
                    <span onClick={() => setMoodScore(1)} className="cursor-pointer grayscale hover:grayscale-0 transition-all">😃</span>
                    <span onClick={() => setMoodScore(2)} className="cursor-pointer grayscale hover:grayscale-0 transition-all">🤩</span>
                </div>
             </div>
          )}
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all shadow-lg">
          <Save size={18}/> Cập nhật
        </button>
      </motion.div>
    </div>
  );
};
export default QuickEditModal;