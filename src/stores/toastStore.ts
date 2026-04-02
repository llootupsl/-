/**
 * =============================================================================
 * Toast 通知状态管理 - Zustand Store
 * 赛博朋克风格通知系统
 * =============================================================================
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id' | 'createdAt' | 'duration'> & { duration?: number }) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  warning: 5000,
  error: 7000,
  info: 4000,
};

let toastIdCounter = 0;

const generateId = (): string => {
  toastIdCounter += 1;
  return `toast-${Date.now()}-${toastIdCounter}`;
};

export const useToastStore = create<ToastState & ToastActions>()(
  subscribeWithSelector((set, get) => ({
    toasts: [],
    maxToasts: 5,

    addToast: (toastData) => {
      const id = generateId();
      const duration = toastData.duration ?? DEFAULT_DURATIONS[toastData.type];
      
      const newToast: Toast = {
        ...toastData,
        id,
        duration,
        createdAt: Date.now(),
      };

      set((state) => {
        const newToasts = [...state.toasts, newToast];
        if (newToasts.length > state.maxToasts) {
          return { toasts: newToasts.slice(-state.maxToasts) };
        }
        return { toasts: newToasts };
      });

      return id;
    },

    removeToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    clearAll: () => {
      set({ toasts: [] });
    },
  }))
);

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', title, message, duration: duration ?? DEFAULT_DURATIONS.success }),
  
  warning: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, duration: duration ?? DEFAULT_DURATIONS.warning }),
  
  error: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', title, message, duration: duration ?? DEFAULT_DURATIONS.error }),
  
  info: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', title, message, duration: duration ?? DEFAULT_DURATIONS.info }),
};
