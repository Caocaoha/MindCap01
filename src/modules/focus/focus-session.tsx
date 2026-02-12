import React from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { useUiStore } from '../../store/ui-store';
import type { ITask } from '../../database/types';

export const FocusSession: React.FC = () => {
  const { entries, toggleTaskStatus } = useJourneyStore();
  const { setFocusSessionActive } = useUiStore();

  // Lấy danh sách các task đang được chọn Focus
  const focusTasks = entries.filter((e: any) => e.isFocusMode && e.status !== 'completed') as ITask[];

  // Nếu hoàn thành hết -> Tự động chúc mừng hoặc thoát (Logic đơn giản: cho user tự thoát)
  
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* Header: Exit Button */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setFocusSessionActive(false)}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          title="Thoát chế độ tập trung"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Deep Work Mode
          </h2>
          <p className="text-gray-400 text-sm">Đơn nhiệm. Tuyệt đối.</p>
        </div>

        {/* Task Slots (Grid 1 or 2 cols based on count) */}
        <div className={`grid gap-4 ${focusTasks.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {focusTasks.length === 0 ? (
             <div className="text-center text-gray-500 py-10 col-span-full border-2 border-dashed border-gray-700 rounded-xl">
               <p>Không có nhiệm vụ nào được chọn.</p>
               <button 
                 onClick={() => setFocusSessionActive(false)}
                 className="mt-4 text-blue-400 hover:underline"
               >
                 Quay lại Saban Board để chọn
               </button>
             </div>
          ) : (
            focusTasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-gray-800/50 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-xl hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold leading-snug">{task.title}</h3>
                    {task.tags && (
                      <div className="flex gap-2 mt-2">
                        {task.tags.map(t => (
                          <span key={t} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    {/* Complete Button */}
                    <button
                      onClick={() => toggleTaskStatus(task.id!, 'completed')}
                      className="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/50 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span>✓</span> Hoàn thành
                    </button>
                    
                    {/* Kick out Button */}
                    <button
                      onClick={() => toggleTaskStatus(task.id!, 'dismissed')} 
                      className="px-4 bg-gray-700 hover:bg-red-900/30 text-gray-400 hover:text-red-400 border border-transparent hover:border-red-800/50 rounded-xl transition-all"
                      title="Hủy tiêu điểm (Đẩy về đầu Inbox)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Slot Indicators (To reinforce limit of 4) */}
        <div className="flex justify-center gap-2 mt-8">
           {[...Array(4)].map((_, i) => (
             <div 
               key={i} 
               className={`h-1.5 w-8 rounded-full transition-all ${i < focusTasks.length ? 'bg-indigo-500' : 'bg-gray-700'}`} 
             />
           ))}
        </div>
      </div>
    </div>
  );
};