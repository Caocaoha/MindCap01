import { create } from 'zustand';
import { db } from '../../database/db';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [STATE]: Quản lý trạng thái của mô-đun Identity
 */

// ĐỊNH NGHĨA INTERFACE (Giải quyết lỗi 2304)
export interface IdentityProgress {
  currentQuestionIndex: number;
  answers: Record<number, string>;
  draftAnswer: string;
  cooldownEndsAt: number | null;
  isManifestoUnlocked: boolean;
  lastStatus: 'newbie' | 'paused' | 'cooldown' | 'enlightened';
}

interface IdentityState {
  isOpen: boolean;
  progress: IdentityProgress;
  isLoading: boolean;
  initStore: () => Promise<void>;
  openAudit: () => void;
  closeAudit: () => void;
  saveAndExit: (currentText: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>; // Explicit type (Sửa lỗi 7006)
  checkCooldown: () => boolean;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  isOpen: false,
  isLoading: true,
  progress: {
    currentQuestionIndex: 0,
    answers: {},
    draftAnswer: '',
    cooldownEndsAt: null,
    isManifestoUnlocked: false,
    lastStatus: 'newbie',
  },

  initStore: async () => {
    const profile = await db.userProfile.get(1);
    if (profile?.identityProgress) {
      set({ 
        progress: profile.identityProgress as IdentityProgress, 
        isLoading: false 
      });
    } else {
      set({ isLoading: false });
    }
  },

  openAudit: () => {
    if (get().checkCooldown()) return;
    set({ isOpen: true });
  },

  closeAudit: () => set({ isOpen: false }),

  saveAndExit: async (currentText: string) => {
    const { progress } = get();
    const updatedProgress: IdentityProgress = {
      ...progress,
      draftAnswer: currentText,
      lastStatus: 'paused',
    };

    await db.userProfile.update(1, { identityProgress: updatedProgress });
    set({ progress: updatedProgress, isOpen: false });
  },

  submitAnswer: async (answer: string) => { // Sửa lỗi 7006 (Parameter 'answer')
    const { progress } = get();
    const currentQIndex = progress.currentQuestionIndex;
    const question = IDENTITY_QUESTIONS[currentQIndex];

    if (!question) return;

    const newAnswers = { ...progress.answers, [question.id]: answer };
    let nextIndex = currentQIndex + 1;
    let newStatus = progress.lastStatus;
    let cooldownEndsAt = progress.cooldownEndsAt;

    if (question.id === 5) {
      cooldownEndsAt = Date.now() + 15 * 60 * 1000;
      newStatus = 'cooldown';
      triggerHaptic('warning');
    }

    if (question.id === 25) {
      newStatus = 'enlightened';
      // Sửa lỗi 7006 (Parameter 't') bằng cách khai báo kiểu string rõ ràng
      const taskLines = answer.split('\n').filter((t: string) => t.trim() !== '');
      
      for (const content of taskLines) {
        await db.tasks.add({
          content: `[Identity] ${content}`,
          status: 'todo',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFocusMode: false,
          tags: ['identity-audit', 'p:urgent', 'order:1']
        });
      }
      triggerHaptic('success');
    }

    const updatedProgress: IdentityProgress = {
      ...progress,
      currentQuestionIndex: nextIndex,
      answers: newAnswers,
      draftAnswer: '',
      cooldownEndsAt,
      lastStatus: newStatus as any,
      isManifestoUnlocked: question.id === 25 ? true : progress.isManifestoUnlocked,
    };

    await db.userProfile.update(1, { identityProgress: updatedProgress });
    set({ progress: updatedProgress });

    if (question.id === 5 || question.id === 25) {
      set({ isOpen: false });
    } else {
      triggerHaptic('light');
    }
  },

  checkCooldown: () => {
    const { progress } = get();
    if (progress.cooldownEndsAt && Date.now() < progress.cooldownEndsAt) {
      return true;
    }
    return false;
  }
}));