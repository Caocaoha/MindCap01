import React from 'react';
import { useJourneyStore } from '../../../store/journey-store';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useJourneyStore();

  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Tìm kiếm trong vùng ký ức..."
        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-zinc-900 transition-all placeholder:text-white/10"
      />
    </div>
  );
};