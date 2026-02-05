import React, { useState } from 'react';
import Mind from './components/Mind';
import Todo from './components/Todo';
import History from './components/History';
import Identity from './components/Identity';
import { Target, Brain, History as HistoryIcon, Fingerprint } from 'lucide-react';

function App() {
  // Mặc định vào Tab Hiện tại (Mind)
  const [activeTab, setActiveTab] = useState<'todo' | 'mind' | 'history' | 'identity'>('mind');

  const renderContent = () => {
    switch (activeTab) {
      case 'todo': return <Todo />;
      case 'mind': return <Mind />;
      case 'history': return <History />;
      case 'identity': return <Identity />;
      default: return <Mind />;
    }
  };

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl flex flex-col">
        
        {/* Vùng nội dung chính - pb-32 để tránh che khuất footer */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {renderContent()}
        </main>

        {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 px-6 py-3 rounded-[2rem] shadow-xl z-50 flex gap-6 items-center">
          
          {/* Tab Sa bàn (Todo) */}
          <button 
            onClick={() => setActiveTab('todo')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'todo' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
          >
            <Target size={22} strokeWidth={activeTab === 'todo' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Sa bàn</span>
          </button>

          {/* Tab Hiện tại (Mind) */}
          <button 
            onClick={() => setActiveTab('mind')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'mind' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
          >
            <Brain size={22} strokeWidth={activeTab === 'mind' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Hiện tại</span>
          </button>

          {/* Tab Nhật ký (History) */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
          >
            <HistoryIcon size={22} strokeWidth={activeTab === 'history' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Nhật ký</span>
          </button>

          {/* Tab Căn tính (Identity) */}
          <button 
            onClick={() => setActiveTab('identity')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'identity' ? 'text-purple-600 scale-110' : 'text-slate-300'}`}
          >
            <Fingerprint size={22} strokeWidth={activeTab === 'identity' ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Căn tính</span>
          </button>

        </nav>
      </div>
    </div>
  );
}

export default App;