/**
 * Purpose: Xu ly cam bien keo tha va tuong tac cua Task Card.
 * Inputs/Outputs: Nhan vao props cua component, tra ve cac handlers va states.
 * Business Rule: Cam keo tha voi viec da xong, kich hoat Haptic khi tuong tac.
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

  const onEditTrigger = () => {
    triggerHaptic('light');
    openEditModal(task);
  };

  return {
    isDragOver, isDone, isMultiTarget,
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