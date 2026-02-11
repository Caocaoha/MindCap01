// src/features/echo/hooks/useEcho.ts
import { useEffect, useRef } from 'react';
import { EchoEngine } from '../EchoEngine';
import { db } from '../../../core/db';

export const useEchoTrigger = (entryId: string, content: string) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset timer mỗi khi content thay đổi (người dùng đang gõ)
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      console.log("Echo: 10s Inactivity reached. Starting Resonance...");
      
      const linkedIds = await EchoEngine.findSemanticLinks(entryId, content);
      
      if (linkedIds.length > 0) {
        await db.tasks.update(entryId, { linkedIds });
        // Trigger Toast hoặc hiệu ứng ngầm ở đây
      }
    }, 10000); // 10 giây yên tĩnh

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [entryId, content]);
};