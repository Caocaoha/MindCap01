import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, LayoutGrid, BrainCircuit, History } from 'lucide-react';
import { useUIStore } from './store/ui-store';

// Modules
import { SabanBoard } from './modules/saban/saban-board';
import { InputBar } from './modules/input/input-bar';
import { SetupPanel } from './modules/setup/setup-panel';
import { JourneyList } from './modules/journey/journey-list';

export const App = () => {
  const { activeTab, setActiveTab, isInputMode, setInputMode } = useUIStore();
  const [isSetupOpen, setSetupOpen] = React.useState(false);

  return (
    <div className="fixed inset-0 bg-black text-zinc-100 overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-zinc-900 bg-black/50 backdrop-blur-xl z-50">
        <div className="w-8" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">Identity</span>
        </div>
        <button onClick={() => setSetupOpen(true)} className="p-2 text-zinc-500"><Settings size={20} /></button>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'saban' && <TabWrapper key="saban"><SabanBoard /></TabWrapper>}
          {activeTab === 'journey' && <TabWrapper key="journey"><JourneyList /></TabWrapper>}
          
          {activeTab === 'mind' && (
            <div className="h-full flex flex-col p-4">
              {/* FOCUS (Bám Header) - Ẩn khi InputMode bật */}
              <AnimatePresence>
                {!isInputMode && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                    className="flex-1 pt-4"
                  >
                    <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 text-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Current Focus</span>
                      <h2 className="text-xl font-medium mt-1 italic text-zinc-300">"Xây dựng hệ thống Rail UI"</h2>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT (Bám Footer / Bay lên Header) */}
              <motion.div 
                layout
                className={`absolute left-4 right-4 transition-all duration-500 z-50 ${
                  isInputMode ? 'top-4' : 'bottom-20'
                }`}
              >
                <InputBar />
              </motion.div>

              {/* Backdrop khi gõ */}
              {isInputMode && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setInputMode(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* NAVIGATION */}
      <nav className="h-16 border-t border-zinc-900 bg-black flex items-center justify-around z-50">
        <NavButton icon={<LayoutGrid />} label="Saban" active={activeTab === 'saban'} onClick={() => setActiveTab('saban')} />
        <NavButton icon={<BrainCircuit />} label="Mind" active={activeTab === 'mind'} onClick={() => setActiveTab('mind')} isCenter />
        <NavButton icon={<History />} label="Journey" active={activeTab === 'journey'} onClick={() => setActiveTab('journey')} />
      </nav>

      <AnimatePresence>{isSetupOpen && <SetupPanel onClose={() => setSetupOpen(false)} />}</AnimatePresence>
    </div>
  );
};

// Sub-components
const TabWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-4">{children}</motion.div>
);

const NavButton = ({ icon, label, active, onClick, isCenter }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-white' : 'text-zinc-600'} ${isCenter ? '-top-4 relative scale-125' : ''}`}>
    <div className={isCenter && active ? 'p-3 bg-teal-500 rounded-full text-black' : ''}>{icon}</div>
    {!isCenter && <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>}
  </button>
);