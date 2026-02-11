// src/App.tsx
import React, { useState } from 'react';
import { Settings, Star, Layers, Zap, Map } from 'lucide-react';
import { useUserStore } from './store/userStore';
import { useUIStore } from './store/uiStore'; // Import UI Store

import { SetupView } from './modules/setup/SetupView';
import { SparkNotification } from './modules/spark/components/SparkNotification';
import { HiddenTreasureView } from './modules/spark/HiddenTreasureView';
import { JourneyView } from './modules/journey/JourneyView';
import { InputBar } from './components/Input/InputBar';

// ... (Giữ nguyên các Placeholder Component cũ: SabanPlaceholder, FocusPlaceholder)
const SabanPlaceholder = () => <div className="p-10 text-center text-slate-400">Saban View</div>;
const FocusPlaceholder = () => <div className="p-10 text-center text-slate-400">Focus View</div>;

export const App = () => {
  const user = useUserStore();
  const isTyping = useUIStore(state => state.isTyping); // Lấy trạng thái Typing
  
  const [showSetup, setShowSetup] = useState(false);
  const [showTreasure, setShowTreasure] = useState(false);
  const [activeTab, setActiveTab] = useState<'saban' | 'mind' | 'journey'>('mind');

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col text-slate-800 font-sans overflow-hidden">
      
      {/* 1. HEADER (Ẩn khi Typing để Input bám lên, hoặc giữ lại tùy ý bạn. 
          Theo yêu cầu "Input bám lấy header", ta giữ Header nhưng ẩn các nút xung quanh nếu cần) */}
      <header className={`px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 transition-all duration-300 ${isTyping ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-10"></div>
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer">
            <Star size={24} className="text-yellow-400 fill-yellow-400" />
            <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[8px] font-bold px-1 rounded-full">{user.level}</span>
          </div>
        </div>
        <button onClick={() => setShowSetup(true)}><Settings size={20} className="text-slate-400" /></button>
      </header>

      {/* 2. MAIN BODY (Ẩn hoàn toàn khi Typing) */}
      <main className={`flex-1 overflow-y-auto pb-40 transition-opacity duration-300 ${isTyping ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}> 
        {activeTab === 'saban' && <SabanPlaceholder />}
        {activeTab === 'mind' && <FocusPlaceholder />}
        {activeTab === 'journey' && <JourneyView />}
      </main>

      {/* 3. INPUT BAR (Luôn hiển thị, logic vị trí xử lý bên trong Component) */}
      <div className={`fixed left-0 right-0 z-50 transition-all duration-500 ${isTyping ? 'top-16 bottom-0' : 'bottom-16'}`}>
        <InputBar />
      </div>

      {/* 4. FOOTER (Ẩn đi khi Typing) */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-40 pb-2 transition-transform duration-300 ${isTyping ? 'translate-y-full' : 'translate-y-0'}`}>
        <button onClick={() => setActiveTab('saban')} className="text-slate-400"><Layers size={20} /></button>
        <button onClick={() => setActiveTab('mind')} className="-top-5 relative"><div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center"><Zap size={24} /></div></button>
        <button onClick={() => setActiveTab('journey')} className="text-slate-400"><Map size={20} /></button>
      </nav>

      {/* OVERLAYS */}
      {showSetup && <SetupView onClose={() => setShowSetup(false)} />}
      <SparkNotification onOpenTreasure={() => setShowTreasure(true)} />
      {showTreasure && <HiddenTreasureView onClose={() => setShowTreasure(false)} />}
    </div>
  );
};