import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { Zap, Eye, Fingerprint, Activity } from 'lucide-react';

const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]); 
  }
  return dates;
};

export const StatsTab = () => {
  const last7Days = useMemo(() => getLast7Days(), []);

  // QUERY 1: Impact Data (Có xử lý Gap)
  const entriesData = useLiveQuery(async () => {
    const startStr = last7Days[0];
    const endStr = last7Days[6];
    
    const records = await db.entries
      .where('date_str')
      .between(startStr, endStr, true, true)
      .toArray();

    return last7Days.map(date => {
      const dayRecords = records.filter(r => r.date_str === date);
      
      // LOGIC FIX: Nếu không có dữ liệu -> Trả về null hoàn toàn
      if (dayRecords.length === 0) {
        return {
          date: date.slice(5),
          feeling: null,
          vision: null,
          identity: null
        };
      }

      // Nếu có dữ liệu -> Tính trung bình
      const count = dayRecords.length;
      const avgFeeling = dayRecords.reduce((acc, cur) => acc + (cur.feeling || 0), 0) / count;
      const avgVision = dayRecords.reduce((acc, cur) => acc + (cur.vision || 0), 0) / count;
      const avgIdentity = dayRecords.reduce((acc, cur) => acc + (cur.identity || 0), 0) / count;

      return {
        date: date.slice(5),
        feeling: Number(avgFeeling.toFixed(1)),
        vision: Number(avgVision.toFixed(1)),
        identity: Number(avgIdentity.toFixed(1)),
      };
    });
  }, [last7Days]);

  // QUERY 2: Task Data (Giữ nguyên logic đếm số lượng)
  const taskData = useLiveQuery(async () => {
    const startTimestamp = new Date(last7Days[0]).getTime();
    
    const logs = await db.activity_logs
      .where('created_at')
      .aboveOrEqual(startTimestamp)
      .filter(l => l.action_type === 'TASK_DONE')
      .toArray();

    return last7Days.map(date => {
      const count = logs.filter(l => {
         const logDate = new Date(l.created_at).toISOString().split('T')[0];
         return logDate === date;
      }).length;

      return {
        date: date.slice(5),
        completed: count
      };
    });
  }, [last7Days]);

  // --- UI ---
  const StatCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white p-4 rounded-lg border border-slate-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</span>
      </div>
      <div className="h-[200px] w-full text-xs">
        {children}
      </div>
    </div>
  );

  return (
    <div className="pb-20">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 px-1">Tổng quan tuần qua</h2>

      <StatCard title="Biểu đồ Tâm thức (Impact)" icon={Activity}>
        <ResponsiveContainer width="100%" height="100%">
          {/* connectNulls={false} là mặc định, dòng kẻ sẽ bị đứt khi gặp null */}
          <LineChart data={entriesData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
            <YAxis domain={[-5, 5]} hide />
            <Tooltip 
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              itemStyle={{fontSize: '12px', fontWeight: 500}}
              cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
            />
            <Line type="monotone" dataKey="feeling" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} name="Năng lượng" connectNulls={false} />
            <Line type="monotone" dataKey="vision" stroke="#2563eb" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} name="Tầm nhìn" connectNulls={false} />
            <Line type="monotone" dataKey="identity" stroke="#db2777" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} name="Bản sắc" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[10px] text-slate-500">Feeling</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-[10px] text-slate-500">Vision</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-600"></div><span className="text-[10px] text-slate-500">Identity</span></div>
        </div>
      </StatCard>

      <StatCard title="Hiệu suất (Task Done)" icon={Zap}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={taskData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
            <Bar dataKey="completed" fill="#334155" radius={[4, 4, 0, 0]} barSize={20} name="Hoàn thành" />
          </BarChart>
        </ResponsiveContainer>
      </StatCard>
    </div>
  );
};