/**
 * =============================================================================
 * useLazyLoad Hook - 懒加载
 * 用于图片、组件等的懒加载
 * =============================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export interface LazyLoadReturn {
  ref: React.RefObject<HTMLDivElement>;
  isLoaded: boolean;
  isVisible: boolean;
  isLoading: boolean;
  error: Error | null;
  load: () => void;
  reset: () => void;
}

export function useLazyLoad(options: LazyLoadOptions = {}): LazyLoadReturn {
  const { threshold = 0.1, rootMargin = '100px', triggerOnce = true } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (triggerOnce && hasTriggeredRef.current) return;

            setIsVisible(true);
            hasTriggeredRef.current = true;

            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoaded(false);
    setIsLoading(false);
    setError(null);
    hasTriggeredRef.current = false;
  }, []);

  return {
    ref,
    isLoaded,
    isVisible,
    isLoading,
    error,
    load,
    reset,
  };
}

export interface LazyLoadMoreOptions {
  threshold?: number;
  rootMargin?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function useLazyLoadMore(options: LazyLoadMoreOptions): {
  sentinelRef: React.RefObject<HTMLDivElement>;
} {
  const { threshold = 0.1, rootMargin = '200px', onLoadMore, hasMore, isLoading } = options;

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, onLoadMore, hasMore, isLoading]);

  return { sentinelRef };
}

export default useLazyLoad;
