import React, { useState } from 'react';
import Mind from './components/Mind';
import Todo from './components/Todo';
import History from './components/History';
import Identity from './components/Identity';
import Journey from './components/Journey'; // Tab Hành trình mới
import Setup from './components/Setup';     // Tab Setup mới
import { Target, Brain, History as HistoryIcon, Fingerprint, Activity, Settings } from 'lucide-react';

function App() {
  // Mặc định vào Tab Hiện tại khi mở App
  const [activeTab, setActiveTab] = useState<'todo' | 'mind' | 'history' | 'identity' | 'journey' | 'setup'>('mind');

  const renderContent = () => {
    switch (activeTab) {
      case 'todo': return <Todo />;
      case 'mind': return <Mind />;
      case 'history': return <History />;
      case 'identity': return <Identity />;
      case 'journey': return <Journey />;
      case 'setup': return <Setup />;
      default: return <Mind />;
    }
  };

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER: HÀNH TRÌNH (GIỮA) & SETUP (PHẢI) */}
        <header className="px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-slate-100 z-50">
          <div className="w-10"></div> {/* Spacer bên trái */}
          
          <button 
            onClick={() => setActiveTab('journey')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${activeTab === 'journey' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Activity size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Hành trình</span>
          </button>

          <button 
            onClick={() => setActiveTab('setup')}
            className={`p-2 rounded-full transition-all ${activeTab === 'setup' ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* NỘI DUNG CHÍNH - pb-32 để không bị che footer */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {renderContent()}
        </main>

        {/* FOOTER: 4 TAB CHÍNH */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 px-6 py-3 rounded-[2rem] shadow-xl z-50 flex gap-6 items-center">
          
          <button onClick={() => setActiveTab('todo')} className={`flex flex-col items-center gap-1 ${activeTab === 'todo' ? 'text-blue-600' : 'text-slate-300'}`}>
            <Target size={22} strokeWidth={activeTab === 'todo' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Sa bàn</span>
          </button>

          <button onClick={() => setActiveTab('mind')} className={`flex flex-col items-center gap-1 ${activeTab === 'mind' ? 'text-blue-600' : 'text-slate-300'}`}>
            <Brain size={22} strokeWidth={activeTab === 'mind' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Hiện tại</span>
          </button>

          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-300'}`}>
            <HistoryIcon size={22} strokeWidth={activeTab === 'history' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Nhật ký</span>
          </button>

          <button onClick={() => setActiveTab('identity')} className={`flex flex-col items-center gap-1 ${activeTab === 'identity' ? 'text-purple-600' : 'text-slate-300'}`}>
            <Fingerprint size={22} strokeWidth={activeTab === 'identity' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Căn tính</span>
          </button>

        </nav>
      </div>
    </div>
  );
}

export default App;