import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Layers, TrendingUp, History as HistoryIcon, Settings, Database } from 'lucide-react';

// Import các màn hình chức năng
import Mind from './components/Mind';
import Todo from './components/Todo';
import History from './components/History';
import Journey from './components/Journey';
import Setup from './components/Setup';

// Import Hook hệ thống
import { useMidnightReset } from './hooks/useMidnightReset';

type Tab = 'mind' | 'todo' | 'journey' | 'history' | 'setup';

const App: React.FC = () => {
  // 1. Kích hoạt đồng hồ sinh học cho hệ thống (Reset lúc 0h)
  useMidnightReset();

  // 2. State điều hướng
  const [activeTab, setActiveTab] = useState<Tab>('mind');

  // Helper xác định trạng thái Active cho Bottom Nav
  // (Chỉ active khi đang ở Mind hoặc Todo)
  const isBottomNavActive = (tab: Tab) => activeTab === tab;

  const renderContent = () => {
    switch (activeTab) {
      case 'mind': return <Mind />;
      case 'todo': return <Todo />;
      case 'journey': return <Journey />;
      case 'history': return <History />;
      case 'setup': return <Setup />;
      default: return <Mind />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* === HEADER: TRUNG TÂM QUẢN TRỊ (Sticky Top) === */}
      <header className="flex-none sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Left: Logo & Branding */}
          <div className="flex items-center gap-2" onClick={() => setActiveTab('mind')}>
            <div className="bg-slate-800 p-1.5 rounded-lg text-white">
              <Database size={16} />
            </div>
            <span className="font-black text-slate-800 tracking-tighter text-sm">MIND OS <span className="text-[10px] text-slate-400 font-medium">v3.2</span></span>
          </div>

          {/* Right: Management Nav (3 Buttons) */}
          <div className="flex items-center gap-1">
            <HeaderBtn 
              icon={<TrendingUp size={20} />} 
              isActive={activeTab === 'journey'} 
              onClick={() => setActiveTab('journey')} 
            />
            <HeaderBtn 
              icon={<HistoryIcon size={20} />} 
              isActive={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
            />
            <HeaderBtn 
              icon={<Settings size={20} />} 
              isActive={activeTab === 'setup'} 
              onClick={() => setActiveTab('setup')} 
            />
          </div>
        </div>
      </header>

      {/* === CONTENT AREA: KHÔNG GIAN HIỂN THỊ (Scrollable) === */}
      <main className="flex-1 overflow-y-auto relative z-0 scroll-smooth">
        <div className="min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* === BOTTOM NAV: TRUNG TÂM TÁC VỤ (Sticky Bottom) === */}
      <nav className="flex-none sticky bottom-0 z-50 bg-white border-t border-slate-200 pb-safe">
        <div className="max-w-md mx-auto h-16 grid grid-cols-2">
          
          <BottomBtn 
            icon={<Brain size={24} />} 
            label="Ý thức" 
            isActive={isBottomNavActive('mind')} 
            onClick={() => setActiveTab('mind')} 
          />
          
          <BottomBtn 
            icon={<Layers size={24} />} 
            label="Trí nhớ" 
            isActive={isBottomNavActive('todo')} 
            onClick={() => setActiveTab('todo')} 
          />
          
        </div>
      </nav>

    </div>
  );
};

// --- SUB COMPONENTS CHO NAV BUTTONS ---

const HeaderBtn: React.FC<{ icon: React.ReactNode, isActive: boolean, onClick: () => void }> = ({ icon, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    animate={{ scale: isActive ? 1.15 : 1 }}
    whileTap={{ scale: 0.9 }}
    className={`p-2.5 rounded-full transition-colors relative ${
      isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`}
  >
    {icon}
    {isActive && (
      <motion.div 
        layoutId="header-active-dot"
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
      />
    )}
  </motion.button>
);

const BottomBtn: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 relative"
    animate={{ scale: isActive ? 1.05 : 1 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className={`transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
      {label}
    </span>
    
    {/* Active Background Indicator (Optional: Subtle Glow) */}
    {isActive && (
      <motion.div 
        layoutId="bottom-active-glow"
        className="absolute inset-0 bg-blue-50/50 -z-10 rounded-xl m-2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      />
    )}
  </motion.button>
);

export default App;