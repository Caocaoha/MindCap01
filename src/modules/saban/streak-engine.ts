import { ITask } from '../../database/types';

/**
 * [DOMAIN LOGIC]: Xử lý logic chuỗi và trích xuất tag
 */
export const streakEngine = {
  /**
   * Trích xuất giá trị từ tags (ví dụ: "group:work" -> "work")
   */
  getTagValue: (task: ITask, key: string): string | null => {
    const prefix = `${key}:`;
    const found = task.tags?.find(t => t.startsWith(prefix));
    return found ? found.split(':')[1] : null;
  },

  /**
   * Kiểm tra phục hồi chuỗi (3-Day Rule)
   */
  isWithinRecoveryPeriod: (task: ITask): boolean => {
    const THREE_DAYS_MS = 259200000;
    const lastUpdate = task.updatedAt ?? task.createdAt;
    return (Date.now() - lastUpdate) < THREE_DAYS_MS;
  }
};