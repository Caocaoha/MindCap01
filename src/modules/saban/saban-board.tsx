import React, { useMemo } from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { useUiStore } from '../../store/ui-store';
import { StreakBadge } from './ui/streak-badge';
import type { ITask } from '../../database/types';

export const SabanBoard: React.FC = () => {
  const { entries, scheduleTaskForToday, toggleTaskStatus, toggleFocusSelection } = useJourneyStore();
  const { setFocusSessionActive } = useUiStore();

  const { inbox, todayList, totalFire, focusCount } = useMemo(() => {
    const allTasks = entries.filter((e: any) => !e.type) as ITask[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // [FIX]: Đặt tên biến nội bộ khác hẳn để tránh xung đột (Shadowing/TDZ)
    const _inbox: ITask[] = []; 
    const _todayList: ITask[] = [];
    let _fireCount = 0;
    let _activeFocusCount = 0;

    allTasks.forEach(task => {
      if (task.status === 'dismissed') return;
      
      // Tính toán Fire
      if (task.streakCurrent && task.status !== 'completed') {
        _fireCount += task.streakCurrent;
      }
      
      // Tính toán Focus Count
      if (task.isFocusMode && task.status !== 'completed') {
        _activeFocusCount++;
      }

      const isScheduledToday = task.scheduledFor && new Date(task.scheduledFor).toDateString() === today.toDateString();
      const isCompleted = task.status === 'completed';

      // Phân loại
      if (isCompleted) {
        if (isScheduledToday) _todayList.push(task);
      } else if (isScheduledToday) {
        _todayList.push(task);
      } else {
        _inbox.push(task);
      }
    });

    // Sắp xếp
    _todayList.sort((a, b) => {
      if (a.isFocusMode && !b.isFocusMode) return -1;
      if (!a.isFocusMode && b.isFocusMode) return 1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // [FIX]: Trả về object tường minh (Explicit Return)
    return { 
      inbox: _inbox, 
      todayList: _todayList, 
      totalFire: _fireCount, 
      focusCount: _activeFocusCount 
    };
  }, [entries]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-200">
        <div>
          <h2 className="text-2xl font-bold">Saban Dashboard</h2>
          <p className="opacity-90 text-sm">Giữ ngọn lửa kỷ luật luôn cháy.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setFocusSessionActive(true)}
             disabled={focusCount === 0}
             className={`px-4 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${
               focusCount > 0 
                 ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-bounce-subtle'
                 : 'bg-white/20 text-white/50 cursor-not-allowed'
             }`}
           >
             <span>🚀</span>
             <span>Vào vùng Focus ({focusCount}/4)</span>
           </button>

           <div className="text-center bg-white/20 p-3 rounded-xl backdrop-blur-sm min-w-[80px]">
             <div className="text-3xl font-bold flex justify-center items-center gap-1">
               <span>🔥</span> {totalFire}
             </div>
             <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Tổng Lửa</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INBOX */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
          <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wide mb-4 flex items-center justify-between border-b pb-2">
            <span>📥 Inbox <span className="text-gray-400 font-normal">({inbox.length})</span></span>
          </h3>
          
          <div className="space-y-3">
            {inbox.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-10 italic">
                Hộp thư đến trống rỗng.<br/>Hãy tận hưởng sự thảnh thơi!
              </div>
            )}
            {inbox.map(task => (
              <div key={task.id} className="group p-3 bg-gray-50 rounded-lg border border-transparent hover:border-indigo-200 hover:bg-white hover:shadow-sm transition-all flex justify-between items-center">
                <div className="flex-1 mr-2">
                    <p className="text-gray-700 text-sm font-medium truncate">{task.title}</p>
                    <div className="mt-1 scale-90 origin-left opacity-70"><StreakBadge task={task} /></div>
                </div>
                <button
                  onClick={() => scheduleTaskForToday(task.id!)}
                  className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition-colors uppercase"
                >Làm ngay &rarr;</button>
              </div>
            ))}
          </div>
        </div>

        {/* TODAY */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm min-h-[400px]">
          <h3 className="font-bold text-indigo-800 uppercase text-xs tracking-wide mb-4 flex items-center justify-between border-b border-indigo-200 pb-2">
            <span>🎯 Today <span className="text-indigo-500 font-normal">({todayList.length})</span></span>
            <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">Priority</span>
          </h3>

          <div className="space-y-3">
            {todayList.length === 0 && (
              <div className="text-center text-indigo-300 text-sm mt-10 border-2 border-dashed border-indigo-200 p-6 rounded-xl">
                Chưa có nhiệm vụ hôm nay.<br/>Kéo từ Inbox sang để bắt đầu!
              </div>
            )}
            
            {todayList.map(task => {
              const isCompleted = task.status === 'completed';
              const isFocusing = task.isFocusMode && !isCompleted;

              return (
                <div 
                  key={task.id} 
                  className={`
                    p-3 rounded-lg border shadow-sm flex items-start gap-3 transition-all duration-300 relative overflow-hidden
                    ${isCompleted 
                      ? 'bg-gray-100 border-gray-100 opacity-60' 
                      : isFocusing 
                        ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-white border-indigo-100 hover:border-indigo-300'
                    }
                  `}
                >
                  {isFocusing && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      onChange={() => toggleTaskStatus(task.id!, isCompleted ? 'pending' : 'completed')}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium truncate max-w-full ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      {!isCompleted && <StreakBadge task={task} />}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {task.tags.map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => toggleFocusSelection(task.id!)}
                      className={`
                        p-1.5 rounded-md transition-all
                        ${isFocusing ? 'text-indigo-600 bg-indigo-50' : 'text-gray-300 hover:text-indigo-400'}
                      `}
                      title={isFocusing ? "Bỏ chọn Focus" : "Chọn vào vùng Focus"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM15.75 10a.75.75 0 01.75.75h1.5a.75.75 0 010-1.5h-1.5a.75.75 0 01-.75.75zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10z" />
                        <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};