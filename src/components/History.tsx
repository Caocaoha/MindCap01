import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, RefreshCcw, Edit2, Save, X, Calendar, Smile, Frown, Meh, ArrowUpRight } from 'lucide-react';
import { db, type Entry, addLog, type Mood } from '../utils/db';
import { formatDisplayDate, getDateString } from '../utils/date';

const History: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // 1. Logic Fetching: Lấy tất cả những gì KHÔNG ở Todo
  const fetchHistory = async () => {
    const todayStr = getDateString();

    // A. Lấy tất cả Suy nghĩ (Non-tasks)
    const thoughts = await db.entries.where('is_task').equals(0).toArray();

    // B. Lấy tất cả Task đã Archived (bao gồm cả Task đã xong của ngày cũ bị system archive)
    const archivedTasks = await db.entries.where('status').equals('archived').toArray();

    // C. Lấy tất cả Task đã Xong nhưng không phải hôm nay (trường hợp chưa chạy Midnight Reset kịp)
    const oldCompletedTasks = await db.entries
      .where('status').equals('completed')
      .filter(entry => entry.date_str !== todayStr)
      .toArray();

    // Gộp và sắp xếp: Mới nhất lên đầu
    const allItems = [...thoughts, ...archivedTasks, ...oldCompletedTasks].sort(
      (a, b) => b.created_at - a.created_at
    );

    setHistoryItems(allItems);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. Logic Hồi sinh (Revive)
  const handleRevive = async (item: Entry) => {
    await db.entries.update(item.id!, {
      status: 'active',       // Trở về trạng thái Active
      completed_at: undefined, // Xóa mốc hoàn thành cũ
      is_focus: false,        // Về kho Todo, chưa vào Tiêu điểm ngay
      lifecycle_logs: addLog(item.lifecycle_logs, 'revived') // Ghi log Hồi sinh
    });
    fetchHistory(); // Refresh list (item sẽ biến mất khỏi History)
  };

  // 3. Logic Chỉnh sửa (Edit)
  const startEdit = (item: Entry) => {
    setEditingId(item.id!);
    setEditContent(item.content);
  };

  const saveEdit = async (item: Entry) => {
    if (!editContent.trim()) return;
    await db.entries.update(item.id!, {
      content: editContent,
      lifecycle_logs: addLog(item.lifecycle_logs, 'edited')
    });
    setEditingId(null);
    fetchHistory();
  };

  // Helper render Icon cảm xúc
  const getMoodIcon = (mood: Mood) => {
    switch (mood) {
      case 'positive': return <Smile className="text-green-500" size={20} />;
      case 'negative': return <Frown className="text-red-400" size={20} />;
      default: return <Meh className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-100/50 pb-20">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <HistoryIcon size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Dòng thời gian</h2>
        </header>

        {historyItems.length === 0 ? (
          <div className="text-center py-20 text-slate-300 italic">
            "Quá khứ chưa được viết nên..."
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {historyItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 group"
              >
                {/* Header: Date & Type */}
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDisplayDate(new Date(item.created_at))}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.is_task ? (
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.status === 'completed' ? 'Đã xong' : 'Đã hủy'}
                      </span>
                    ) : (
                      getMoodIcon(item.mood)
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="py-1">
                  {editingId === item.id ? (
                    <div className="flex gap-2">
                      <input 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-slate-50 p-2 rounded-lg outline-none border border-blue-200 text-slate-700"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(item)} className="p-2 bg-blue-500 text-white rounded-lg"><Save size={16}/></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-lg"><X size={16}/></button>
                    </div>
                  ) : (
                    <p className={`text-slate-700 font-medium ${!item.is_task && 'italic font-serif text-slate-600'}`}>
                      {item.content}
                    </p>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex justify-end gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(item)} 
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={14} /> Sửa
                  </button>
                  
                  {item.is_task && (
                    <button 
                      onClick={() => handleRevive(item)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-green-600 transition-colors"
                      title="Đưa lại về Kho việc"
                    >
                      <RefreshCcw size={14} /> Hồi sinh
                    </button>
                  )}
                  
                  {/* Debug: Xem Log Cycle (Chỉ hiện khi dev) */}
                  {/* <div className="text-[10px] text-slate-300 ml-auto">
                    Events: {item.lifecycle_logs?.length || 0}
                  </div> */}
                </div>

                {/* Log Visualization (Tùy chọn hiển thị nhỏ) */}
                {item.lifecycle_logs && item.lifecycle_logs.length > 1 && (
                  <div className="pt-2 border-t border-slate-50 flex gap-1 overflow-x-auto pb-1">
                    {item.lifecycle_logs.map((log, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-50 rounded text-slate-400 whitespace-nowrap">
                        {log.action}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;