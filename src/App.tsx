import React, { useEffect } from 'react';
import { useUiStore } from './store/ui-store';
import { triggerHaptic } from './utils/haptic';
import { db } from './database/db'; 
import { useJourneyStore } from './store/journey-store'; 
import { useIdentityStore } from './modules/identity/identity-store'; // [BỔ SUNG]
import { FocusSession } from './modules/focus/focus-session';
import { InputBar } from './modules/input/input-bar';
import { SabanBoard } from './modules/saban/saban-board';
import { JourneyList } from './modules/journey/journey-list';
import { SetupPanel } from './modules/setup/setup-panel';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { IdentityDashboard } from './modules/identity/identity-dashboard'; 
import { EntryModal } from './modules/input/components/entry-modal';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, isInputFocused, setInputFocused, setTyping } = useUiStore();
  const { setTasks } = useJourneyStore(); 
  // [BỔ SUNG]: Lấy logic nhịp thở từ IdentityStore
  const { progress, openAudit, getPulseFrequency } = useIdentityStore();
  const frequency = getPulseFrequency();

  useEffect(() => {
    const initializeData = async () => {
      try {
        const rawTasks = await db.tasks.toArray();
        const sanitizedTasks = rawTasks.map(t => ({
          ...t,
          doneCount: Number(t.doneCount || 0),
          targetCount: Number(t.targetCount || 1),
          createdAt: Number(t.createdAt || Date.now()),
          status: (t.status || 'todo') as 'todo' | 'done' | 'backlog'
        }));
        setTasks(sanitizedTasks);
      } catch (error) {
        console.error("MindCap Initialization Error:", error);
      }
    };
    initializeData();
  }, [setTasks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputFocused(false);
        setTyping(false);
        return;
      }
      if (activeTab === 'mind' && !isInputFocused) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 || e.key === 'Enter') {
          triggerHaptic('light');
          setInputFocused(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isInputFocused, setInputFocused, setTyping]);

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden flex flex-col font-sans select-none">
      
      {/* --- HEADER: Hợp nhất Mặt trời Bio-Pulse --- */}
      <header className="h-16 flex items-center justify-center px-6 relative z-[60]">
        <button 
          onClick={() => { 
            triggerHaptic('medium'); 
            if (activeTab === 'identity') openAudit(); // Nếu đang ở tab, click để mở audit
            else setActiveTab('identity'); 
          }} 
          style={{ '--pulse-duration': `${frequency}s` } as React.CSSProperties}
          className={`transition-all duration-500 outline-none
            ${activeTab === 'identity' ? 'text-yellow-500 scale-125 animate-pulse-custom' : 'opacity-20 hover:opacity-100'}`}
        >
          {/* Icon Mặt trời */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="5" fill={activeTab === 'identity' ? 'currentColor' : 'none'}/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>

        <button onClick={() => { triggerHaptic('light'); setActiveTab('setup'); }} className={`absolute right-6 transition-opacity ${activeTab === 'setup' ? 'text-blue-400' : 'opacity-20'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </header>

      <main className="flex-1 relative px-4 overflow-hidden">
        {activeTab === 'saban' && <SabanBoard />}
        {activeTab === 'journey' && <JourneyList />}
        {activeTab === 'setup' && <SetupPanel />}
        {activeTab === 'identity' && <IdentityDashboard />}
        
        {activeTab === 'mind' && (
          <div className="h-full flex flex-col relative">
            <div className={`relative z-50 h-full overflow-y-auto pb-32 transition-all duration-700 ease-in-out ${isInputFocused ? 'opacity-0 -translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <FocusSession />
            </div>
            
            {/* [FIX]: Điều chỉnh z-index và bottom margin cho iPhone Safe Area */}
            <div className={`absolute left-0 right-0 z-40 transition-all duration-500 ease-out ${isInputFocused ? 'top-0 h-screen bg-black/80' : 'bottom-10 sm:bottom-6 h-auto'} pointer-events-none`}>
              <div className="pointer-events-auto">
                <InputBar onFocus={() => { triggerHaptic('light'); setInputFocused(true); }} onBlur={() => setInputFocused(false)} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`h-20 flex items-center justify-between px-10 relative z-30 transition-transform duration-500 ${isInputFocused ? 'translate-y-24' : 'translate-y-0'}`}>
        <button onClick={() => { triggerHaptic('light'); setActiveTab('saban'); }} className={`transition-all ${activeTab === 'saban' ? 'text-white' : 'opacity-20'}`}>Saban</button>
        <button onClick={() => { triggerHaptic('medium'); setActiveTab('mind'); }} className={`px-8 py-2 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'mind' ? 'bg-white text-black scale-110 shadow-xl' : 'bg-zinc-900 opacity-40'}`}>Mind</button>
        <button onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }} className={`transition-all ${activeTab === 'journey' ? 'text-white' : 'opacity-20'}`}>Journey</button>
      </footer>

      <IdentityCheckin />
      <EntryModal />
    </div>
  );
};