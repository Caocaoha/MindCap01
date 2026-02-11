// src/modules/saban/components/StrategicHeader.tsx
import React from 'react';
import { useUserStore } from '../../../store/userStore';
import { Target, Compass } from 'lucide-react';

interface StrategicHeaderProps {
  onIdentityClick: () => void;
}

export const StrategicHeader: React.FC<StrategicHeaderProps> = ({ onIdentityClick }) => {
  const { identity } = useUserStore();
  
  // Lấy Task quan trọng nhất từ Identity (Task tạo từ câu 26)
  // Thực tế có thể query DB, ở đây demo UI
  const identityTask = "Hoàn thành MVP Mind Cap"; 

  return (
    <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
            North Star Strategy
          </h2>
          <h1 className="text-xl font-light text-white">
            Dự án lớn nhất của bạn là gì?
          </h1>
        </div>
        <button 
          onClick={onIdentityClick}
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors relative"
        >
          <Compass size={24} className={identity.isCompleted ? "text-yellow-400" : "text-slate-400"} />
          {/* Dot indicator if not completed */}
          {!identity.isCompleted && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900" />
          )}
        </button>
      </div>

      <div 
        onClick={onIdentityClick}
        className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <Target className="text-blue-400 shrink-0" size={20} />
        <span className="font-medium text-slate-200 truncate">{identityTask}</span>
      </div>
    </div>
  );
};