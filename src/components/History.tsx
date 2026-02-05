import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Brain, CheckCircle2, Waves, AlertTriangle } from 'lucide-react';
import { db, type Entry, getTriggerEchoes, type IdentityProfile } from '../utils/db';
import { getDateString } from '../utils/date';

const History: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [activeEchoId, setActiveEchoId] = useState<number | null>(null);
  const [echoItems, setEchoItems] = useState<Entry[]>([]);

  const fetchHistory = async () => {
    const todayStr = getDateString();
    const all = await db.entries.toArray();
    // Lọc: Nhật ký suy nghĩ HOẶC Task đã xong từ ngày hôm trước
    const filtered = all.filter(item => !item.is_task || (item.status === 'completed' && item.date_str !== todayStr))
                        .sort((a, b) => b.created_at - a.created_at);
    setEntries(filtered);
  };

  useEffect(() => { 
    fetchHistory(); 
    db.identity_profile.toArray().then(p => { if (p.length) setIdentity(p[p.length-1]); });
  }, []);

  return (
    <div className="p-4">
      <header className="py-6 mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase">
          <HistoryIcon className="text-purple-600"/> NHẬT KÝ
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Dòng chảy ký ức & Vô thức số</p>
      </header>

      <div className="flex flex-col gap-4">
        {entries.map(item => {
          const isTaskComp = item.status === 'completed' && item.is_task;
          // Báo hiệu lệch pha căn tính [cite: 19]
          const isMisaligned = !item.is_task && item.mood_score < 0; 

          return (
            <motion.div key={item.id} className={`relative bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 ${isTaskComp ? 'opacity-40' : 'opacity-100'}`}>
              {isMisaligned && <div className="absolute -right-1 -top-1 bg-red-500 text-white p-1 rounded-full animate-bounce"><AlertTriangle size={12} /></div>}
              
              <div className="flex items-center gap-2 mb-2">
                {item.is_task ? <CheckCircle2 size={14} className="text-green-500"/> : <Brain size={14} className="text-blue-400"/>}
                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              <p className={`text-slate-700 font-medium leading-relaxed ${isTaskComp ? 'line-through decoration-slate-300' : ''}`}>
                {item.content}
              </p>
              
              <div className="mt-3 pt-3 border-t border-slate-50">
                <button onClick={async () => { if(activeEchoId === item.id) setActiveEchoId(null); else { const r = await getTriggerEchoes(item.content); setEchoItems(r); setActiveEchoId(item.id!); } }} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                  <Waves size={12}/> {activeEchoId === item.id ? 'Đóng' : 'Tiếng vọng'}
                </button>
                {activeEchoId === item.id && (
                  <div className="mt-2 pl-2 space-y-1">
                    {echoItems.map(e => <p key={e.id} className="text-[10px] text-slate-400 italic">" {e.content} "</p>)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default History;