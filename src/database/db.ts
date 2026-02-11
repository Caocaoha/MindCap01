import Dexie, { Table } from 'dexie';

// --- INTERFACES ---

// Cấu trúc lặp lại (Context Modal Requirement)
export interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly';
  value: number[]; // Weekly: [1, 7] (T2, CN); Monthly: [15] (Ngày 15)
}

export interface BaseEntity {
  id?: number;       // Auto-increment (Dexie Internal)
  uuid: string;      // UUID v4 (Public ID)
  content: string;
  createdAt: number;
  updatedAt: number;
  
  // Graph & Search Fields
  tags: string[];         // Semantic Search
  linkedIds: string[];    // Echo Resonance Links
  parentId?: string;      // Hierarchy
}

export interface Task extends BaseEntity {
  type: 'task';
  status: 'todo' | 'active' | 'completed' | 'dismissed';
  priority: 'critical' | 'urgent' | 'needed' | 'normal'; // Mapping từ 4 góc Gesture
  identityScore: number;  // -5 to +5
  
  // NLP Data
  quantity?: number;
  unit?: string;
  
  // Context Modal Data
  recurrence?: RecurrenceConfig; 
  completedAt?: number;
}

export interface Thought extends BaseEntity {
  type: 'thought' | 'mood';
  moodValue?: 'happy' | 'sad' | 'neutral'; // Mapping từ T-Rail Gesture
  
  // Living Memory Fields
  opacity: number;        // 0.0 - 1.0 (Entropy)
  isBookmarked: boolean;
  nextReviewAt?: number;  // Spark Trigger
}

// --- DATABASE CLASS ---

export class MindCapDatabase extends Dexie {
  tasks!: Table<Task>;
  thoughts!: Table<Thought>;

  constructor() {
    super('MindCapDB');
    
    this.version(2).stores({
      tasks: '++id, uuid, type, status, priority, *tags, *linkedIds, parentId',
      thoughts: '++id, uuid, type, moodValue, *tags, *linkedIds, nextReviewAt'
    });
  }
}

export const db = new MindCapDatabase();