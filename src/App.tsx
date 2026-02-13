import React, { useEffect } from 'react';
import { useUiStore } from './store/ui-store';
import { triggerHaptic } from './utils/haptic';

// Import các Module dựa trên cấu trúc folder thực tế
import { FocusSession } from './modules/focus/focus-session';
import { InputBar } from './modules/input/input-bar';
import { SabanBoard } from './modules/saban/saban-board';
import { JourneyList } from './modules/journey/journey-list';
import { SetupPanel } from './modules/setup/setup-panel';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { EntryModal } from './modules/input/components/entry-modal';

export const App: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isInputFocused, 
    setInputFocused, 
    setTyping 
  } = useUiStore();

  // Logic lắng nghe bàn phím điều hướng và nhập liệu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím tắt Escape để thoát chế độ nhập liệu
      if (e.key === 'Escape') {
        setInputFocused(false);
        setTyping(false);
        return;
      }

      // 2. Tự động kích hoạt Step-by-step Disclosure khi đang ở tab Mind
      if (activeTab === 'mind' && !isInputFocused) {
        // Tránh kích hoạt khi đang gõ trong một ô input hoặc textarea khác
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        
        // Bỏ qua các phím điều khiển (Ctrl, Alt, Meta, Shift)
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Nếu nhấn phím ký tự hoặc Enter -> Kích hoạt Input
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
      
      {/* --- HEADER: Identity (Center) & Setup (Right) --- */}
      <header className="h-16 flex items-center justify-center px-6 relative z-50">
        <button 
          onClick={() => { triggerHaptic('medium'); setActiveTab('identity'); }}
          className={`transition-all duration-500 ${activeTab === 'identity' ? 'text-yellow-500 scale-110' : 'opacity-20'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('setup'); }}
          className={`absolute right-6 transition-opacity ${activeTab === 'setup' ? 'text-blue-400' : 'opacity-20'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative px-4 overflow-hidden">
        {activeTab === 'saban' && <SabanBoard />}
        {activeTab === 'journey' && <JourneyList />}
        {activeTab === 'setup' && <SetupPanel />}
        {activeTab === 'identity' && <IdentityCheckin />}
        
        {/* VIEW: MIND (Focus + Input) */}
        {activeTab === 'mind' && (
          <div className="h-full flex flex-col relative">
            <div className={`transition-all duration-700 ease-in-out ${isInputFocused ? 'opacity-0 -translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <FocusSession />
            </div>

            <div className={`absolute left-0 right-0 transition-all duration-500 ease-out ${isInputFocused ? 'top-0' : 'bottom-6'}`}>
              <InputBar 
                onFocus={() => { triggerHaptic('light'); setInputFocused(true); }}
                onBlur={() => setInputFocused(false)}
              />
            </div>
          </div>
        )}
      </main>

      {/* --- FOOTER: Saban (Left), Mind (Center), Journey (Right) --- */}
      <footer className={`h-20 flex items-center justify-between px-10 transition-transform duration-500 ${isInputFocused ? 'translate-y-24' : 'translate-y-0'}`}>
        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('saban'); }}
          className={`transition-all ${activeTab === 'saban' ? 'text-white' : 'opacity-20'}`}
        >
          Saban
        </button>

        <button 
          onClick={() => { triggerHaptic('medium'); setActiveTab('mind'); }}
          className={`px-8 py-2 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'mind' ? 'bg-white text-black scale-110 shadow-xl' : 'bg-zinc-900 opacity-40'}`}
        >
          Mind
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }}
          className={`transition-all ${activeTab === 'journey' ? 'text-white' : 'opacity-20'}`}
        >
          Journey
        </button>
      </footer>

      <EntryModal />
    </div>
  );
};