import React, { useState } from 'react';
import { SabanBoard } from './modules/saban/saban-board';
import { FocusSession } from './modules/focus/focus-session';
import { InputBar } from './modules/input/input-bar';
import { JourneyList } from './modules/journey/journey-list';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { SetupPanel } from './modules/setup/setup-panel';

/**
 * [MAIN LAYOUT]: Điều phối Step-by-step Disclosure
 * Quản lý trạng thái hiển thị dựa trên Tab và Tiêu điểm nhập liệu.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<'saban' | 'mind' | 'journey'>('mind');
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* HEADER: Identity (Center) & Setup (Right) */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 z-50 bg-black">
        <div className="w-10" /> {/* Spacer cho đối trọng */}
        <div className="flex-1 flex justify-center">
          <IdentityCheckin />
        </div>
        <div className="w-10 flex justify-end">
          <SetupPanel />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative p-4">
        {activeTab === 'saban' && <SabanBoard />}
        
        {activeTab === 'mind' && (
          <div className="flex flex-col h-full">
            {/* Logic: Nếu đang gõ (isInputFocused), ẩn Focus để tập trung tuyệt đối */}
            {!isInputFocused && (
              <div className="flex-1 transition-all duration-500 ease-in-out">
                <FocusSession />
              </div>
            )}
            
            {/* Khi Input Focused, nó sẽ bám lên sát Header nhờ logic CSS */}
            <div className={`transition-all duration-500 ${isInputFocused ? 'fixed inset-x-0 top-14 bottom-0 bg-black z-40 p-4' : ''}`}>
              <InputBar 
                onFocus={() => setIsInputFocused(true)} 
                onBlur={() => setIsInputFocused(false)} 
              />
            </div>
          </div>
        )}

        {activeTab === 'journey' && <JourneyList />}
      </main>

      {/* FOOTER: Saban (Left), Mind (Center), Journey (Right) */}
      <footer className={`h-16 border-t border-white/5 flex items-center justify-around px-6 bg-black z-50 transition-transform duration-300 ${isInputFocused ? 'translate-y-full' : 'translate-y-0'}`}>
        <button 
          onClick={() => setActiveTab('saban')}
          className={`text-[10px] font-black tracking-widest ${activeTab === 'saban' ? 'text-blue-500' : 'opacity-40'}`}
        >
          SABAN
        </button>

        <button 
          onClick={() => setActiveTab('mind')}
          className={`px-6 py-2 rounded-full border-2 transition-all ${
            activeTab === 'mind' ? 'border-blue-500 text-blue-500 scale-110' : 'border-white/10 opacity-40'
          }`}
        >
          MIND
        </button>

        <button 
          onClick={() => setActiveTab('journey')}
          className={`text-[10px] font-black tracking-widest ${activeTab === 'journey' ? 'text-blue-500' : 'opacity-40'}`}
        >
          JOURNEY
        </button>
      </footer>
    </div>
  );
}