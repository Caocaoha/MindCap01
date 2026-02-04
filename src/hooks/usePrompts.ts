import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState, useEffect } from 'react';

export const usePrompts = () => {
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Lấy config hiện tại
  const appState = useLiveQuery(() => db.app_state.get('current_prompt_mode'));
  const currentModeId = appState?.value || 'default';

  // Lấy bộ câu hỏi
  const promptConfig = useLiveQuery(
    () => db.prompt_configs.get(currentModeId),
    [currentModeId]
  );

  // Logic chọn câu hỏi ngẫu nhiên
  const getQuestion = () => {
    if (!promptConfig || !promptConfig.content_list.length) {
      return "Hôm nay bạn thế nào?";
    }
    const list = promptConfig.content_list;
    // Dùng refreshIndex để kích hoạt việc random lại
    const randomIndex = Math.floor(Math.random() * list.length) + (refreshIndex * 0); 
    return list[randomIndex % list.length];
  };

  return {
    currentPrompt: getQuestion(), // <-- Đổi tên cho khớp MindTab
    refreshPrompt: () => setRefreshIndex(prev => prev + 1), // <-- Hàm mới để đổi câu hỏi
    modeName: promptConfig?.name || 'Mặc định'
  };
};