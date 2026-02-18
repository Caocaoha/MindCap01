import React from 'react';

interface ReviewCardProps {
  item: any;
  onIgnore: () => void;
  onApprove: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ item, onIgnore, onApprove }) => {
  return (
    <div className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 flex flex-col relative overflow-hidden" style={{ touchAction: 'none' }}>
      
      {/* Header: [Ignore] --- [Sync] --- [Score] */}
      <header className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onIgnore(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl active:scale-95 transition-all shadow-lg"
          >
            <span className="text-xs font-black">[-] Ignore</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onApprove(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl active:scale-95 transition-all shadow-lg"
          >
            <span className="text-xs font-black">Sync →</span>
          </button>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-3xl font-black text-slate-900 leading-none">{item.interactionScore || 0}</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-400">Score</span>
        </div>
      </header>

      {/* Content: Full display with Scroll */}
      <main className="flex-1 overflow-y-auto no-scrollbar pr-2 mb-4">
        <p className="text-slate-700 leading-relaxed text-base font-medium whitespace-pre-wrap">
          {item.content}
          {item.isBookmarked && (
            <span className="block mt-6 pt-4 border-t border-slate-50 text-[11px] text-slate-400 italic">
              <strong className="uppercase not-italic text-[8px] mr-2 text-yellow-600 tracking-widest">bookmark:</strong>
              {item.bookmarkReason}
            </span>
          )}
        </p>
      </main>

      <div className="py-2 text-center border-t border-slate-50">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Quẹt phải để Sync, quẹt trái để Ignore
        </p>
      </div>
    </div>
  );
};