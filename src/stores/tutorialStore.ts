import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/core/utils/Logger';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: string;
  action?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到永夜熵纪',
    description: '你将扮演一位观察者，见证一个文明的诞生、发展与终结。在熵增的宇宙中，你的每一个决策都将影响文明的命运。',
    icon: '🌌',
  },
  {
    id: 'objective',
    title: '你的使命',
    description: '管理资源、引导市民、制定法律，尽可能延长文明的存续时间。当熵值达到100%时，宇宙将迎来热寂。',
    icon: '🎯',
  },
  {
    id: 'resources',
    title: '资源管理',
    description: '核心能源、算力配额、生物质、信息熵和信任值是文明的五大基础资源。注意监控资源状态，避免耗尽导致文明崩溃。',
    icon: '⚡',
    highlight: '.resource-overview',
  },
  {
    id: 'citizens',
    title: '市民系统',
    description: '市民是文明的核心。他们有自己的需求、情绪和社交网络。点击底部"市民"按钮查看详细信息。',
    icon: '👥',
    highlight: '.quick-panel',
    action: 'openCitizen',
  },
  {
    id: 'divine',
    title: '神力干预',
    description: '作为观察者，你可以使用神力影响文明进程。消耗观测点数施放神迹，改变市民命运。点击"神力"按钮体验。',
    icon: '✨',
    highlight: '.quick-panel',
    action: 'openDivine',
  },
  {
    id: 'dao',
    title: 'DAO治理',
    description: '文明的命运由全体市民共同决定。提出法案、参与投票，通过民主治理引导文明走向。点击"治理"按钮参与。',
    icon: '📜',
    highlight: '.quick-panel',
    action: 'openDAO',
  },
  {
    id: 'entropy',
    title: '熵值监控',
    description: '熵值是宇宙走向终结的倒计时。通过科技研发、资源管理和神力干预可以减缓熵增速度。',
    icon: '🌡️',
    highlight: '.entropy-bar-container',
  },
  {
    id: 'complete',
    title: '准备就绪',
    description: '你已经掌握了基本操作。记住：你的观测本身就会影响文明的走向。祝你好运，观察者！',
    icon: '🚀',
  },
];

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  startTime: number | null;
}

interface TutorialActions {
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  goToStep: (stepIndex: number) => void;
}

type TutorialStore = TutorialState & TutorialActions;

const STORAGE_KEY = 'omnis-tutorial-state';

const loadFromStorage = (): Partial<TutorialState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[Tutorial] Failed to load from localStorage:', e);
  }
  return {};
};

const saveToStorage = (state: TutorialState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed: state.completed,
      skipped: state.skipped,
    }));
  } catch (e) {
    logger.warn('Tutorial', 'Failed to save to localStorage', e as Error);
  }
};

const storedState = loadFromStorage();

const initialState: TutorialState = {
  isActive: false,
  currentStep: 0,
  completed: storedState.completed ?? false,
  skipped: storedState.skipped ?? false,
  startTime: null,
};

export const useTutorialStore = create<TutorialStore>()((set, get) => ({
  ...initialState,

  startTutorial: () => {
    set({
      isActive: true,
      currentStep: 0,
      startTime: Date.now(),
    });
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().completeTutorial();
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  skipTutorial: () => {
    const state = {
      isActive: false,
      skipped: true,
    };
    set(state);
    saveToStorage({ ...get(), ...state });
  },

  completeTutorial: () => {
    const state = {
      isActive: false,
      completed: true,
    };
    set(state);
    saveToStorage({ ...get(), ...state });
  },

  resetTutorial: () => {
    const state = {
      isActive: true,
      currentStep: 0,
      completed: false,
      skipped: false,
      startTime: Date.now(),
    };
    set(state);
    localStorage.removeItem(STORAGE_KEY);
  },

  goToStep: (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length) {
      set({ currentStep: stepIndex });
    }
  },
}));

export const useTutorialProgress = () => {
  const currentStep = useTutorialStore((s) => s.currentStep);
  const totalSteps = TUTORIAL_STEPS.length;
  return {
    current: currentStep + 1,
    total: totalSteps,
    percentage: Math.round(((currentStep + 1) / totalSteps) * 100),
  };
};

export const useShouldShowTutorial = () => {
  const completed = useTutorialStore((s) => s.completed);
  const skipped = useTutorialStore((s) => s.skipped);
  return !completed && !skipped;
};
