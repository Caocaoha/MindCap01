import { create } from 'zustand';
import { db } from '../../database/db';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { triggerHaptic } from '../../utils/haptic';
import { IUserProfile } from '../../database/types';

/**
 * [STATE]: Quản lý trạng thái mô-đun Identity v3.3
 * Hỗ trợ Bio-Pulse và Multi-Layer Answers.
 */

interface IdentityState {
  isOpen: boolean;
  progress: IUserProfile['identityProgress'];
  isLoading: boolean;
  initStore: () => Promise<void>;
  openAudit: (forceIndex?: number) => void;
  closeAudit: () => void;
  submitAnswer: (answer: string, targetId?: number) => Promise<void>;
  saveAndExit: (currentText: string) => Promise<void>;
  getPulseFrequency: () => number; // Trả về số giây cho 1 nhịp thở
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  isOpen: false,
  isLoading: true,
  progress: {
    currentQuestionIndex: 0,
    answers: {},
    draftAnswer: '',
    cooldownEndsAt: null,
    lastAuditAt: null,
    isManifestoUnlocked: false,
    lastStatus: 'newbie',
  },

  initStore: async () => {
    const profile = await db.userProfile.get(1);
    if (profile?.identityProgress) {
      const stored = profile.identityProgress;
      
      // MIGRATION: Chuyển đổi dữ liệu cũ từ string sang string[]
      const migratedAnswers: Record<number, string[]> = {};
      Object.entries(stored.answers).forEach(([id, val]) => {
        migratedAnswers[Number(id)] = Array.isArray(val) ? val : [val];
      });

      set({ 
        progress: { ...stored, answers: migratedAnswers }, 
        isLoading: false 
      });
    } else {
      set({ isLoading: false });
    }
  },

  getPulseFrequency: () => {
    const { progress } = get();
    const now = Date.now();
    const fortyDaysMs = 40 * 24 * 60 * 60 * 1000;

    // 1. Newbie: Chưa có câu trả lời nào
    if (Object.keys(progress.answers).length === 0) return 100;

    // 2. Inactive: Lần cuối trả lời > 40 ngày
    if (progress.lastAuditAt && (now - progress.lastAuditAt > fortyDaysMs)) return 80;

    // 3. Started: Đang trong hành trình
    return 40;
  },

  openAudit: (forceIndex?: number) => {
    const { progress } = get();
    // Chặn nếu đang cooldown
    if (progress.cooldownEndsAt && Date.now() < progress.cooldownEndsAt) {
      triggerHaptic('warning');
      return;
    }

    if (forceIndex !== undefined) {
      set(state => ({
        progress: { ...state.progress, currentQuestionIndex: forceIndex },
        isOpen: true
      }));
    } else {
      set({ isOpen: true });
    }
  },

  closeAudit: () => set({ isOpen: false }),

  submitAnswer: async (answer: string, targetId?: number) => {
    const { progress } = get();
    const currentIdx = progress.currentQuestionIndex;
    const question = targetId 
      ? IDENTITY_QUESTIONS.find(q => q.id === targetId) 
      : IDENTITY_QUESTIONS[currentIdx];

    if (!question) return;

    // Cập nhật mảng câu trả lời (Thêm vào đầu mảng để bản mới nhất luôn ở trên)
    const existingAnswers = progress.answers[question.id] || [];
    const newAnswers = {
      ...progress.answers,
      [question.id]: [answer, ...existingAnswers]
    };

    let nextIndex = targetId ? progress.currentQuestionIndex : currentIdx + 1;
    let isManifestoUnlocked = progress.isManifestoUnlocked;

    if (question.id === 25) isManifestoUnlocked = true;

    const updatedProgress = {
      ...progress,
      answers: newAnswers,
      currentQuestionIndex: nextIndex,
      lastAuditAt: Date.now(),
      isManifestoUnlocked,
      draftAnswer: '',
      lastStatus: (question.id === 25 ? 'enlightened' : 'paused') as any
    };

    await db.userProfile.update(1, { identityProgress: updatedProgress });
    set({ progress: updatedProgress });
    triggerHaptic('medium');
  },

  saveAndExit: async (currentText: string) => {
    const { progress } = get();
    const updated = { ...progress, draftAnswer: currentText, lastStatus: 'paused' as any };
    await db.userProfile.update(1, { identityProgress: updated });
    set({ progress: updated, isOpen: false });
  }
}));