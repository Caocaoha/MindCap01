/**
 * Purpose: Xu ly cam bien keo tha va tuong tac cua Task Card.
 * Inputs/Outputs: Nhan vao props cua component, tra ve cac handlers va states.
 * Business Rule: Cam keo tha voi viec da xong, kich hoat Haptic khi tuong tac.
 * [FIX]: Triet tieu loi TS2367 va format dung "Hang ngay", "Thu X", "Ngay X".
 */

import { useState } from 'react';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
import { TaskCardProps, TaskCardLogic } from './task-card-types';

export const useTaskCardLogic = (props: TaskCardProps): TaskCardLogic => {
  const { task, onJoinGroup } = props;
  const { openEditModal } = useUiStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const isDone = task.status === 'done';
  const isMultiTarget = (task.targetCount ?? 0) > 1;

  /**
   * [HUMANIZE LOGIC]: Chuyen doi du lieu tan suat tu Database thanh ngon ngu tu nhien.
   * [RULE]: 
   * - Daily -> "Hang ngay"
   * - Weekly/Custom/Days-Week -> "T2, T3..."
   * - Monthly -> "Ngay X"
   */
  const getFrequencyInfo = () => {
    // 1. Uu tien kiem tra truong 'frequency' chinh thuc (ITask v11.1)
    if (task.frequency && task.frequency !== 'none') {
      let text = '';
      
      // Xu ly theo tung loai tan suat
      if (task.frequency === 'daily') {
        text = 'Hàng ngày';
      } 
      else if (task.frequency === 'weekly' || task.frequency === 'custom' || task.frequency === 'days-week') {
        // Lay thong tin cac thu tu mang repeatOn
        if (Array.isArray(task.repeatOn) && task.repeatOn.length > 0) {
          text = task.repeatOn
            .sort((a, b) => a - b)
            .map((d: number) => (d === 8 ? 'CN' : `T${d}`))
            .join(', ');
        } else {
          // Fallback neu mang repeatOn bi trong
          text = task.frequency === 'weekly' ? 'Hàng tuần' : 'Định kỳ';
        }
      } 
      else if (task.frequency === 'monthly') {
        // Lay ngay cu the trong thang
        if (Array.isArray(task.repeatOn) && task.repeatOn.length > 0) {
          text = `Ngày ${task.repeatOn[0]}`;
        } else {
          text = 'Hàng tháng';
        }
      } else {
        text = task.frequency;
      }

      return { hasFreq: true, text };
    }

    // 2. Fallback: Kiem tra trong tags (Du lieu cu dung 'freq:')
    const freqTag = task.tags?.find(t => t.startsWith('freq:') && t !== 'freq:once');
    if (freqTag) {
      const value = freqTag.split(':')[1];
      
      if (value === 'daily') return { hasFreq: true, text: 'Hàng ngày' };
      
      if (value === 'weekly' || value === 'days-week') {
        if (Array.isArray(task.repeatOn) && task.repeatOn.length > 0) {
          const daysText = task.repeatOn.sort((a,b)=>a-b).map(d => (d === 8 ? 'CN' : `T${d}`)).join(', ');
          return { hasFreq: true, text: daysText };
        }
        return { hasFreq: true, text: 'Hàng tuần' };
      }
      
      if (value === 'monthly') {
        if (Array.isArray(task.repeatOn) && task.repeatOn.length > 0) {
          return { hasFreq: true, text: `Ngày ${task.repeatOn[0]}` };
        }
        return { hasFreq: true, text: 'Hàng tháng' };
      }
      
      // Neu tag chua danh sach thu (vi du: freq:2,4,6)
      if (value.includes(',')) {
        const formatted = value.split(',')
          .map(v => (v.trim() === '8' ? 'CN' : `T${v.trim()}`))
          .join(', ');
        return { hasFreq: true, text: formatted };
      }
      
      // Neu tag la so (Ngay trong thang)
      if (!isNaN(Number(value))) {
        return { hasFreq: true, text: `Ngày ${value}` };
      }
      
      return { hasFreq: true, text: value };
    }

    return { hasFreq: false, text: '' };
  };

  const { hasFreq, text } = getFrequencyInfo();
  const hasFrequency = hasFreq;
  const frequencyText = text || 'Định kỳ';

  const onEditTrigger = () => {
    triggerHaptic('light');
    openEditModal(task);
  };

  return {
    isDragOver, 
    isDone, 
    isMultiTarget,
    hasFrequency,
    frequencyText,
    handlers: {
      onDragStart: (e) => {
        if (isDone) return e.preventDefault();
        triggerHaptic('light');
        e.dataTransfer.setData("draggedTaskId", String(task.id));
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e) => {
        e.preventDefault();
        if (!isDragOver && !isDone) setIsDragOver(true);
      },
      onDragLeave: () => setIsDragOver(false),
      onDrop: (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isDone) return;
        const draggedId = Number(e.dataTransfer.getData("draggedTaskId"));
        if (onJoinGroup && draggedId && draggedId !== task.id) onJoinGroup(draggedId, task.id!);
      },
      onEditTrigger
    }
  };
};