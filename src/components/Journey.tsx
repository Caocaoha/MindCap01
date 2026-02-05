import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Smile, Frown, Meh, Award, Zap } from 'lucide-react';
import { db } from '../utils/db';

const Journey: React.FC = () => {
  const [taskData, setTaskData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalTasks: 0, domMood: 'neutral' });
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const processData = async () => {
      try {
        const allEntries = await db.entries.toArray();
        if (allEntries.length === 0) { setIsEmpty(true); return; } else { setIsEmpty(false); }

        const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

        const recentCompletedTasks = allEntries.filter(e => e.is_task && e.status === 'completed' && e.completed_at && e.completed_at > tenDaysAgo);
        const recentMoods = allEntries.filter(e => !e.is_task && e.created_at > tenDaysAgo);

        // --- XỬ LÝ BIỂU ĐỒ ---
        const last10Days = Array.from({ length: 10 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (9 - i));
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return { full: d.toISOString().split('T')[0], show: `${day}/${month}` };
        });

        let runningTotal = 0;
        const tasksChart = last10Days.map(day => {
          const count = recentCompletedTasks.filter(t => {
              if (!t.completed_at) return false;
              const d = new Date(t.completed_at);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const da = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${da}` === day.full;
          }).length;
          runningTotal += count;
          return { name: day.show, daily: count, cumulative: runningTotal };
        });

        // Tính tâm trạng chủ đạo
        let moodCounts = { positive: 0, neutral: 0, negative: 0 };
        recentMoods.forEach(m => {
          if(m.mood.includes('positive')) moodCounts.positive++;
          else if(m.mood.includes('negative')) moodCounts.negative++;
          else moodCounts.neutral++;
        });
        
        const maxMood = Math.max(moodCounts.positive, moodCounts.neutral, moodCounts.negative);
        let dom = 'neutral';
        if (maxMood > 0) {
            if (moodCounts.positive === maxMood) dom = 'positive';
            else if (moodCounts.negative === maxMood) dom = 'negative';
        }

        setTaskData(tasksChart);
        setSummary({ totalTasks: runningTotal, domMood: dom });

      } catch (err) { console.error(err); }
    };
    processData();
  }, []);

  const getDomMoodIcon = () => {
    switch (summary.domMood) {
      case 'positive': return <Smile size={32} className="text-green-500" />;
      case 'negative': return <Frown size={32} className="text-red-500" />;
      default: return <Meh size={32} className="text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 pb-24">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <TrendingUp size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Hành trình</h2>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Zap size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">"Chưa có dữ liệu thống kê"</p>
          </div>
        ) : (
          <>
            {/* THỐNG KÊ TỔNG */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-2">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-1"><Award size={24} /></div>
                <span className="text-3xl font-black text-slate-700">{summary.totalTasks}</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Việc đã xong</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-2">
                <div className="bg-slate-50 p-3 rounded-full mb-1">{getDomMoodIcon()}</div>
                <span className="text-sm font-bold text-slate-600 mt-2 capitalize">{summary.domMood === 'positive' ? 'Tích cực' : summary.domMood === 'negative' ? 'Căng thẳng' : 'Bình ổn'}</span>
                <span className="text-xs font-bold text-slate-400 uppercase">Tâm trạng</span>
              </motion.div>
            </div>

            {/* BIỂU ĐỒ TASK */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div><h3 className="font-bold text-slate-700">Hiệu suất</h3><p className="text-xs text-slate-400">Tích lũy theo thời gian</p></div>
                <TrendingUp size={20} className="text-blue-500 opacity-50"/>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={taskData}>
                    <defs><linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10}/>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
                    <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCum)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
export default Journey;