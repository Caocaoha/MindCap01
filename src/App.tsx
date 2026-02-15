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
// [UNFREEZE]: Kích hoạt module Spark Notification 
// FIX: Điều chỉnh đường dẫn để khớp với vị trí tệp chuẩn trong Master Doc v3.2
import { SparkNotification } from './modules/spark/components/spark-notification';

// [NEW]: Tích hợp hệ thống Widget Memory
import { WidgetMemorySpark } from './modules/spark/components/widget-memory-spark';
import { WidgetProvider } from './modules/spark/widget-provider';

/**
 * [APP]: Main Layout Controller - Linear.app Aesthetic Update. 
 * Giai đoạn 6.1: Nâng cấp Deep Linking để xử lý tương tác V2.1 (Double Click & Long Press).
 */
export const App: React.FC = () => {
  // Bổ sung openEditModal để phục vụ Deep Linking
  const { activeTab, setActiveTab, isInputFocused, setInputFocused, setTyping, openEditModal } = useUiStore();
  const { setTasks } = useJourneyStore(); 
  const { progress, openAudit, getPulseFrequency } = useIdentityStore();
  const frequency = getPulseFrequency();

  // [NEW STATE]: Quản lý dữ liệu dòng chảy ký ức
  const [widgetData, setWidgetData] = useState<any>(null);

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
   * [WIDGET LOADER]: Nạp dữ liệu khi tab Today (Mind) được kích hoạt.
   */
  useEffect(() => {
    if (activeTab === 'mind') {
      const loadWidget = async () => {
        try {
          const timeline = await WidgetProvider.GetWidgetTimeline();
          if (timeline && timeline.length > 0) {
            setWidgetData(timeline[0]);
          }
        } catch (error) {
          console.error("Widget loading error:", error);
        }
      };
      loadWidget();
    }
  }, [activeTab]);

  /**
   * [DEEP LINKING HANDLER]: Lắng nghe các tham số điều hướng từ Widget.
   * Hỗ trợ 2 luồng: 
   * 1. /?open=... (Double Click - Mở xem bản ghi)
   * 2. /?create-link-to=... (Long Press - Tạo bản ghi liên kết mới)
   */
  useEffect(() => {
    const handleDeepLink = async () => {
      const params = new URLSearchParams(window.location.search);
      
      // LUỒNG 1: DOUBLE CLICK - MỞ BẢN GHI HIỆN TẠI
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

      // LUỒNG 2: LONG PRESS - TẠO BẢN GHI LIÊN KẾT MỚI
      const createLinkTarget = params.get('create-link-to');
      if (createLinkTarget && createLinkTarget.includes(':')) {
        const [type, idStr] = createLinkTarget.split(':');
        const entryId = parseInt(idStr, 10);

        if (!isNaN(entryId)) {
          try {
            const table = type === 'task' ? db.tasks : db.thoughts;
            const parentEntry = await table.get(entryId);

            if (parentEntry) {
              // Phản hồi rung mạnh cho hành động kiến tạo
              triggerHaptic('heavy');
              
              /**
               * FIX [TS2345]: Bổ sung đầy đủ các trường bắt buộc của IThought để thỏa mãn TypeCheck.
               */
              openEditModal({
                content: '',
                type: 'thought',
                wordCount: 0,
                createdAt: Date.now(),
                recordStatus: 'pending',
                parentId: parentEntry.id, // Truyền context liên kết
                isLinkMode: true          // Cờ đánh dấu chế độ liên kết
              });

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
    /* GIAO DIỆN CHÍNH: Nền trắng tuyệt đối, chữ Slate-900, Font Inter (font-sans) */
    <div className="h-screen w-full bg-white text-slate-900 overflow-hidden flex flex-col font-sans select-none">
      
      {/* HEADER: Border mảnh 1px #E2E8F0, không đổ bóng */}
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

      {/* MAIN CONTENT Area */}
      <main className="flex-1 relative px-4 overflow-hidden bg-white">
        {activeTab === 'saban' && <SabanBoard />}
        {activeTab === 'journey' && <JourneyList />}
        {activeTab === 'setup' && <SetupPanel />}
        {activeTab === 'identity' && <IdentityDashboard />}
        
        {activeTab === 'mind' && (
          <div className="h-full flex flex-col relative">
            <div className={`relative z-20 h-full overflow-y-auto pb-32 transition-all duration-700 ease-in-out ${isInputFocused ? 'opacity-0 -translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              
              <FocusSession />

              {/* [NEW] VỊ TRÍ 2: Widget đặt dưới vị trí của Focus */}
              {widgetData && (
                <div className="mt-8 animate-in fade-in duration-1000">
                  <div className="mx-4 border-t border-slate-100 mb-6" />
                  <WidgetMemorySpark data={widgetData} />
                </div>
              )}
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
        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('saban'); }} 
          className={`text-[11px] font-bold transition-colors ${activeTab === 'saban' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Todo
        </button>

        <button 
          onClick={() => { triggerHaptic('medium'); setActiveTab('mind'); }} 
          className={`px-8 py-2 rounded-[6px] font-bold uppercase text-[10px] tracking-widest transition-all
            ${activeTab === 'mind' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Today
        </button>

        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }} 
          className={`text-[11px] font-bold transition-colors ${activeTab === 'journey' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          To.Morrow
        </button>
      </footer>

      <IdentityCheckin />
      <EntryModal />
      <SparkNotification />
    </div>
  );
};