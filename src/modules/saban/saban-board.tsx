import React, { useMemo } from 'react';
import { useJourneyStore } from '../../store/journey-store';
import { streakEngine } from './streak-engine';
import { StreakBadge } from './ui/streak-badge'; // Đảm bảo bạn đã tạo file này
import type { ITask } from '../../database/types';

export const SabanBoard: React.FC = () => {
  const { entries, scheduleTaskForToday, toggleTaskStatus } = useJourneyStore();

  // Tính toán dữ liệu hiển thị
  const { inbox, todayList, totalFire } = useMemo(() => {
    // 1. Lọc chỉ lấy Task (bỏ qua Thought/Mood)
    const allTasks = entries.filter((e: any) => !e.type) as ITask[];

    // 2. Phân loại Inbox vs Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inboxTasks: ITask[] = [];
    const todayTasks: ITask[] = [];
    let fireCount = 0;

    allTasks.forEach(task => {
      // Bỏ qua task đã xóa/dismiss
      if (task.status === 'dismissed') return;

      // Cộng tổng lửa (chỉ tính task active)
      if (task.streakCurrent && task.status !== 'completed') {
        fireCount += task.streakCurrent;
      }

      const isScheduledToday = task.scheduledFor && new Date(task.scheduledFor).toDateString() === today.toDateString();
      const isCompleted = task.status === 'completed';

      // Logic phân luồng
      if (isCompleted) {
        // Task đã xong nhưng nếu làm hôm nay thì vẫn hiện ở cột Today (để check off)
        if (isScheduledToday) {
            todayTasks.push(task);
        }
        // Nếu xong từ hôm qua thì thôi (hoặc đưa vào Archive - chưa làm ở đây)
      } else if (isScheduledToday) {
        todayTasks.push(task);
      } else {
        inboxTasks.push(task);
      }
    });

    // 3. Sắp xếp danh sách Today
    // Quy tắc: 
    // - Việc Active lên đầu (Đặc biệt là việc vừa hủy Focus nhảy lên số 1)
    // - Việc Completed xuống đáy
    todayTasks.sort((a, b) => {
      // Ưu tiên trạng thái: Pending > Completed
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Nếu cùng trạng thái, sắp xếp theo thời gian tạo/update (Mới nhất lên đầu)
      // Điều này đáp ứng logic "Cancel Focus -> Nhảy lên đầu" (vì ta update createdAt)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { 
      inbox: inboxTasks, 
      todayList: todayTasks,
      totalFire: fireCount
    };
  }, [entries]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-32">
      {/* Header: Gamification Status */}
      <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-200">
        <div>
          <h2 className="text-2xl font-bold">Saban Dashboard</h2>
          <p className="opacity-90 text-sm">Giữ ngọn lửa kỷ luật luôn cháy.</p>
        </div>
        <div className="text-center bg-white/20 p-3 rounded-xl backdrop-blur-sm min-w-[80px]">
          <div className="text-3xl font-bold flex justify-center items-center gap-1">
            <span>🔥</span> {totalFire}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Tổng Lửa</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COLUMN 1: INBOX (Kho chờ) */}
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
                    {/* Hiển thị Streak Badge mờ nếu có (đang bị phạt trong Inbox) */}
                    <div className="mt-1 scale-90 origin-left opacity-70">
                         <StreakBadge task={task} /> 
                    </div>
                </div>
                <button
                  onClick={() => scheduleTaskForToday(task.id!)}
                  className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition-colors uppercase"
                >
                  Làm ngay &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: TODAY (Chiến trường) */}
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
              return (
                <div 
                  key={task.id} 
                  className={`
                    p-3 rounded-lg border shadow-sm flex items-start gap-3 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-gray-100 border-gray-100 opacity-60' // Style việc đã xong
                      : 'bg-white border-indigo-100 hover:border-indigo-300' // Style việc đang làm
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      onChange={() => toggleTaskStatus(
                        task.id!, 
                        isCompleted ? 'pending' : 'completed'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium truncate max-w-full ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      
                      {/* Streak Badge: Tự động ẩn khi Completed nhờ logic bên trong Badge, 
                          nhưng ta cũng có thể conditional render ở đây cho chắc chắn */}
                      {!isCompleted && <StreakBadge task={task} />}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {task.tags.map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};