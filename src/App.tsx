import React, { useEffect, useState } from 'react';
import { InputBar } from './modules/input/input-bar';
import { JourneyList } from './modules/journey/journey-list';
import { SabanBoard } from './modules/saban/saban-board';
import { initializeNlpListener } from './store/middleware/nlp-listener';

// [FIX]: Chuyển thành Named Export 'export const App' để khớp với main.tsx
export const App = () => {
  const [activeTab, setActiveTab] = useState<'journey' | 'saban'>('saban');

  // [TRÁI TIM]: Khởi động "Ninja" lắng nghe NLP khi App start
  useEffect(() => {
    const cleanupListener = initializeNlpListener();
    return () => cleanupListener();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      <header className="p-4 bg-white shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Mind Cap OS
        </h1>
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('saban')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'saban' ? 'bg-white shadow text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            Saban (Brain)
          </button>
          <button 
            onClick={() => setActiveTab('journey')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'journey' ? 'bg-white shadow text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            Journey (History)
          </button>
        </div>
      </header>

      <main className="mt-4">
        {activeTab === 'saban' ? <SabanBoard /> : <JourneyList />}
      </main>

      <footer>
        <InputBar />
      </footer>
    </div>
  );
};