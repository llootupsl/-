/**
 * =============================================================================
 * useToast Hook - 通知系统便捷接口
 * =============================================================================
 */

import { useCallback } from 'react';
import { useToastStore, ToastType } from '../stores/toastStore';

interface UseToastReturn {
  success: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  custom: (type: ToastType, title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearAll = useToastStore((state) => state.clearAll);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  );

  const custom = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) =>
      addToast({ type, title, message, duration: duration ?? getDefaultDuration(type) }),
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => removeToast(id),
    [removeToast]
  );

  const dismissAll = useCallback(() => clearAll(), [clearAll]);

  return {
    success,
    warning,
    error,
    info,
    custom,
    dismiss,
    dismissAll,
  };
}

function getDefaultDuration(type: ToastType): number {
  const durations: Record<ToastType, number> = {
    success: 3000,
    warning: 5000,
    error: 7000,
    info: 4000,
  };
  return durations[type];
}

export default useToast;
