import React, { useState } from 'react';
import { ManifestoTab } from './ManifestoTab';
import { HistoryTab } from './HistoryTab';
import { MemoryRoom } from './MemoryRoom';
import { LayoutDashboard, History } from 'lucide-react';
import { useIdentityStore } from '../store';

interface IdentityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdentityDashboard: React.FC<IdentityDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'manifesto' | 'history'>('manifesto');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const { hasCompletedOnboarding } = useIdentityStore();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-slate-950 flex flex-col animate-in fade-in duration-300">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <h1 className="text-lg font-bold tracking-wider text-yellow-500 flex items-center gap-2">
            THE NORTH STAR
          </h1>
          
          {/* Tab Switcher */}
          {hasCompletedOnboarding && (
            <div className="flex p-1 bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('manifesto')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'manifesto' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tuyên Ngôn</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'history' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Hồ Sơ</span>
              </button>
            </div>
          )}

          <button 
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white underline underline-offset-4"
          >
            Đóng
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-950 relative">
          <div className="max-w-5xl mx-auto h-full pt-8">
            {activeTab === 'manifesto' ? (
              <ManifestoTab />
            ) : (
              <HistoryTab onOpenQuestion={setSelectedQuestionId} />
            )}
          </div>
        </div>
      </div>

      {/* Memory Room Overlay (Lớp 2) */}
      {selectedQuestionId && (
        <MemoryRoom 
          questionId={selectedQuestionId} 
          onClose={() => setSelectedQuestionId(null)} 
        />
      )}
    </>
  );
};