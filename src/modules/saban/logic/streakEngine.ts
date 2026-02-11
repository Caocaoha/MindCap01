// src/modules/saban/logic/streakEngine.ts

/**
 * Tính khoảng cách ngày giữa 2 mốc thời gian (bỏ qua giờ phút)
 */
export const getDayGap = (lastDateStr: string | undefined): number => {
    if (!lastDateStr) return 0; // Chưa làm bao giờ
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const last = new Date(lastDateStr);
    last.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays; // 0 = làm hôm nay, 1 = làm hôm qua, 2 = quên 1 ngày...
  };
  
  /**
   * Trả về trạng thái hiển thị của Icon Lửa
   */
  export const getFireStatus = (gap: number, isRecovering: boolean): { opacity: number; visible: boolean } => {
    if (isRecovering) return { opacity: 0, visible: false }; // Ẩn trong bóng tối khi đang hồi phục (Option A)
  
    if (gap <= 1) return { opacity: 1, visible: true }; // Làm đều hoặc mới quên 1 hôm (gap 1 means yesterday was done)
    if (gap === 2) return { opacity: 0.5, visible: true }; // Quên 1 ngày
    if (gap > 2 && gap <= 5) return { opacity: 0.3, visible: true }; // Quên 2-4 ngày
    return { opacity: 0, visible: false }; // Quên > 4 ngày (Mất lửa)
  };
  
  /**
   * Tính toán Streak mới khi hoàn thành Task (Logic Hồi phục & Phạt)
   */
  export const calculateNewStreak = (
    currentStreak: number = 0,
    lastDateStr: string | undefined,
    frozenVal: number = 0,
    recoveryCount: number = 0
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const gap = getDayGap(lastDateStr);
  
    let newStreak = currentStreak;
    let newFrozen = frozenVal;
    let newRecovery = recoveryCount;
  
    // Case 0: Đã làm hôm nay rồi -> Không cộng nữa
    if (gap === 0) return { streak: currentStreak, frozen: frozenVal, recovery: recoveryCount, lastDate: todayStr };
  
    // Case 1: Làm đều (Hôm qua làm, nay làm tiếp)
    if (gap === 1) {
      newStreak = Math.min(99, currentStreak + 1);
      // Reset recovery nếu đang có (đã về bờ an toàn)
      newFrozen = 0; 
      newRecovery = 0;
    }
    
    // Case 2: Gãy chuỗi > 4 ngày (Chế độ hồi phục hoặc mất hẳn)
    else if (gap > 5) { // Gap > 4 ngày thực tế là > 5 ngày lịch (ví dụ làm ngày 1, nay ngày 7 -> gap 6)
       // Bắt đầu chế độ hồi phục
       if (newFrozen === 0) {
          newFrozen = currentStreak; // Đóng băng điểm cũ
          newStreak = 0; // Reset về 0 để bắt đầu thử thách
          newRecovery = 1; // Ngày 1 thử thách
       } else {
          // Đang trong thử thách
          newRecovery += 1;
          newStreak += 1; // Cộng tạm
          
          if (newRecovery >= 3) {
             // THÀNH CÔNG: Hồi phục
             // Công thức: Streak cũ - Số ngày ngắt quãng
             // Gap là số ngày lịch. Số ngày bỏ quên = Gap - 1.
             const daysMissed = gap - 1;
             const recoveredScore = Math.max(1, newFrozen - daysMissed);
             newStreak = recoveredScore + 3; // +3 ngày vừa cày
             newFrozen = 0;
             newRecovery = 0;
          }
       }
    }
    
    // Case 3: Gãy nhẹ (2-4 ngày) -> Phạt trừ điểm
    else {
       // Gap 2 (Quên 1 ngày): Trừ 1
       // Gap 3 (Quên 2 ngày): Trừ 2
       const penalty = gap - 1; 
       newStreak = Math.max(1, currentStreak - penalty) + 1; // Trừ xong cộng 1 cho hôm nay
       newFrozen = 0;
       newRecovery = 0;
    }
  
    return {
      streak: newStreak,
      frozen: newFrozen,
      recovery: newRecovery,
      lastDate: todayStr
    };
  };