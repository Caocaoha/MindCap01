// src/modules/journey/JourneyView.tsx
import React, { useState } from 'react';
import { ReflectiveMirror } from './components/ReflectiveMirror';
import { LivingMemory } from './components/LivingMemory';
import { Search, History, BarChart2, Filter } from 'lucide-react';

export const JourneyView: React.FC = () => {
  const [mode, setMode] = useState<'diary' | 'stats'>('diary');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. TOP SEARCH & TOGGLE */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search your living memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button 
            onClick={() => setMode('diary')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'diary' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <History size={16} /> Diary
          </button>
          <button 
            onClick={() => setMode('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'stats' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            <BarChart2 size={16} /> Stats
          </button>
        </div>
      </div>

      {/* 2. CONTENT */}
      <div className="px-4">
        {mode === 'stats' ? <ReflectiveMirror /> : <LivingMemory />}
      </div>

      {/* MECHANISM C: THREAD OVERLAY (Giả lập) */}
      <button className="fixed bottom-28 right-6 w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center">
        <Filter size={20} />
      </button>
    </div>
  );
};