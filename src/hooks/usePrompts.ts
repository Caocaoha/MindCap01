import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useMemo } from 'react';

const CYCLABLE_MODES = ['default', 'free']; 

export const usePrompts = () => {
  
  // 1. Lấy Mode hiện tại
  const currentMode = useLiveQuery(async () => {
    const state = await db.app_state.get('current_prompt_mode');
    return state?.value || 'default';
  }, [], 'default');

  // 2. Lấy danh sách câu hỏi của Mode đó
  const promptConfig = useLiveQuery(async () => {
    if (!currentMode) return null;
    return await db.prompt_configs.get(currentMode);
  }, [currentMode]);

  const questionList = promptConfig?.content_list || [];

  // 3. Logic chọn 1 câu hỏi duy nhất (Random)
  // useMemo giúp giữ nguyên câu hỏi trừ khi currentMode hoặc danh sách thay đổi
  const activeQuestion = useMemo(() => {
    if (questionList.length === 0) return null;
    
    // Chọn ngẫu nhiên 1 index
    const randomIndex = Math.floor(Math.random() * questionList.length);
    return questionList[randomIndex];
  }, [questionList]); // Dependency: Chỉ đổi câu hỏi khi đổi Mode (list thay đổi)

  const isSelfAudit = currentMode === 'audit';

  // --- ACTIONS ---

  /**
   * Chuyển đổi Audit Mode
   */
  const toggleAudit = async (shouldEnable: boolean) => {
    if (shouldEnable) {
      // TRƯỚC KHI BẬT AUDIT: Lưu lại mode hiện tại (nếu nó không phải là audit)
      if (currentMode !== 'audit') {
        await db.app_state.put({ key: 'last_cyclable_mode', value: currentMode });
      }
      await db.app_state.put({ key: 'current_prompt_mode', value: 'audit' });
    } else {
      // KHI TẮT AUDIT: Khôi phục mode cũ
      const lastModeRecord = await db.app_state.get('last_cyclable_mode');
      const targetMode = lastModeRecord?.value || 'default'; // Fallback về default nếu lỗi
      
      await db.app_state.put({ key: 'current_prompt_mode', value: targetMode });
    }
  };

  /**
   * Xoay vòng Mode (Chỉ hoạt động khi KHÔNG ở Audit)
   */
  const cycleMode = async () => {
    if (isSelfAudit) return; // Audit mode bị khóa xoay vòng

    const currentIndex = CYCLABLE_MODES.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % CYCLABLE_MODES.length;
    const nextMode = CYCLABLE_MODES[nextIndex];

    await db.app_state.put({ key: 'current_prompt_mode', value: nextMode });
  };

  return {
    currentMode,
    modeName: promptConfig?.name || '', // Trả về tên hiển thị (VD: "Tự vấn")
    activeQuestion, // Chỉ trả về 1 câu string duy nhất (hoặc null)
    isSelfAudit,
    toggleAudit,
    cycleMode
  };
};