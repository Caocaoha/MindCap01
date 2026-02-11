import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // Cần cài: npm install uuid @types/uuid
import { IIdentityState, IIdentityEntry } from './types';
import { IDENTITY_QUESTIONS } from './data/questions';

const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 phút

export const useIdentityStore = create<IIdentityState>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      currentQuestionIndex: 0,
      hasCompletedOnboarding: false,
      isInCooldown: false,
      cooldownEndsAt: null,
      logs: {},
      latestAnswers: {},
      manifesto: {
        fear: '',
        vision: '',
        nonNegotiables: '',
        identity: '',
        gapSkills: '',
      },

      // --- ACTIONS ---
      submitAnswer: (questionId, content) => {
        const timestamp = Date.now();
        const entry: IIdentityEntry = {
          id: uuidv4(),
          questionId,
          content,
          createdAt: timestamp,
        };

        set((state) => {
          // 1. Cập nhật Logs & Latest
          const newLogs = { ...state.logs };
          if (!newLogs[questionId]) newLogs[questionId] = [];
          
          // Thêm vào đầu mảng (Mới nhất trước)
          newLogs[questionId] = [entry, ...newLogs[questionId]];

          const newLatest = { ...state.latestAnswers };
          newLatest[questionId] = entry;

          // 2. Cập nhật Manifesto (Nếu trúng câu hỏi cốt lõi)
          const newManifesto = { ...state.manifesto };
          if (questionId === 19) newManifesto.fear = content;
          if (questionId === 20) newManifesto.vision = content;
          if (questionId === 21) newManifesto.nonNegotiables = content;
          if (questionId === 22) newManifesto.identity = content;
          if (questionId === 23) newManifesto.gapSkills = content;

          // 3. Logic điều hướng (Chỉ khi đang Onboarding)
          let nextIndex = state.currentQuestionIndex;
          let inCooldown = state.isInCooldown;
          let cooldownTime = state.cooldownEndsAt;
          let completed = state.hasCompletedOnboarding;

          // Nếu đang trả lời đúng câu hiện tại (Onboarding mode)
          if (state.currentQuestionIndex === IDENTITY_QUESTIONS.findIndex(q => q.id === questionId)) {
             // Logic Cooldown sau Câu 5
             if (questionId === 5) {
                inCooldown = true;
                cooldownTime = timestamp + COOLDOWN_DURATION;
             }
             
             // Logic Hoàn thành sau Câu 25
             if (questionId === 25) {
                completed = true;
                // TODO: Tại đây có thể trigger sự kiện tạo Task (sẽ xử lý ở UI hoặc Middleware)
             }

             // Tăng index nếu chưa hết
             if (questionId < 25 && !inCooldown) {
                 nextIndex = state.currentQuestionIndex + 1;
             }
          }

          return {
            logs: newLogs,
            latestAnswers: newLatest,
            manifesto: newManifesto,
            currentQuestionIndex: nextIndex,
            isInCooldown: inCooldown,
            cooldownEndsAt: cooldownTime,
            hasCompletedOnboarding: completed,
          };
        });
      },

      resetCooldown: () => {
        set({ isInCooldown: false, cooldownEndsAt: null });
      },

      getHistory: (questionId) => {
        return get().logs[questionId] || [];
      },
    }),
    {
      name: 'mind-cap-identity-storage', // Tên key trong localStorage/IndexedDB
      storage: createJSONStorage(() => localStorage), // Hoặc dùng indexedDB adapter nếu muốn
    }
  )
);