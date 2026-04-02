/**
 * =============================================================================
 * useLoadingState Hook - 加载状态管理
 * 提供加载状态的管理和过渡效果
 * =============================================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingStateOptions {
  minDuration?: number;
  delay?: number;
}

export interface LoadingStateReturn {
  isLoading: boolean;
  loadingProgress: number;
  loadingText: string;
  startLoading: (text?: string) => void;
  stopLoading: () => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingText: (text: string) => void;
  withLoading: <T>(promise: Promise<T>, text?: string) => Promise<T>;
}

export function useLoadingState(options: LoadingStateOptions = {}): LoadingStateReturn {
  const { minDuration = 300, delay = 0 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('加载中...');

  const startTimeRef = useRef<number>(0);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (minDurationTimeoutRef.current) clearTimeout(minDurationTimeoutRef.current);
    };
  }, []);

  const startLoading = useCallback(
    (text?: string) => {
      if (delay > 0) {
        delayTimeoutRef.current = setTimeout(() => {
          setIsLoading(true);
          startTimeRef.current = Date.now();
          setLoadingProgress(0);
          if (text) setLoadingText(text);
        }, delay);
      } else {
        setIsLoading(true);
        startTimeRef.current = Date.now();
        setLoadingProgress(0);
        if (text) setLoadingText(text);
      }
    },
    [delay]
  );

  const stopLoading = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = minDuration - elapsed;

    if (remaining > 0) {
      minDurationTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(100);
      }, remaining);
    } else {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, [minDuration]);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, text?: string): Promise<T> => {
      startLoading(text);
      try {
        const result = await promise;
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    loadingProgress,
    loadingText,
    startLoading,
    stopLoading,
    setLoadingProgress,
    setLoadingText,
    withLoading,
  };
}

export default useLoadingState;
