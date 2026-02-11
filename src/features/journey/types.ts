export type EntryType = 'task' | 'thought' | 'mood';

export interface JourneyEntry {
  id: string;
  type: EntryType;
  content: string;
  createdAt: number;
  completedAt?: number; // Với task
  
  // Metadata cho Echo Link
  projectId?: string;
  tags: string[];
  
  // Trạng thái Journey
  isBookmarked: boolean;
  bookmarkReason?: string;
  
  // Calculated Fields (Không lưu DB, tính toán khi runtime)
  opacity: number;      // 0.0 -> 1.0 (Entropy)
  relatedIds: string[]; // Danh sách ID liên quan (Echo Context)
}

export interface JourneyStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string; // E.g., "Novice", "Seeker"
  weeklyData: {
    date: string;
    completed: number; // Bar chart
    rate: number;      // Line chart (%)
  }[];
}