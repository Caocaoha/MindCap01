/**
 * Purpose: Bộ điều khiển bố cục chính (Main Layout Controller) của ứng dụng MindCap.
 * Inputs/Outputs: Quản lý trạng thái hiển thị của các Module dựa trên ActiveTab.
 * Business Rule: 
 * - Khởi tạo dữ liệu từ IndexedDB khi ứng dụng bắt đầu.
 * - Xử lý Deep Linking để mở nhanh các bản ghi hoặc tạo liên kết.
 * - Điều phối hiển thị giữa các phân vùng: Saban, Journey, Setup, Identity và Sync Review.
 */

import React, { useEffect } from 'react';
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
import { SyncDashboard } from './modules/setup/sync/sync-dashboard';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { IdentityDashboard } from './modules/identity/identity-dashboard'; 
import { EntryModal } from './modules/input/components/entry-modal';
import { SparkNotification } from './modules/spark/components/spark-notification';
import { UniversalEditModal } from './modules/input/components/universal-edit-modal';
// [NEW]: Import BottomNav component
import { BottomNav } from './components/shared/bottom-nav';

/**
 * [APP]: Main Layout Controller.
 * Giai đoạn 6.32: Phân tách BottomNav để tối ưu hóa bảo trì.
 */
export const App: React.FC = () => {
  const { activeTab, setActiveTab, isInputFocused, setInputFocused, setTyping, openEditModal } = useUiStore();
  const { setTasks } = useJourneyStore(); 
  const { openAudit, getPulseFrequency } = useIdentityStore();
  const frequency = getPulseFrequency();

  // Đăng ký Service Worker
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

  // Khởi tạo dữ liệu
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

  // Deep Linking Handler
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputFocused(false, 'mind');
        setTyping(false);
        return;
      }
      if (activeTab === 'mind' && !isInputFocused) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 || e.key === 'Enter') {
          triggerHaptic('light');
          setInputFocused(true, 'mind');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isInputFocused, setInputFocused, setTyping]);

  return (
    <div className="h-screen w-full bg-white text-slate-900 overflow-hidden flex flex-col font-sans select-none">
      
      {/* HEADER: Top Bun (Cố định) */}
      <header className="h-16 flex-none flex items-center justify-center px-6 relative z-[60] border-b border-slate-200 bg-white/80 backdrop-blur-md">
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

      {/* MAIN: Meat (Flex-1 co giãn) */}
      <main className="flex-1 relative overflow-hidden bg-white">
        {activeTab === 'saban' && <SabanBoard />}
        {activeTab === 'journey' && <JourneyList />}
        {activeTab === 'setup' && <SetupPanel />}
        {activeTab === 'identity' && <IdentityDashboard />}
        {activeTab === 'sync-review' && <SyncDashboard />}
        
        {activeTab === 'mind' && (
          <div className="absolute inset-0 flex flex-col">
            <div className={`flex-1 overflow-y-auto pb-24 transition-opacity duration-300 ${
              isInputFocused ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <FocusSession />
            </div>
            
            <div className={`absolute left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isInputFocused 
                ? 'top-0 bottom-0 h-full' 
                : 'bottom-0 h-auto'
            }`}>
              <InputBar 
                onFocus={() => { 
                  triggerHaptic('light'); 
                  setInputFocused(true, 'mind'); 
                }} 
                onBlur={() => setInputFocused(false, 'mind')} 
              />
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: Bottom Bun (Sử dụng Component tách biệt) */}
      <footer className={`h-20 flex-none relative z-40 border-t border-slate-200 bg-white transition-transform duration-500 ease-out ${
        isInputFocused ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <BottomNav />
      </footer>

      <IdentityCheckin />
      <EntryModal />
      <SparkNotification />
      <UniversalEditModal />
    </div>
  );
};