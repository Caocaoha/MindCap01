import React, { useEffect, useState } from 'react';
import { InputBar } from './modules/input/input-bar';
import { JourneyList } from './modules/journey/journey-list';
import { SabanBoard } from './modules/saban/saban-board';
import { FocusSession } from './modules/focus/focus-session';
import { IdentityCheckin } from './modules/identity/identity-checkin';
import { UserLevelBadge } from './modules/saban/ui/user-level-badge';

import { useIdentityStore } from './modules/identity/identity-store';
import { initializeNlpListener } from './store/middleware/nlp-listener';
import { useUiStore } from './store/ui-store';
import { useJourneyStore } from './store/journey-store';

export const App = () => {
  const [activeTab, setActiveTab] = useState<'saban' | 'mind' | 'journey'>('mind');
  
  // Store Hooks
  const { isFocusSessionActive, setFocusSessionActive, isInputMode } = useUiStore(); // [NEW] isInputMode
  const { setCheckinOpen } = useIdentityStore();
  const { entries } = useJourneyStore();

  const activeFocusCount = entries.filter((e: any) => e.isFocusMode && e.status !== 'completed').length;

  useEffect(() => {
    const cleanupListener = initializeNlpListener();
    return () => cleanupListener();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col relative overflow-hidden">
      
      {/* LAYERS */}
      {isFocusSessionActive && <FocusSession />}
      <IdentityCheckin />

      {/* HEADER (Luôn cố định) */}
      <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-20 transition-all duration-300">
        <div className="w-20"><span className="text-xs font-black text-gray-300 tracking-tighter">MIND CAP</span></div>
        
        {/* Nếu đang nhập liệu, Logo Identity nhỏ lại hoặc mờ đi để giảm nhiễu, ở đây ta giữ nguyên nhưng có thể chỉnh opacity */}
        <button 
          onClick={() => setCheckinOpen(true)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-b from-violet-100 to-white border border-violet-100 shadow-sm transition-all ${isInputMode ? 'opacity-50 scale-90' : 'hover:scale-105'}`}
        >
          <span className="text-2xl animate-pulse-slow">🧠</span>
        </button>

        <div className="w-20 flex justify-end"><UserLevelBadge /></div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 mt-16 mb-20 overflow-y-auto scroll-smooth">
        
        {activeTab === 'saban' && (
          <div className="animate-in slide-in-from-left duration-300"><SabanBoard /></div>
        )}

        {/* --- MIND TAB: LOGIC DISCLOSURE --- */}
        {activeTab === 'mind' && (
          <div className="h-full flex flex-col relative">
            
            {/* 1. FOCUS WIDGET: Chỉ hiện khi KHÔNG nhập liệu */}
            {!isInputMode && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-indigo-600 text-white p-4 shadow-md rounded-b-2xl mx-2 mt-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Chế độ Tập trung</h3>
                    <p className="text-indigo-200 text-xs">{activeFocusCount}/4 Nhiệm vụ</p>
                  </div>
                  <button 
                    onClick={() => setFocusSessionActive(true)}
                    disabled={activeFocusCount === 0}
                    className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all ${
                      activeFocusCount > 0 ? 'bg-white text-indigo-600' : 'bg-indigo-800 text-indigo-400'
                    }`}
                  >
                    {activeFocusCount > 0 ? 'VÀO ZONE 🚀' : 'CHỌN TASK'}
                  </button>
                </div>
              </div>
            )}

            {/* 2. AREA GIỮA: Chỉ hiện khi KHÔNG nhập liệu */}
            {!isInputMode && (
              <div className="flex-1 flex items-center justify-center p-6 opacity-30 pointer-events-none animate-in fade-in duration-500 delay-100">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧘</div>
                  <p className="font-serif italic text-gray-500">"Tĩnh lặng để đi xa hơn."</p>
                </div>
              </div>
            )}

            {/* 3. BACKGROUND MỜ KHI NHẬP LIỆU (Tạo cảm giác Zen) */}
            {isInputMode && (
               <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-0 animate-in fade-in duration-300" />
            )}

            {/* 4. INPUT BAR: Thay đổi vị trí dựa trên isInputMode */}
            <div className={`
                transition-all duration-300 ease-in-out z-10 w-full left-0 px-2
                ${isInputMode 
                  ? 'fixed top-20' // Bay lên bám Header (Header cao 16 + margin 4)
                  : 'absolute bottom-2' // Bám Footer
                }
            `}>
               <InputBar /> 
               {/* Gợi ý nhỏ khi đang nhập */}
               {isInputMode && (
                 <div className="text-center mt-4 text-xs text-gray-400 animate-in fade-in delay-200">
                   Nhấn Enter để lưu • Shift+Enter xuống dòng
                 </div>
               )}
            </div>

          </div>
        )}

        {activeTab === 'journey' && (
          <div className="animate-in slide-in-from-right duration-300"><JourneyList /></div>
        )}
      </main>

      {/* FOOTER (Ẩn đi khi nhập liệu để có thêm không gian cho bàn phím ảo?) 
          Thường thì nên ẩn footer khi keyboard bật lên trên mobile web để tránh layout shift.
          Với logic này, khi isInputMode = true, ta có thể ẩn Navbar đi.
      */}
      {!isInputMode && (
        <nav className="h-16 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-20 flex justify-between items-center px-6 pb-safe animate-in slide-in-from-bottom duration-200">
          <button onClick={() => setActiveTab('saban')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'saban' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-[10px] font-bold uppercase">Saban</span>
          </button>

          <button onClick={() => setActiveTab('mind')} className="relative -top-5">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-50 transition-all ${activeTab === 'mind' ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white scale-110' : 'bg-white text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" /></svg>
            </div>
          </button>

          <button onClick={() => setActiveTab('journey')} className={`flex flex-col items-center gap-1 w-16 ${activeTab === 'journey' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-[10px] font-bold uppercase">History</span>
          </button>
        </nav>
      )}
    </div>
  );
};