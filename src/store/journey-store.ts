// src/store/journey-store.ts
import { create } from 'zustand';
import { nlpListener } from './middleware/nlp-listener';
import type { IThought } from '../database/types';

interface JourneyState {
  entries: IThought[];
  activeEntry: string;
  
  // Actions
  setEntries: (entries: IThought[]) => void;
  addEntry: (entry: IThought) => void;
  updateActiveEntry: (content: string) => void;
}

// [FINAL FIX]: Khai báo tường minh kiểu dữ liệu cho từng tham số (set, entry, state...)
// để không phụ thuộc vào Type Inference từ Middleware nữa.
export const useJourneyStore = create<JourneyState>(
  nlpListener(
    (set: any) => ({ // 1. Ép kiểu set là any
      entries: [],
      activeEntry: '',

      // 2. Khai báo rõ (entries: IThought[])
      setEntries: (entries: IThought[]) => set({ entries }),
      
      // 3. Khai báo rõ (entry: IThought) và (state: JourneyState)
      addEntry: (entry: IThought) => set((state: JourneyState) => ({ 
        entries: [entry, ...state.entries],
        activeEntry: '' 
      })),

      // 4. Khai báo rõ (content: string)
      updateActiveEntry: (content: string) => set({ activeEntry: content }),
    }),
    'JourneyStore'
  ) as any
);