import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, Smile, Frown, Meh, Zap, Award, Share2 } from 'lucide-react';
import { db } from '../utils/db';

const Journey: React.FC = () => {
  const [taskData, setTaskData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalTasks: 0, domMood: 'neutral' });
  const [isEmpty, setIsEmpty] = useState(false);

  // --- DATA PROCESSING LOGIC ---
  useEffect(() => {
    const processData = async () => {
      // 1. Tạo khung xương 10 ngày gần nhất (để trục X luôn liền mạch)
      const last10Days = Array.from({ length: 10 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (9 - i));
        return {
          fullDate: d.toISOString().split('T')[0], // YYYY-MM-DD
          displayDate: `${d.getDate()}/${d.getMonth() + 1}`, // DD/MM
        };
      });

      // 2. Lấy dữ liệu từ DB
      // Lấy task đã hoàn thành (dựa vào completed_at)
      const allEntries = await db.entries.toArray();
      
      const completedTasks = allEntries.filter(e => 
        e.is_task && e.completed_at && e.completed_at > Date.now() - 10 * 24 * 60 * 60 * 1000
      );

      const moods = allEntries.filter(e => 
        !e.is_task && e.created_at > Date.now() - 10 * 24 * 60 * 60 * 1000
      );

      // Nếu không có dữ liệu nào
      if (completedTasks.length === 0 && moods.length === 0) {
        setIsEmpty(true);
        return;
      }

      // 3. Xử lý Biểu đồ Hiệu suất (Cumulative)
      let runningTotal = 0;
      const tasksChart = last10Days.map(day => {
        // Đếm số việc xong trong ngày này
        const count = completedTasks.filter(t => {
          const taskDate = new Date(t.completed_at!).toISOString().split('T')[0];
          return taskDate === day.fullDate;
        }).length;

        runningTotal += count; // Cộng dồn

        return {
          name: day.displayDate,
          daily: count,
          cumulative: runningTotal,
        };
      });

      // 4. Xử lý Biểu đồ Cảm xúc (Stacked)
      let moodCounts = { positive: 0, neutral: 0, negative: 0 };
      const moodsChart = last10Days.map(day => {
        const dayMoods = moods.filter(m => m.date_str === day.fullDate);
        
        const pos = dayMoods.filter(m => m.mood === 'positive').length;
        const neu = dayMoods.filter(m => m.mood === 'neutral').length;
        const neg = dayMoods.filter(m => m.mood === 'negative').length;

        // Cộng tổng để tìm Dominant mood
        moodCounts.positive += pos;
        moodCounts.neutral += neu;
        moodCounts.negative += neg;

        return {
          name: day.displayDate,
          Vui: pos,
          Bình_thường: neu,
          Buồn: neg,
          total: pos + neu + neg // Để dùng cho tooltip nếu cần
        };
      });

      // 5. Tính chỉ số tổng quan (Summary)
      const maxMoodCount = Math.max(moodCounts.positive, moodCounts.neutral, moodCounts.negative);
      let dominant = 'neutral';
      if (maxMoodCount > 0) {
        if (moodCounts.positive === maxMoodCount) dominant = 'positive';
        else if (moodCounts.negative === maxMoodCount) dominant = 'negative';
      }

      setTaskData(tasksChart);
      setMoodData(moodsChart);
      setSummary({
        totalTasks: runningTotal,
        domMood: dominant
      });
    };

    processData();
  }, []);

  // Helper render icon mood
  const getDomMoodIcon = () => {
    switch (summary.domMood) {
      case 'positive': return <Smile size={32} className="text-green-500" />;
      case 'negative': return <Frown size={32} className="text-red-500" />;
      default: return <Meh size={32} className="text-blue-400" />;
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <TrendingUp size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Hành trình 10 ngày</h2>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Zap size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">"Hành trình vạn dặm bắt đầu từ bước chân đầu tiên"</p>
            <p className="text-sm text-slate-400 mt-2">Hãy bắt đầu ghi chép và hoàn thành công việc!</p>
          </div>
        ) : (
          <>
            {/* 1. Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-1">
                  <Award size={24} />
                </div>
                <span className="text-3xl font-black text-slate-700">{summary.totalTasks}</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Việc đã xong</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-slate-50 p-3 rounded-full mb-1">
                  {getDomMoodIcon()}
                </div>
                <span className="text-sm font-bold text-slate-600 mt-2 capitalize">
                  {summary.domMood === 'positive' ? 'Tích cực' : summary.domMood === 'negative' ? 'Căng thẳng' : 'Bình ổn'}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">Tâm trạng chủ đạo</span>
              </motion.div>
            </div>

            {/* 2. Growth Chart (Area) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-[2rem] shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-700">Đường dốc Hiệu suất</h3>
                  <p className="text-xs text-slate-400">Tích lũy công việc theo thời gian</p>
                </div>
                <TrendingUp size={20} className="text-blue-500 opacity-50"/>
              </div>
              
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={taskData}>
                    <defs>
                      <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      dy={10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCum)" 
                      name="Tích lũy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 3. Mood Chart (Stacked Bar) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-[2rem] shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-700">Thời tiết Tâm trí</h3>
                  <p className="text-xs text-slate-400">Phân phối cảm xúc 10 ngày qua</p>
                </div>
                <BarChart2 size={20} className="text-purple-500 opacity-50"/>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moodData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    {/* Stacked Bars */}
                    <Bar dataKey="Buồn" stackId="a" fill="#f87171" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Bình_thường" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="Vui" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend thủ công */}
              <div className="flex justify-center gap-4 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"/> Vui vẻ</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"/> Bình thường</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"/> Buồn</div>
              </div>
            </motion.div>

            {/* Footer Action */}
            <div className="flex justify-center pt-4 opacity-50 hover:opacity-100 transition-opacity">
               <button className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-200 px-4 py-2 rounded-full">
                 <Share2 size={14} /> CHIA SẺ HÀNH TRÌNH
               </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Journey;