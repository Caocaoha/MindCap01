import React, { useEffect, useState } from 'react';
import { useUiStore } from './store/ui-store';
import { triggerHaptic } from './utils/haptic';
import { db } from './database/db'; 
import { useJourneyStore } from './store/journey-store'; 
import { useIdentityStore } from './modules/identity/identity-store'; 
import { FocusSession } from './modules/focus/focus-session';
import { InputBar } from './modules/input/input-bar';
import { SabanBoard } from './modules/saban/saban-board';
import { JourneyList } from './modules/journey/journey-list';
import { SetupPanel } from './modules/setup/setup-panel';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { IdentityDashboard } from './modules/identity/identity-dashboard'; 
import { EntryModal } from './modules/input/components/entry-modal';
import { SparkNotification } from './modules/spark/components/spark-notification';
import { UniversalEditModal } from './modules/input/components/universal-edit-modal';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, isInputFocused, setInputFocused, setTyping, openEditModal } = useUiStore();
  const { setTasks } = useJourneyStore(); 
  const { progress, openAudit, getPulseFrequency } = useIdentityStore();
  const frequency = getPulseFrequency();

  // [NEW]: Đăng ký Service Worker để xử lý click thông báo và chạy ngầm
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  // Khởi tạo dữ liệu (Bảo tồn 100%)
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

  /**
   * [DEEP LINKING HANDLER]: Lắng nghe tham số điều hướng.
   */
  useEffect(() => {
    const handleDeepLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const openTarget = params.get('open');
      
      if (openTarget && openTarget.includes(':')) {
        const [type, idStr] = openTarget.split(':');
        const entryId = parseInt(idStr, 10);

        if (!isNaN(entryId)) {
          try {
            const table = type === 'task' ? db.tasks : db.thoughts;
            const entry = await table.get(entryId);

            if (entry) {
              triggerHaptic('medium');
              openEditModal(entry);
              // Xóa tham số trên URL sau khi đã xử lý để tránh reload lại modal
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (error) {
            console.error("Deep Link Error:", error);
          }
        }
      }

      const createLinkTarget = params.get('create-link-to');
      if (createLinkTarget && createLinkTarget.includes(':')) {
        const [type, idStr] = createLinkTarget.split(':');
        const entryId = parseInt(idStr, 10);

        if (!isNaN(entryId)) {
          try {
            const table = type === 'task' ? db.tasks : db.thoughts;
            const parentEntry = await table.get(entryId);
            if (parentEntry) {
              triggerHaptic('heavy');
              openEditModal({
                content: '',
                type: 'thought',
                wordCount: 0,
                createdAt: Date.now(),
                recordStatus: 'pending',
                parentId: parentEntry.id,
                isLinkMode: true
              } as any);
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (error) {
            console.error("Create Link Deep Link Error:", error);
          }
        }
      }
    };

    handleDeepLink();
  }, [openEditModal]);

  // Xử lý phím tắt (Bảo tồn 100%)
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
    <div className="h-screen w-full bg-white text-slate-900 overflow-hidden flex flex-col font-sans select-none">
      <header className="h-16 flex items-center justify-center px-6 relative z-[60] border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <button 
          onClick={() => { 
            triggerHaptic('medium'); 
            if (activeTab === 'identity') openAudit(); 
            else setActiveTab('identity'); 
          }} 
          style={{ '--pulse-duration': `${frequency}s` } as React.CSSProperties}
          className={`transition-all duration-500 outline-none
            ${activeTab === 'identity' ? 'text-yellow-500 scale-125 animate-pulse-custom' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="5" fill={activeTab === 'identity' ? 'currentColor' : 'none'}/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('setup'); }} 
          className={`absolute right-6 transition-colors ${activeTab === 'setup' ? 'text-[#2563EB]' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </header>

      <main className="flex-1 relative px-4 overflow-hidden bg-white">
        {activeTab === 'saban' && <SabanBoard />}
        {activeTab === 'journey' && <JourneyList />}
        {activeTab === 'setup' && <SetupPanel />}
        {activeTab === 'identity' && <IdentityDashboard />}
        
        {activeTab === 'mind' && (
          <div className="h-full flex flex-col relative">
            <div className={`relative z-20 h-full overflow-y-auto pb-32 transition-all duration-700 ease-in-out ${isInputFocused ? 'opacity-0 -translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <FocusSession />
            </div>
            
            <div className={`absolute left-0 right-0 z-50 transition-all duration-500 ease-out ${isInputFocused ? 'top-0 h-screen bg-white/90 backdrop-blur-sm' : 'bottom-10 sm:bottom-6 h-auto'} pointer-events-none`}>
              <div className="pointer-events-auto">
                <InputBar onFocus={() => { triggerHaptic('light'); setInputFocused(true); }} onBlur={() => setInputFocused(false)} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`h-20 flex items-center justify-between px-10 relative z-30 border-t border-slate-200 bg-white transition-transform duration-500 ${isInputFocused ? 'translate-y-24' : 'translate-y-0'}`}>
        <button onClick={() => { triggerHaptic('light'); setActiveTab('saban'); }} className={`text-[11px] font-bold transition-colors ${activeTab === 'saban' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Todo</button>
        <button onClick={() => { triggerHaptic('medium'); setActiveTab('mind'); }} className={`px-8 py-2 rounded-[6px] font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'mind' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Today</button>
        <button onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }} className={`text-[11px] font-bold transition-colors ${activeTab === 'journey' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>To.Morrow</button>
      </footer>

      <IdentityCheckin />
      <EntryModal />
      <SparkNotification />
      <UniversalEditModal />
    </div>
  );
};