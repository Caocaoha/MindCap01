import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Search, Filter, Trash2, Calendar, CheckCircle2, Circle, FileText, Frown, Meh, Smile, X } from 'lucide-react';
import { db, type Entry } from '../utils/db'; // Kết nối MindOS_V5_Clean

type FilterType = 'all' | 'task' | 'mood';

const History: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- LẤY DỮ LIỆU ---
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy toàn bộ dữ liệu thô
      let allData = await db.entries.toArray();

      // 2. Sắp xếp: Mới nhất lên đầu
      allData = allData.sort((a, b) => b.created_at - a.created_at);

      setEntries(allData);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- XỬ LÝ XÓA ---
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn ghi chú này không?")) {
      await db.entries.delete(id);
      fetchHistory(); // Tải lại danh sách sau khi xóa
    }
  };

  // --- LỌC DỮ LIỆU HIỂN THỊ ---
  const filteredEntries = entries.filter(item => {
    // 1. Lọc theo Tab (Task/Mood/All) - Dùng chuẩn Boolean V5
    const typeMatch = 
      filterType === 'all' ? true :
      filterType === 'task' ? item.is_task === true :
      filterType === 'mood' ? item.is_task === false : true;

    // 2. Lọc theo từ khóa tìm kiếm
    const searchMatch = item.content.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  // --- HELPER RENDER ---
  const getIcon = (item: Entry) => {
    if (item.is_task) {
      return item.status === 'completed' 
        ? <CheckCircle2 size={20} className="text-green-500" /> 
        : <Circle size={20} className="text-slate-300" />;
    } else {
      // Mood icons
      if (item.mood === 'positive') return <Smile size={20} className="text-green-500" />;
      if (item.mood === 'negative') return <Frown size={20} className="text-red-500" />;
      return <Meh size={20} className="text-blue-400" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-4">
        
        {/* HEADER */}
        <header className="flex flex-col gap-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <HistoryIcon className="text-purple-600" /> DÒNG THỜI GIAN
            </h2>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
              {filteredEntries.length}
            </span>
          </div>

          {/* THANH TÌM KIẾM */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm ký ức..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-sm font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>

          {/* BỘ LỌC (CHIPS) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm'}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilterType('task')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${filterType === 'task' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm'}`}
            >
              <CheckCircle2 size={12}/> Công việc
            </button>
            <button 
              onClick={() => setFilterType('mood')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${filterType === 'mood' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm'}`}
            >
              <Smile size={12}/> Cảm xúc
            </button>
          </div>
        </header>

        {/* DANH SÁCH LỊCH SỬ */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode='popLayout'>
            {isLoading ? (
              <div className="text-center py-10 text-slate-400 text-sm">Đang tải ký ức...</div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group relative"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon cột trái */}
                    <div className={`mt-0.5 p-2 rounded-full shrink-0 ${item.is_task ? 'bg-blue-50' : 'bg-purple-50'}`}>
                      {getIcon(item)}
                    </div>

                    {/* Nội dung chính */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(item.created_at)}
                        </span>
                        {item.is_task && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                            item.priority === 'hỏa-tốc' ? 'bg-red-500' :
                            item.priority === 'urgent' ? 'bg-orange-500' :
                            item.priority === 'important' ? 'bg-yellow-400' : 'bg-blue-400'
                          }`}>
                            {item.priority === 'normal' ? 'THƯỜNG' : item.priority}
                          </span>
                        )}
                      </div>
                      
                      <p className={`mt-1 text-slate-700 font-medium leading-relaxed break-words ${item.is_task && item.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {item.content}
                      </p>

                      {/* Hiển thị chi tiết Mood nếu có */}
                      {!item.is_task && (
                        <div className="mt-2 flex gap-2">
                          <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${
                            item.mood === 'positive' ? 'bg-green-100 text-green-700' :
                            item.mood === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.mood === 'positive' ? 'Tích cực' : item.mood === 'negative' ? 'Tiêu cực' : 'Bình thường'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nút xóa (chỉ hiện khi bấm vào hoặc hover trên PC) */}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center opacity-50">
                <Filter size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Không tìm thấy ghi chú nào</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default History;