import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Bookmark, Brain, CheckCircle2, Smile, Waves, AlertTriangle } from 'lucide-react';
import { db, type Entry, touchEntry, getTriggerEchoes, type IdentityProfile } from '../utils/db';
import { getDateString } from '../utils/date';

const History: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [activeEchoId, setActiveEchoId] = useState<number | null>(null);
  const [echoItems, setEchoItems] = useState<Entry[]>([]);

  const fetchHistory = async () => {
    const todayStr = getDateString();
    const all = await db.entries.toArray();
    // Lọc: Mood/Thoughts HOẶC Task đã xong từ các ngày trước
    const filtered = all.filter(item => {
        if (!item.is_task) return true; // Luôn hiện ghi chú/suy nghĩ
        return item.status === 'completed' && item.date_str !== todayStr; // Task xong ngày hôm trước
    }).sort((a, b) => b.created_at - a.created_at);
    setEntries(filtered);
  };

  useEffect(() => { 
      fetchHistory(); 
      db.identity_profile.toArray().then(p => { if (p.length) setIdentity(p[p.length-1]); });
  }, []);

  const getOpacity = (item: Entry) => {
    if (item.status === 'completed') return 0.4; // Task cũ mờ đi
    if (item.is_bookmarked) return 1;
    const days = (Date.now() - (item.last_accessed || item.created_at)) / (1000 * 60 * 60 * 24);
    return Math.max(0.3, 1 - (days / 30));
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-slate-50">
      <header className="flex justify-between items-center mb-6 pt-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <HistoryIcon className="text-purple-600"/> NHẬT KÝ
        </h2>
      </header>

      <div className="flex flex-col gap-4">
        {entries.map(item => (
          <motion.div 
            key={item.id} 
            style={{ opacity: getOpacity(item) }}
            className={`relative bg-white p-5 rounded-[2rem] shadow-sm border ${item.status === 'completed' ? 'border-slate-100' : 'border-slate-100'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {item.is_task ? <CheckCircle2 size={14} className="text-green-500"/> : <Brain size={14} className="text-blue-400"/>}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <p className={`text-slate-700 font-medium leading-relaxed ${item.status === 'completed' ? 'line-through decoration-slate-300' : ''}`}>
                {item.content}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-50">
                <button onClick={async () => { if(activeEchoId === item.id) setActiveEchoId(null); else { const r = await getTriggerEchoes(item.content); setEchoItems(r); setActiveEchoId(item.id!); touchEntry(item.id!); } }} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                    <Waves size={12}/> {activeEchoId === item.id ? 'Đóng' : 'Tiếng vọng'}
                </button>
                {activeEchoId === item.id && (
                    <div className="mt-2 pl-2 space-y-1">
                        {echoItems.map(e => <p key={e.id} className="text-[10px] text-slate-400 italic">" {e.content} "</p>)}
                    </div>
                )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default History;