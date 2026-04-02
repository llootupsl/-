/**
 * =============================================================================
 * Toast 通知系统 - 熵增时代的实时反馈
 * =============================================================================
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
} from 'react';

/* ==========================================================================
   类型定义
   ========================================================================== */

export type ToastType = 'info' | 'success' | 'warning' | 'danger' | 'divine' | 'quantum';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  progress?: number;
  icon?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/* ==========================================================================
   上下文
   ========================================================================== */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/* ==========================================================================
   预设的 toast 函数
   ========================================================================== */

let globalAddToast: ((toast: Omit<Toast, 'id'>) => string) | null = null;

export const toast = {
  info: (title: string, message?: string) =>
    globalAddToast?.({ type: 'info', title, message, duration: 4000 }),
  success: (title: string, message?: string) =>
    globalAddToast?.({ type: 'success', title, message, duration: 4000 }),
  warning: (title: string, message?: string) =>
    globalAddToast?.({ type: 'warning', title, message, duration: 5000 }),
  danger: (title: string, message?: string) =>
    globalAddToast?.({ type: 'danger', title, message, duration: 6000 }),
  divine: (title: string, message?: string) =>
    globalAddToast?.({ type: 'divine', title, message, duration: 5000 }),
  quantum: (title: string, message?: string) =>
    globalAddToast?.({ type: 'quantum', title, message, duration: 4000 }),
};

/* ==========================================================================
   Toast 提供器
   ========================================================================== */

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = toastData.duration ?? 4000;

      setToasts((prev) => {
        const newToasts = [...prev, { ...toastData, id }];
        // 限制最大数量
        if (newToasts.length > maxToasts) {
          const removed = newToasts.shift();
          if (removed) removeToast(removed.id);
        }
        return newToasts;
      });

      // 设置自动移除定时器
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // 保存全局添加函数
  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  // 清理所有定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/* ==========================================================================
   Toast 容器
   ========================================================================== */

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = memo(
  ({ toasts, onRemove }) => {
    return (
      <div
        className="toast-container"
        role="region"
        aria-label="通知"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => onRemove(t.id)} />
        ))}
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

/* ==========================================================================
   单个 Toast 项
   ========================================================================== */

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = memo(({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration ?? 4000;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (duration <= 0 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const step = 100 / (duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return next;
      });
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, isPaused]);

  const icons: Record<ToastType, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '🚫',
    divine: '✨',
    quantum: '⚛️',
  };

  const icon = toast.icon ?? icons[toast.type];

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="toast-icon">{icon}</div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && (
          <div className="toast-message">{toast.message}</div>
        )}
      </div>
      <button
        className="toast-close"
        onClick={onRemove}
        aria-label="关闭通知"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </button>
      {duration > 0 && (
        <div
          className="toast-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
});

ToastItem.displayName = 'ToastItem';
