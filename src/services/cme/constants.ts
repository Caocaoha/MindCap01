// src/services/cme/constants.ts

export type ActionType = 
  | 'identity_fill' 
  | 'todo_done' 
  | 'habit_log' 
  | 'todo_new' 
  | 'thought';

// Bảng điểm hành vi (Behavioral Scoring Table)
// [High (0-3), Low (4-8), Min (9+)] -> Index tương ứng: 0, 1, 2
// Lưu ý: Logic đếm bắt đầu từ 0. 
// <4 (0,1,2,3) là High. 
// <9 (4,5,6,7,8) là Low. 
// >=9 là Min.
export const SCORING_TABLE: Record<ActionType, [number, number, number]> = {
  identity_fill: [15, 2, 0],
  todo_done:     [5, 2, 1],
  habit_log:     [5, 2, 1],
  todo_new:      [3, 1, 0.5],
  thought:       [3, 1, 0.5],
};

// Ngưỡng Level (Level Thresholds)
export const LEVEL_THRESHOLDS = [
  0,    // L0
  50,   // L1
  200,  // L2
  400,  // L3
  800,  // L4
  1200, // L5
  1600, // L6
  2000  // L7
];

export const BASE_THRESHOLD_L8 = 2000;
export const STEP_L8_PLUS = 500;