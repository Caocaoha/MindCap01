import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart2, Smile, Frown, Meh, Award, Share2, History, CheckCircle2, FileText, Calendar, Zap } from 'lucide-react';
import { db, type Entry } from '../utils/db'; 

const Journey: React.FC = () => {
  const [taskData, setTaskData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<Entry[]>([]); 
  const [summary, setSummary] = useState({ totalTasks: 0, domMood: 'neutral' });
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const processData = async () => {
      try {
        const last10Days = Array.from({ length: 10 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (9 - i));
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return {
            fullDate: d.toISOString().split('T')[0],
            displayDate: `${day}/${month}`,
          };
        });

        // Lấy tất cả và lọc bằng tay cho chắc chắn
        const allEntries = await db.entries.toArray();
        const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

        // Lọc Task đã xong (Chấp nhận true/1)
        const recentCompletedTasks = allEntries.filter(e => 
          !!e.is_task && e.status === 'completed' && e.completed_at && e.completed_at > tenDaysAgo
        );
        
        // Lọc Mood (Chấp nhận false/0/undefined)
        const recentMoods = allEntries.filter(e => 
          !e.is_task && e.created_at > tenDaysAgo
        );

        // Lọc Lịch sử tổng hợp (Task xong HOẶC Mood)
        const historyItems = allEntries.filter(e => 
          (!e.is_task) || // Mood
          (!!e.is_task && e.status === 'completed') // Task xong
        ).sort((a, b) => {
          const timeA = a.completed_at || a.created_at;
          const timeB = b.completed_at || b.created_at;
          return timeB - timeA;
        });
        
        setHistoryList(historyItems);

        if (allEntries.length === 0) {
          setIsEmpty(true);
          return;
        }

        let runningTotal = 0;
        const tasksChart = last10Days.map(day => {
          const count = recentCompletedTasks.filter(t => {
              if (!t.completed_at) return false;
              const d = new Date(t.completed_at);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const da = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${da}` === day.fullDate;
          }).length;
          runningTotal += count;
          return { name: day.displayDate, daily: count, cumulative: runningTotal };
        });

        let moodCounts = { positive: 0, neutral: 0, negative: 0 };
        const moodsChart = last10Days.map(day => {
          const dayMoods = recentMoods.filter(m => m.date_str === day.fullDate);
          const pos = dayMoods.filter(m => m.mood === 'positive').length;
          const neu = dayMoods.filter(m => m.mood === 'neutral').length;
          const neg = dayMoods.filter(m => m.mood === 'negative').length;
          moodCounts.positive += pos; moodCounts.neutral += neu; moodCounts.negative += neg;
          return { name: day.displayDate, Vui: pos, Bình_thường: neu, Buồn: neg };
        });

        const maxMoodCount = Math.max(moodCounts.positive, moodCounts.neutral, moodCounts.negative);
        let dominant = 'neutral';
        if (maxMoodCount > 0) {
          if (moodCounts.positive === maxMoodCount) dominant = 'positive';
          else if (moodCounts.negative === maxMoodCount) dominant = 'negative';
        }

        setTaskData(tasksChart);
        setMoodData(moodsChart);
        setSummary({ totalTasks: runningTotal, domMood: dominant });
      } catch (err) { console.error("Journey Error:", err); }
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

  const getMoodEmoji = (mood: string) => {
    if (mood === 'positive') return '😃';
    if (mood === 'negative') return '😔';
    return '😐';
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-slate-50 overflow-y-auto pb-24">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center gap-2 py-4 text-slate-400">
          <TrendingUp size={20} />
          <h2 className="text-lg font-bold uppercase tracking-widest">Tổng quan & Lịch sử</h2>
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Zap size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">"Chưa có dữ liệu lịch sử"</p>
          </div>
        ) : (
          <>
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

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div><h3 className="font-bold text-slate-700">Cảm xúc</h3><p className="text-xs text-slate-400">10 ngày gần nhất</p></div>
                <BarChart2 size={20} className="text-purple-500 opacity-50"/>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moodData} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10}/>
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
                    <Bar dataKey="Buồn" stackId="a" fill="#f87171" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Bình_thường" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="Vui" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="pt-6 border-t border-slate-200 w-full">
              <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm flex items-center gap-2 mb-6"><History size={16} /> Dòng thời gian</h3>
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-10">
                {historyList.map((item, index) => (
                  <motion.div key={item.id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * Math.min(index, 5) }} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white ${item.is_task ? 'border-blue-500' : item.mood === 'positive' ? 'border-green-400' : item.mood === 'negative' ? 'border-red-400' : 'border-slate-400'}`} />
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           {item.is_task ? (<span className="bg-blue-100 text-blue-600 p-1 rounded-md"><CheckCircle2 size={12}/></span>) : (<span className="bg-slate-100 text-slate-600 p-1 rounded-md"><FileText size={12}/></span>)}
                           <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={10} />{new Date(item.completed_at || item.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • {new Date(item.completed_at || item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {!item.is_task && <span className="text-lg">{getMoodEmoji(item.mood)}</span>}
                      </div>
                      <p className={`text-slate-700 leading-relaxed ${item.is_task ? 'line-through text-slate-400 italic' : ''}`}>{item.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default Journey;