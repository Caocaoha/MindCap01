import { useInputStore, RailZone } from '../store/inputStore';
import { useToastStore } from '../store/toastStore';
import { db, Task, Thought } from '../database/db';
import { parseInput } from '../utils/nlpParser';
import { v4 as uuidv4 } from 'uuid';

export const useInputLogic = () => {
  const { inputText, setInputText, reset } = useInputStore();
  const { showToast } = useToastStore();

  const handleSave = async (zone: RailZone) => {
    if (!inputText.trim()) {
      reset();
      return;
    }

    // 1. NLP Processing
    const { cleanContent, quantity, unit } = parseInput(inputText);
    const id = uuidv4();
    const now = Date.now();

    try {
      // 2. Logic phân nhánh: Task vs Mood
      if (['urgent', 'normal', 'needed', 'critical'].includes(zone || '')) {
        // --- CASE: TASK ---
        const newTask: Task = {
          uuid: id,
          type: 'task',
          content: cleanContent,
          status: 'todo',
          priority: zone as any, // urgent, normal...
          identityScore: 0, // Sẽ tính sau bởi CME Engine
          quantity,
          unit,
          createdAt: now,
          updatedAt: now,
          tags: [],
          linkedIds: []
        };

        await db.tasks.add(newTask);
        showToast(`Đã tạo Task: ${cleanContent}`, 'success');

      } else if (['happy', 'sad', 'neutral'].includes(zone || '')) {
        // --- CASE: MOOD / THOUGHT ---
        const newThought: Thought = {
          uuid: id,
          type: 'mood',
          content: cleanContent,
          moodValue: zone as any,
          opacity: 1.0, // Mới tạo thì rõ nét
          isBookmarked: false,
          createdAt: now,
          updatedAt: now,
          tags: [],
          linkedIds: []
        };

        await db.thoughts.add(newThought);
        showToast(`Đã ghi nhận cảm xúc: ${zone}`, 'success');
      }

      // 3. Reset UI
      setInputText(''); // Xóa text
      reset(); // Tắt ghost mode

    } catch (error) {
      console.error("Save failed:", error);
      showToast("Lỗi khi lưu dữ liệu", 'error');
    }
  };

  return { handleSave };
};