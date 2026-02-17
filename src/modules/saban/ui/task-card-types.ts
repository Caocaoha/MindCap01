/**
 * Purpose: Dinh nghia interface cho thanh phan hien thi nhiem vu (Task Card).
 * Inputs/Outputs: Khai bao TaskCardProps va interface tra ve cua Logic Hook.
 * Business Rule: Quan ly cac trang thai keo tha va hanh dong tuong tac nghiep vu.
 */

import { ITask } from '../../../database/types';

export interface TaskCardProps {
  task: ITask;
  isGrouped?: boolean;
  onToggleFocus?: () => void;
  onArchive?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDetach?: () => void;
  onJoinGroup?: (draggedId: number, targetId: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export interface TaskCardLogic {
  isDragOver: boolean;
  isDone: boolean;
  isMultiTarget: boolean;
  handlers: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onEditTrigger: () => void;
  };
}