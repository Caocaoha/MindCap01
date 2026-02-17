/**
 * Purpose: Dinh nghia cac interface va kieu du lieu cho bang Saban (Backlog).
 * Inputs/Outputs: Khai bao kieu loc (Filter) va cau truc phan tu (Element).
 * Business Rule: Ho tro phan loai giua Task don le va nhom Task (Sequence Group).
 */

import { ITask } from '../../database/types';

export type SabanFilter = 'all' | 'urgent' | 'important' | 'once' | 'repeat';

export interface SabanData {
  groups: Record<string | number, ITask[]>;
  standalones: ITask[];
}

export interface SabanElement {
  type: 'group' | 'standalone';
  id: string | number;
  data: ITask | ITask[];
}

export interface SabanLogic {
  filter: SabanFilter;
  setFilter: (f: SabanFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  combinedElements: SabanElement[];
  handleJoinGroup: (draggedId: number, targetId: number) => Promise<void>;
  handleToggleFocus: (task: ITask) => Promise<void>;
  handleArchive: (id: number) => Promise<void>;
  handleMoveOrder: (task: ITask, direction: 'up' | 'down') => Promise<void>;
  handleDetach: (task: ITask) => Promise<void>;
}