import React, { useEffect, useState } from 'react';
import { initializeDatabase } from './db.init';
import { useMidnightReset } from './hooks/useMidnightReset';

// Tabs Components
import { MindTab } from './components/MindTab';
import { TodoTab } from './components/TodoTab';
import { StatsTab } from './components/StatsTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';

// Icons
import { 
  BrainCircuit, 
  CheckSquare, 
  BarChart3, 
  History, 
  Settings 
} from 'lucide-react';

// Định nghĩa các Tab
type TabType = 'mind' | 'todo' | 'stats' | 'history' | 'settings';

function App() {
  // 1. Khởi tạo hệ thống (Chạy 1 lần khi App mount)
  useEffect(() => { 
    initializeDatabase(); 
  }, []);

  // 2. Kích hoạt Service chạy ngầm: Midnight Reset
  useMidnightReset();

  // 3. State điều hướng
  const [activeTab, setActiveTab] = useState<TabType>('mind');

  // Helper Component: Nút điều hướng
  const NavItem = ({ tab, icon: Icon, label }: { tab: TabType, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-200 group
          ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-blue-50 transform scale-110' : 'group-hover:bg-slate-50'}`}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-medium mt-1">{label}</span>
      </button>
    );
  };

  return (
    // LỚP 1: Môi trường Desktop (Nền xám bao quanh)
    <div className="min-h-screen bg-slate-100 flex justify-center items-start font-sans">
      
      {/* LỚP 2: KHUNG THÉP (App Shell - Mobile Frame) 
          - max-w-md: Giới hạn chiều ngang như điện thoại
          - h-[100dvh]: Chiều cao full màn hình thiết bị động
          - overflow-hidden: Ngăn cuộn ở body, chỉ cuộn nội dung bên trong
      */}
      <div className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* --- A. STICKY HEADER (Safe Area Optimized) --- 
            - pt-[calc...]: Cộng thêm khoảng cách an toàn cho Tai thỏ (Notch)
        */}
        <header className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 pb-4 sticky top-0 z-50
          pt-[calc(env(safe-area-inset-top)+1rem)]">
          
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-slate-800 tracking-tight text-lg flex items-center gap-2 select-none">
              <BrainCircuit className="text-blue-600" size={24} />
              Mind OS
            </h1>
            
            {/* Avatar giả lập */}
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
              M
            </div>
          </div>
        </header>

        {/* --- B. MAIN CONTENT (Scrollable Area) --- 
            - flex-1: Chiếm toàn bộ không gian còn lại
            - overflow-y-auto: Chỉ vùng này được cuộn
        */}
        <main className="flex-1 overflow-y-auto scroll-smooth p-6 relative overscroll-y-contain">
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {activeTab === 'mind' && <MindTab />}
            {activeTab === 'todo' && <TodoTab />}
            {activeTab === 'stats' && <StatsTab />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </main>

        {/* --- C. BOTTOM NAVIGATION (Sticky Bottom) --- 
            - pb-[calc...]: Cộng thêm khoảng cách an toàn cho thanh Home ảo (Home Indicator)
        */}
        <nav className="flex-none bg-white border-t border-slate-100 z-50 sticky bottom-0
          pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 px-2">
          
          <div className="flex justify-between items-center max-w-sm mx-auto">
            <NavItem tab="mind" icon={BrainCircuit} label="Tâm trí" />
            <NavItem tab="todo" icon={CheckSquare} label="Việc làm" />
            <NavItem tab="stats" icon={BarChart3} label="Thống kê" />
            <NavItem tab="history" icon={History} label="Lịch sử" />
            <NavItem tab="settings" icon={Settings} label="Cài đặt" />
          </div>
        </nav>

      </div>
    </div>
  );
}

export default App;