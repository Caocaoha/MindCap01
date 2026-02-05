import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Search, Trash2, Calendar, CheckCircle2, Smile, Frown, Meh, Pencil, Save, X } from 'lucide-react';
import { db, type Entry } from '../utils/db';
import { getDateString } from '../utils/date';

const History: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchHistory = async () => {
    try {
      const todayStr = getDateString();
      const allData = await db.entries.toArray();

      // LOGIC LỌC DỮ LIỆU:
      // 1. Lấy tất cả Mood (is_task === false)
      // 2. Lấy Task ĐÃ XONG nhưng PHẢI LÀ NGÀY CŨ (date_str !== todayStr)
      const filtered = allData.filter(item => {
        if (!item.is_task) return true; // Mood lấy hết
        return item.status === 'completed' && item.date_str !== todayStr; // Task lấy cũ
      });

      setEntries(filtered.sort((a, b) => b.created_at - a.created_at));
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Xóa vĩnh viễn?")) {
      await db.entries.delete(id);
      fetchHistory();
    }
  };

  const startEdit = (item: Entry) => {
    setEditingId(item.id!);
    setEditContent(item.content);
  };

  const saveEdit = async (id: number) => {
    if (!editContent.trim()) return;
    await db.entries.update(id, { content: editContent });
    setEditingId(null);
    fetchHistory();
  };

  const filteredEntries = entries.filter(item => item.content.toLowerCase().includes(searchTerm.toLowerCase()));

  const getIcon = (item: Entry) => {
    if (item.is_task) return <CheckCircle2 size={20} className="text-slate-400" />;
    if (item.mood.includes('positive')) return <Smile size={20} className="text-green-500" />;
    if (item.mood.includes('negative')) return <Frown size={20} className="text-red-500" />;
    return <Meh size={20} className="text-blue-400" />;
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 pb-24">
      <div className="w-full max-w-md flex flex-col gap-4">
        <header className="flex flex-col gap-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"><HistoryIcon className="text-purple-600" /> NHẬT KÝ</h2>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">{filteredEntries.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm kiếm ký ức..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-sm font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"/>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode='popLayout'>
            {filteredEntries.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group relative">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-full shrink-0 ${item.is_task ? 'bg-slate-100' : 'bg-purple-50'}`}>{getIcon(item)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      {/* NÚT SỬA */}
                      {editingId !== item.id && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-blue-500"><Pencil size={14}/></button>
                            <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      )}
                    </div>
                    
                    {/* CHẾ ĐỘ SỬA HOẶC XEM */}
                    {editingId === item.id ? (
                        <div className="flex gap-2 items-center mt-1">
                            <input autoFocus value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 outline-none focus:border-blue-400"/>
                            <button onClick={() => saveEdit(item.id!)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Save size={14}/></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"><X size={14}/></button>
                        </div>
                    ) : (
                        <p className={`text-slate-700 font-medium leading-relaxed ${item.is_task ? 'line-through opacity-60' : ''}`}>{item.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
export default History;