import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { echoService } from './echoService';

export const EchoObserver = () => {
  // Hook này sẽ chạy mỗi khi Tasks hoặc Thoughts thay đổi
  // Tuy nhiên, để bắt chính xác item nào vừa thêm, ta dùng db.on('changes') middleware của Dexie
  // Nhưng ở level đơn giản của React, ta có thể dùng useEffect lắng nghe độ dài mảng (hoặc dùng Dexie Observable)
  
  // Cách tiếp cận tối ưu nhất cho Dexie + React:
  // Theo dõi sự kiện 'creating' của Dexie (cần cấu hình trong db.ts).
  // Nhưng để không sửa db.ts phức tạp, ta dùng thủ thuật quét changes:
  
  // [OPTIMIZED WAY]: Dùng Dexie Middleware (Low-level).
  // Nhưng ở đây tôi dùng React LiveQuery để đơn giản hóa việc tích hợp ngay lập tức.
  
  const latestTask = useLiveQuery(() => db.tasks.orderBy('createdAt').last());
  const latestThought = useLiveQuery(() => db.thoughts.orderBy('createdAt').last());

  useEffect(() => {
    if (latestTask) {
      // Khi có task mới nhất (hoặc vừa update), ném vào Echo Service
      // Service đã có Debounce nên không lo spam
      echoService.scheduleScan(latestTask.uuid);
    }
  }, [latestTask]);

  useEffect(() => {
    if (latestThought) {
      echoService.scheduleScan(latestThought.uuid);
    }
  }, [latestThought]);

  return null; // Component vô hình
};