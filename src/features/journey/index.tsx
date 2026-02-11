import React, { useState } from 'react';
import { useJourney } from './hooks/useJourney';
import { ReflectiveMirror } from './components/ReflectiveMirror';
import { LivingMemory } from './components/LivingMemory';
import { UniversalInput, InputMode, InputData } from '../../components/shared/UniversalInput'; // Import hàng thật
import { BarChart2, BookOpen } from 'lucide-react';
import { JourneyEntry } from './types';

export const JourneyView = () => {
  const { entries, stats, toggleBookmark } = useJourney();
  const [activeTab, setActiveTab] = useState<'mirror' | 'memory'>('memory');
  
  // State quản lý Input Overlay
  const [inputState, setInputState] = useState<{
    isOpen: boolean;
    mode: InputMode;
    initialData?: Partial<InputData>;
  }>({ isOpen: false, mode: 'create' });

  // 1. Handle EDIT (Sửa chữa quá khứ)
  const handleEdit = (entry: JourneyEntry) => {
    setInputState({
      isOpen: true,
      mode: 'edit',
      initialData: { 
        id: entry.id, 
        content: entry.content, 
        type: entry.type === 'task' ? 'task' : 'thought', // Mapping type
        tags: entry.tags 
      }
    });
  };

  // 2. Handle BUILD (Tạo sinh từ ký ức)
  const handleBuild = (parentEntry: JourneyEntry) => {
    setInputState({
      isOpen: true,
      mode: 'create', // Build thực chất là create mới
      initialData: { 
        parentRef: parentEntry.id, // Truyền ID cha để gắn link
        content: `Ref: "${parentEntry.content.substring(0, 30)}..."\n\n`, // Quote lại một chút
        type: 'thought' // Mặc định là thought, user có thể đổi
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-xl font-bold text-slate-200 mr-8">Hành Trình</h1>
        
        <button onClick={() => setActiveTab('mirror')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mirror' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <BarChart2 className="w-4 h-4" />
          <span>Phản Chiếu</span>
        </button>
        
        <button onClick={() => setActiveTab('memory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'memory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <BookOpen className="w-4 h-4" />
          <span>Nhật Ký</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {activeTab === 'mirror' && stats && <ReflectiveMirror stats={stats} />}
        
        {activeTab === 'memory' && (
          <LivingMemory 
            entries={entries} 
            onToggleBookmark={toggleBookmark}
            onEdit={handleEdit}
            onBuild={handleBuild}
          />
        )}
      </div>

      {/* Universal Input Overlay */}
      <UniversalInput
        isOpen={inputState.isOpen}
        onClose={() => setInputState(prev => ({ ...prev, isOpen: false }))}
        mode={inputState.mode}
        initialData={inputState.initialData}
        onSuccess={() => {
          // Có thể gọi reload data nếu cần, nhưng useLiveQuery của Dexie sẽ tự lo việc đó
          console.log("Journey Updated!");
        }}
      />
    </div>
  );
};