import { useState, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * Purpose: Xử lý logic vật lý, tính toán vector và phản hồi xúc giác cho Gesture Button.
 * Inputs: type ('task' | 'thought'), callbacks (onSelect, onInteractionStart, onInteractionEnd).
 * Outputs: position {x,y}, activeDirection, feedbackLevel, eventHandlers.
 * Business Rule: 
 * - Tactile Lock: Rung 'medium' khi kéo sâu vào vùng chọn (>80px) để báo hiệu đã khóa mục tiêu.
 * - Magnetic Snap: Tự động phát hiện hướng dựa trên góc phần tư (X-Rail) hoặc hướng trục (T-Rail).
 * FIX: Thay thế 'selection' bằng 'light' để sửa lỗi Type Error.
 */

interface UseGestureLogicProps {
  type: 'task' | 'thought';
  onSelect: (result: any) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export const useGestureLogic = ({ type, onSelect, onInteractionStart, onInteractionEnd }: UseGestureLogicProps) => {
  // Physics State
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [feedbackLevel, setFeedbackLevel] = useState<0 | 1 | 2>(0); // 0: None, 1: Selected, 2: Locked

  // Internal Refs
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Constants
  const DEADZONE = 20;
  const LOCK_THRESHOLD = 80; // Ngưỡng kích hoạt Tactile Lock
  const MAX_RADIUS = 130;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    onInteractionStart();
    triggerHaptic('light');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // [FIX]: Ngăn chặn hành vi cuộn (Scroll) hoặc Pull-to-refresh của trình duyệt khi đang kéo
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isDragging || !startPosRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit radius
    const scale = distance > MAX_RADIUS ? MAX_RADIUS / distance : 1;
    setPosition({ x: dx * scale, y: dy * scale });

    // Direction Analysis
    let newDirection: string | null = null;
    if (distance > DEADZONE) {
      if (type === 'task') {
        // X-Rail Logic
        if (dx < 0 && dy < 0) newDirection = 'ul';
        else if (dx > 0 && dy < 0) newDirection = 'ur';
        else if (dx < 0 && dy > 0) newDirection = 'dl';
        else if (dx > 0 && dy > 0) newDirection = 'dr';
      } else {
        // T-Rail Logic
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) newDirection = 'left';
        } else {
          newDirection = dy < 0 ? 'up' : 'down';
        }
      }
    }

    // Tactile Lock Logic
    let newLevel: 0 | 1 | 2 = newDirection ? 1 : 0;
    if (distance > LOCK_THRESHOLD && newDirection) newLevel = 2;

    // Haptic Triggers
    if (newDirection !== activeDirection) {
      setActiveDirection(newDirection);
      if (newDirection) triggerHaptic('light'); // Magnetic Snap (Enter Zone)
    }

    if (newLevel !== feedbackLevel) {
      setFeedbackLevel(newLevel);
      if (newLevel === 2) triggerHaptic('medium'); // Tactile Lock (Deep Select)
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    (e.target as Element).releasePointerCapture(e.pointerId);

    if (activeDirection) {
      triggerHaptic('success'); // Confirm Action
      
      if (type === 'task') {
        const tags = [];
        if (activeDirection === 'ul') tags.push('p:urgent', 'p:important');
        if (activeDirection === 'ur') tags.push('p:urgent');
        if (activeDirection === 'dl') tags.push('p:important');
        onSelect({ type: 'task', tags });
      } else {
        let score = 3;
        if (activeDirection === 'up') score = feedbackLevel === 2 ? 5 : 4;
        if (activeDirection === 'down') score = feedbackLevel === 2 ? 1 : 2;
        onSelect({ type: 'thought', moodScore: score });
      }
    } else {
      triggerHaptic('light'); // [FIXED]: Thay 'selection' bằng 'light' (Cancel/Tap)
      onSelect(type === 'task' ? { type: 'task', tags: [] } : { type: 'thought', moodScore: 3 });
    }

    // Reset
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setActiveDirection(null);
    setFeedbackLevel(0);
    onInteractionEnd();
  };

  return {
    isDragging,
    position,
    activeDirection,
    feedbackLevel,
    handlers: { handlePointerDown, handlePointerMove, handlePointerUp }
  };
};