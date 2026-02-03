import React, { useState } from 'react';
import { MindTab } from './components/MindTab';
import { TodoTab } from './components/TodoTab';
import { HistoryTab } from './components/HistoryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { Brain, CheckSquare, Clock, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

// Component nút chuyển Tab ở dưới đáy
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={clsx(
      "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200", 
      active ? "text-blue-600 scale-105" : "text-slate-400 hover:text-slate-600"
    )}
  >
    <Icon size={active ? 24 : 22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-semibold">{label}</span>
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState('MIND');
  const [overlayMode, setOverlayMode] = useState<'NONE' | 'STATS' | 'SETTINGS'>('NONE');

  // Hàm render nội dung dựa trên Tab đang chọn
  const renderContent = () => {
    if (overlayMode === 'STATS') return <StatsTab onBack={() => setOverlayMode('NONE')} />;
    if (overlayMode === 'SETTINGS') return <SettingsTab onBack={() => setOverlayMode('NONE')} />;
    
    switch (activeTab) {
      case 'MIND': return <MindTab />;
      case 'TODO': return <TodoTab />;
      case 'HISTORY': return <HistoryTab />;
      default: return <MindTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header Overlay (Chỉ hiện khi vào Stats hoặc Settings) */}
      {overlayMode !== 'NONE' && (
         <header className="bg-white border-b border-slate-200 px-4 h-14 sticky top-0 z-30 flex items-center gap-2 max-w-md mx-auto">
           <button onClick={() => setOverlayMode('NONE')} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
             <ChevronLeft size={20}/>
           </button>
           <h1 className="text-lg font-bold text-slate-800">
             {overlayMode === 'STATS' ? 'Thống kê' : 'Cài đặt'}
           </h1>
         </header>
      )}

      {/* Main Content Area */}
      <main className={clsx(
        "mx-auto max-w-md bg-white min-h-screen shadow-sm border-x border-slate-100",
        // Thêm padding dưới để không bị thanh menu che mất nội dung cuối
        overlayMode === 'NONE' ? "pb-20" : ""
      )}>
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar (Fixed) */}
      {overlayMode === 'NONE' && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center z-50 max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <TabButton 
            active={activeTab === 'MIND'} 
            onClick={() => setActiveTab('MIND')} 
            icon={Brain} 
            label="Tâm trí" 
          />
          <TabButton 
            active={activeTab === 'TODO'} 
            onClick={() => setActiveTab('TODO')} 
            icon={CheckSquare} 
            label="Việc làm" 
          />
          <TabButton 
            active={activeTab === 'HISTORY'} 
            onClick={() => setActiveTab('HISTORY')} 
            icon={Clock} 
            label="Lịch sử" 
          />
        </nav>
      )}
    </div>
  );
}

export default App;