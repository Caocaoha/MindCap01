// src/services/cme/metrics.ts
import { db } from '../../database/db';
import { ActionType } from './constants';

// --- 1. Metric: Effort Allocation (Ea) ---
// Công thức: Task Actions / (Task + Non-Task)
export const calculateEaScore = (
  taskActionCount: number, 
  nonTaskActionCount: number
): number => {
  const total = taskActionCount + nonTaskActionCount;
  if (total === 0) return 0;
  return Math.round((taskActionCount / total) * 100);
};

// --- 2. Metric: Text Depth ---
// Tính độ dài trung bình của các Thought & Identity Answer
export const calculateTextDepth = async (): Promise<number> => {
  // Lấy mẫu 50 item gần nhất để tính cho nhanh, không cần quét toàn bộ DB
  const thoughts = await db.thoughts
    .orderBy('createdAt')
    .reverse()
    .limit(50)
    .toArray();
    
  const answers = await db.identityAudits
    .orderBy('timestamp')
    .reverse()
    .limit(20)
    .toArray();

  const totalItems = thoughts.length + answers.length;
  if (totalItems === 0) return 0;

  const totalWords = 
    thoughts.reduce((sum, item) => sum + (item.wordCount || 0), 0) +
    answers.reduce((sum, item) => sum + (item.wordCount || 0), 0);

  return Math.round(totalWords / totalItems);
};

// --- 3. Metric: CPI (Cross-Pollination Index) ---
// Công thức: (Explicit*3 + Contextual*2 + Implicit*1) / Total Entries
// Lưu ý: Contextual Link hiện tại gộp chung với Explicit (LinkedIds)
export const calculateWeeklyCPI = async (): Promise<number> => {
  // 1. Xác định phạm vi 7 ngày
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  // 2. Lấy dữ liệu trong 7 ngày
  const tasks = await db.tasks.where('createdAt').above(sevenDaysAgo).toArray();
  const thoughts = await db.thoughts.where('createdAt').above(sevenDaysAgo).toArray();
  const allEntries = [...tasks, ...thoughts].sort((a, b) => a.createdAt - b.createdAt);
  
  const totalEntries = allEntries.length;
  if (totalEntries < 5) return 0; // Quá ít dữ liệu để tính

  let explicitLinks = 0;
  let implicitLinks = 0;

  // 3. Đếm Explicit Links (x3)
  // (Tính dựa trên trường linkedIds)
  allEntries.forEach(entry => {
    if (entry.linkedIds && entry.linkedIds.length > 0) {
      explicitLinks += entry.linkedIds.length;
    }
  });

  // 4. Đếm Implicit Links (x1)
  // (Hai entry tạo cách nhau < 5 phút)
  for (let i = 0; i < totalEntries - 1; i++) {
    const current = allEntries[i];
    const next = allEntries[i+1];
    
    const diffMinutes = (next.createdAt - current.createdAt) / (1000 * 60);
    if (diffMinutes <= 5) {
      implicitLinks += 1;
    }
  }

  // 5. Tính toán (Trọng số: Explicit=3, Implicit=1)
  // Contextual tạm tính là Explicit nếu lưu trong linkedIds
  const weightedScore = (explicitLinks * 3) + (implicitLinks * 1);
  
  // Normalize: CPI thường từ 0.0 đến 2.0+
  const cpi = weightedScore / totalEntries;
  
  return parseFloat(cpi.toFixed(2));
};

// Helper phân loại Action Type cho Ea Score
export const getActionCategory = (type: ActionType): 'task' | 'non-task' => {
  switch (type) {
    case 'todo_done':
    case 'todo_new':
    case 'habit_log': // Habit thường tính vào "Doing"
      return 'task';
    case 'thought':
    case 'identity_fill':
      return 'non-task';
    default:
      return 'non-task';
  }
};