import { useState, useEffect } from 'react';
import { db, type MEVLog } from '../utils/db';
import { getDateString } from '../utils/date';

// Cấu hình điểm số (Blueprint V11.0)
const POINTS = {
  identity_fill: { high: 15, low: 2, limit: 4, min: 0},
  todo_done: { high: 5, low: 2, limit: 4, min: 1 },
  habit_log: { high: 5, low: 2, limit: 4, min: 1 },
  thought_new: { high: 3, low: 1, limit: 4, min: 0.5 },
};

export const useMEV = () => {
  const [totalMEV, setTotalMEV] = useState(0);
  const [level, setLevel] = useState(0);

  // Load stats lúc khởi động
  useEffect(() => {
    const loadStats = async () => {
      const stats = await db.user_stats.get('current');
      if (stats) {
        setTotalMEV(stats.total_mev);
        setLevel(stats.current_level);
      }
    };
    loadStats();
  }, []);

  const calculateLevel = (points: number) => {
    // Công thức đơn giản hóa để khớp lộ trình:
    // Lvl 0-3: < 400
    // Lvl 4+: > 800
    return 1 + Math.floor(points / 200); // Mỗi 200 điểm 1 level (Adjustable)
  };

  const addMEV = async (action: MEVLog['action_type']) => {
    const todayStr = getDateString();
    
    // 1. Đếm số lần đã làm trong ngày
    const count = await db.mev_logs
      .where({ date_str: todayStr, action_type: action })
      .count();

    // 2. Tính điểm dựa trên Diminishing Returns
    const cfg = POINTS[action];
    let earnedPoints = 0;

    if (count < cfg.limit) {
      earnedPoints = cfg.high;
    } else if (count < 10) { // Từ lần 5 đến 9
      earnedPoints = cfg.low;
    } else { // Từ lần 10 trở đi
      earnedPoints = cfg.min || 0;
    }

    // 3. Lưu Log
    await db.mev_logs.add({
      action_type: action,
      points: earnedPoints,
      created_at: Date.now(),
      date_str: todayStr
    });

    // 4. Cập nhật Stats
    const stats = await db.user_stats.get('current');
    if (stats) {
      const newTotal = stats.total_mev + earnedPoints;
      const newLevel = calculateLevel(newTotal);
      
      await db.user_stats.update('current', {
        total_mev: newTotal,
        current_level: newLevel
      });

      setTotalMEV(newTotal);
      setLevel(newLevel);
    }
    
    return earnedPoints; // Trả về điểm để UI hiển thị Toast
  };

  return { totalMEV, level, addMEV };
};