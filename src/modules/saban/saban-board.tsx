import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../store/ui-store'; // ✅ Đã sửa đúng chính tả

// Mock Data (Tạm thời)
const MOCK_TASKS = [
  { id: 1, title: 'Hoàn thiện Mind Cap v3.5', priority: 'critical', done: false },
  { id: 2, title: 'Tập thể dục 30p', priority: 'high', done: true },
  { id: 3, title: 'Đọc sách 10 trang', priority: 'normal', done: false },
];

export const SabanBoard = () => {
  // Lấy state từ store (nếu cần dùng để ẩn hiện gì đó)
  const { isInputMode } = useUIStore();

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header: Gamification Status */}
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
            <Flame size={20} fill="currentColor" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Streak</div>
            <div className="text-xl font-bold text-white">12 Days</div>
          </div>
        </div>
        
        <div className="h-8 w-px bg-zinc-800" />
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Level 5</div>
            <div className="text-sm font-bold text-teal-400">Architect</div>
          </div>
          <div className="p-2 bg-teal-500/10 rounded-full text-teal-400">
            <Trophy size={20} />
          </div>
        </div>
      </div>

      {/* Inbox / Today View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-zinc-200">Today's Focus</h3>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">3/5 Done</span>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {MOCK_TASKS.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                task.done 
                  ? 'bg-zinc-900/30 border-zinc-900 opacity-50' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Checkbox Simulation */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                task.done ? 'border-teal-500 bg-teal-500/20' : 'border-zinc-600'
              }`}>
                {task.done && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className={`font-medium ${task.done ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                  {task.title}
                </div>
              </div>

              {/* Priority Indicator */}
              {task.priority === 'critical' && <AlertCircle size={16} className="text-red-400" />}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};