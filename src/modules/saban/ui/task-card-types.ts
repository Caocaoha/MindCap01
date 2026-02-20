/**
 * Purpose: Dinh nghia interface cho thanh phan hien thi nhiem vu (Task Card).
 * Inputs/Outputs: Khai bao TaskCardProps va interface tra ve cua Logic Hook.
 * Business Rule: Quan ly cac trang thai keo tha va hanh dong tuong tac nghiep vu.
 * [UPDATE]: Bo sung hasFrequency va frequencyText de hien thi thong tin lap lai.
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
  /**
   * [NEW]: Trang thai xac dinh xem nhiem vu co phai la nhiem vu dinh ky hay khong.
   * Dung de quyet dinh viec co hien thi nhan tan suat (Frequency Badge) tren UI.
   */
  hasFrequency: boolean;
  /**
   * [NEW]: Chuoi van ban da duoc dinh dang de mo ta tan suat lap lai.
   * Vi du: "Hang ngay", "Hang tuan", "Thu 2, 4, 6".
   */
  frequencyText: string;
  handlers: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onEditTrigger: () => void;
  };
}