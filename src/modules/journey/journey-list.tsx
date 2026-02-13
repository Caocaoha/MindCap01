import React from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { LivingMemory } from './components/living-memory';
import { ReflectiveMirror } from './components/reflective-mirror';
import { SearchBar } from './components/search-bar';

export const JourneyList: React.FC = () => {
  const { viewMode, setViewMode } = useJourneyStore();

  return (
    <div className="h-full flex flex-col pt-6">
      <header className="px-2 mb-8 space-y-6">
        <div className="flex justify-center bg-zinc-900/50 p-1 rounded-2xl w-fit mx-auto border border-white/5">
          {(['diary', 'stats'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all 
                ${viewMode === mode ? 'bg-white text-black shadow-lg scale-105' : 'opacity-20 hover:opacity-40'}`}
            >
              {mode === 'diary' ? 'Nhật ký' : 'Chỉ số'}
            </button>
          ))}
        </div>
        {viewMode === 'diary' && <SearchBar />}
      </header>

      <main className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        {viewMode === 'diary' ? <LivingMemory /> : <ReflectiveMirror />}
      </main>
    </div>
  );
};