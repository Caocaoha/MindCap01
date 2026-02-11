// src/modules/journey/components/LivingMemory.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link2, Zap, Sprout } from 'lucide-react';
import clsx from 'clsx';

export const LivingMemory: React.FC = () => {
  const entries = useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    const thoughts = await db.thoughts.toArray();
    
    // Gom nhóm và Filter theo Spec
    return [...tasks, ...thoughts]
      .filter(e => !(e.type === 'task' && e.status === 'active' && !e.identityScore)) // Lọc task active chưa có trọng số
      .sort((a, b) => b.createdAt - a.createdAt);
  }, []);

  const calculateOpacity = (lastUpdated: number) => {
    const days = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
    const opacity = 1 - (days / 40);
    return Math.max(0, opacity);
  };

  return (
    <div className="space-y-4 pb-24">
      {entries?.map((entry) => {
        const opacity = entry.isBookmarked ? 1 : calculateOpacity(entry.updatedAt || entry.createdAt);
        if (opacity <= 0) return null; // Entropy has taken it

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            className={clsx(
              "p-4 rounded-2xl bg-white border border-slate-100 relative group transition-all",
              entry.isBookmarked && "ring-2 ring-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
            )}
          >
            {/* Entry Header */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {new Date(entry.createdAt).toLocaleDateString()}
              </span>
              {entry.isBookmarked && <Sprout size={14} className="text-yellow-500" />}
            </div>

            {/* Content */}
            <p className="text-slate-700 leading-relaxed mb-4">{entry.content}</p>

            {/* MECHANISM A: RESONANCE BUBBLES (Echo Links) */}
            {entry.linkedIds && entry.linkedIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                {entry.linkedIds.slice(0, 3).map((linkId: string) => (
                  <div 
                    key={linkId}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-full animate-pulse"
                  >
                    <Link2 size={10} /> Resonance Link
                  </div>
                ))}
                {entry.linkedIds.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{entry.linkedIds.length - 3} more</span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};