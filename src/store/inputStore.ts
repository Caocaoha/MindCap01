import { create } from 'zustand';

// Định nghĩa các trạng thái của đường ray (Rail Zones)
export type InputMode = 'idle' | 'typing' | 'dragging_task' | 'dragging_mood';
export type RailZone = 'urgent' | 'normal' | 'needed' | 'critical' | 'happy' | 'sad' | 'neutral' | null;

interface InputState {
  // State
  mode: InputMode;
  inputText: string;
  isGhostMode: boolean; // True khi đang Drag -> Input mờ đi
  activeRail: RailZone; // Zone hiện tại ngón tay đang trỏ vào
  dragDistance: number; // Để tính toán độ rung (Haptic)

  // Actions
  setInputText: (text: string) => void;
  setDragState: (mode: InputMode, distance: number, zone: RailZone) => void;
  reset: () => void;
}

export const useInputStore = create<InputState>((set) => ({
  mode: 'idle',
  inputText: '',
  isGhostMode: false,
  activeRail: null,
  dragDistance: 0,

  setInputText: (text) => set({ 
    inputText: text, 
    mode: text.length > 0 ? 'typing' : 'idle' 
  }),

  setDragState: (mode, distance, zone) => set((state) => ({
    mode,
    dragDistance: distance,
    activeRail: zone,
    // Ghost Mode kích hoạt ngay khi bắt đầu kéo (distance > 5px)
    isGhostMode: mode !== 'idle' && mode !== 'typing' && distance > 5
  })),

  reset: () => set({
    mode: 'idle',
    isGhostMode: false,
    activeRail: null,
    dragDistance: 0
  })
}));