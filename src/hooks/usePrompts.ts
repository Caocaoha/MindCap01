import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../utils/db';
import { useState } from 'react';

export const usePrompts = () => {
  const [refreshIndex, setRefreshIndex] = useState(0);

  const appState = useLiveQuery(() => db.app_state.get('current_prompt_mode'));
  const currentModeId = appState?.value || 'default';

  const promptConfig = useLiveQuery(
    () => db.prompt_configs.get(currentModeId),
    [currentModeId]
  );

  const getQuestion = () => {
    if (!promptConfig || !promptConfig.content_list.length) {
      return "Hôm nay bạn thế nào?";
    }
    const list = promptConfig.content_list;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[(randomIndex + refreshIndex) % list.length];
  };

  return {
    currentPrompt: getQuestion(),
    refreshPrompt: () => setRefreshIndex(prev => prev + 1)
  };
};
