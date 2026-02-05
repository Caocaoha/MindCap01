import React, { useState } from 'react';
// IMPORT SETUP COMPONENT MỚI
import Setup from './components/Setup'; 
import Mind from './components/Mind';
import Todo from './components/Todo';
import History from './components/History';
import Journey from './components/Journey';

import { LayoutGrid, History as HistoryIcon, Settings, Brain, ListTodo, Map } from 'lucide-react';

type Tab = 'mind' | 'todo' | 'history' | 'journey' | 'setup';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mind');

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm px-4 py-3 flex items-center justify-between">
        {/* LOGO & TÊN APP */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('mind')}>
          <div className="bg-slate-900 text-white p-1.5 rounded-lg"><LayoutGrid size={18} /></div>
          <span className="font-black text-slate-800 text-lg tracking-tight">MIND OS <span className="text-[10px] text-slate-400 font-medium">v5.4</span></span>
        </div>

        {/* NAV BUTTONS */}
        <nav className="flex items-center gap-1">
          <button onClick={() => setActiveTab('journey')} className={`p-2 rounded-full transition-all ${activeTab === 'journey' ? 'bg-blue-50 text-blue-600 scale-110 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}><Map size={20} /></button>
          <button onClick={() => setActiveTab('history')} className={`p-2 rounded-full transition-all ${activeTab === 'history' ? 'bg-purple-50 text-purple-600 scale-110 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}><HistoryIcon size={20} /></button>
          <button onClick={() => setActiveTab('setup')} className={`p-2 rounded-full transition-all ${activeTab === 'setup' ? 'bg-slate-100 text-slate-700 scale-110 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}><Settings size={20} /></button>
        </nav>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-md mx-auto">
        {activeTab === 'mind' && <Mind />}
        {activeTab === 'todo' && <Todo />}
        {activeTab === 'history' && <History />}
        {activeTab === 'journey' && <Journey />}
        {activeTab === 'setup' && <Setup />} {/* ĐÃ KẾT NỐI */}
      </main>

      {/* 3. BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 flex justify-around items-center z-40 pb-safe">
        <button onClick={() => setActiveTab('mind')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'mind' ? 'text-blue-600 -translate-y-2' : 'text-slate-300'}`}>
          <Brain size={24} strokeWidth={activeTab === 'mind' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Hiện tại</span>
        </button>
        <button onClick={() => setActiveTab('todo')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'todo' ? 'text-blue-600 -translate-y-2' : 'text-slate-300'}`}>
          <ListTodo size={24} strokeWidth={activeTab === 'todo' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Todo-List</span>
        </button>
      </div>
    </div>
  );
}

export default App;