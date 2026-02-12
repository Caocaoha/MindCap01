import React, { useState } from 'react';
import { useIdentityStore } from './identity-store';

const MOOD_LEVELS = [
  { score: -2, emoji: '😫', label: 'Kiệt sức', color: 'bg-red-500' },
  { score: -1, emoji: '😟', label: 'Lo lắng', color: 'bg-orange-400' },
  { score: 0,  emoji: '😐', label: 'Bình ổn', color: 'bg-gray-400' },
  { score: 1,  emoji: '🙂', label: 'Tốt',     color: 'bg-green-400' },
  { score: 2,  emoji: '🤩', label: 'Thăng hoa', color: 'bg-emerald-600' },
];

export const IdentityCheckin: React.FC = () => {
  const { isCheckinOpen, setCheckinOpen, logMood } = useIdentityStore();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  
  if (!isCheckinOpen) return null;

  const handleSave = () => {
    if (selectedScore === null) return;
    const moodObj = MOOD_LEVELS.find(m => m.score === selectedScore);
    logMood(selectedScore, moodObj?.label || 'Unknown', note);
    
    // Reset form
    setSelectedScore(null);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-6 text-white text-center relative">
          <h2 className="text-xl font-bold">Thấu hiểu Bản thân</h2>
          <p className="text-violet-100 text-sm opacity-90">Bạn đang cảm thấy thế nào?</p>
          <button 
            onClick={() => setCheckinOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Mood Selector */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between gap-2">
            {MOOD_LEVELS.map((level) => (
              <button
                key={level.score}
                onClick={() => setSelectedScore(level.score)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full
                  ${selectedScore === level.score 
                    ? `${level.color} text-white scale-110 shadow-lg` 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-2xl">{level.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{level.score}</span>
              </button>
            ))}
          </div>
          
          {selectedScore !== null && (
             <div className="text-center font-medium text-gray-600 animate-in slide-in-from-top-2">
               {MOOD_LEVELS.find(m => m.score === selectedScore)?.label}
             </div>
          )}

          {/* Reflection Note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú nhanh về suy nghĩ hiện tại... (Tùy chọn)"
            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-200 resize-none text-gray-700 min-h-[80px]"
          />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={selectedScore === null}
            className={`
              w-full py-3 rounded-xl font-bold text-white transition-all
              ${selectedScore !== null 
                ? 'bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200' 
                : 'bg-gray-200 cursor-not-allowed'
              }
            `}
          >
            Ghi nhận
          </button>
        </div>
      </div>
    </div>
  );
};