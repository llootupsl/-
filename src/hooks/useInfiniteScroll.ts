/**
 * =============================================================================
 * useInfiniteScroll Hook - 无限滚动
 * 用于列表的分页加载和缓存
 * =============================================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
}

export interface UseInfiniteScrollOptions<T> {
  initialData?: T[];
  pageSize?: number;
  loadMore: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  cacheKey?: string;
  cacheTimeout?: number;
}

export interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  prependItems: (newItems: T[]) => void;
  updateItem: (index: number, updater: (item: T) => T) => void;
  removeItem: (index: number) => void;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  total: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function useInfiniteScroll<T>(
  options: UseInfiniteScrollOptions<T>
): UseInfiniteScrollReturn<T> {
  const { initialData = [], pageSize = 20, loadMore: loadMoreFn, cacheKey, cacheTimeout = 5 * 60 * 1000 } = options;

  const [items, setItems] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize,
    hasMore: true,
    total: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getCache = useCallback((key: string): CacheEntry<T> | null => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < cacheTimeout) {
      return entry;
    }
    cache.delete(key);
    return null;
  }, [cacheTimeout]);

  const setCache = useCallback((key: string, data: T[], total: number) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      total,
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !pagination.hasMore) return;

    const nextPage = pagination.page + 1;
    const pageCacheKey = cacheKey ? `${cacheKey}-page-${nextPage}` : null;

    if (pageCacheKey) {
      const cached = getCache(pageCacheKey);
      if (cached) {
        setItems((prev) => [...prev, ...cached.data]);
        setPagination((prev) => ({
          ...prev,
          page: nextPage,
          hasMore: prev.page + 1 < Math.ceil(cached.total / pageSize),
        }));
        return;
      }
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      const result = await loadMoreFn(nextPage, pageSize);

      setItems((prev) => [...prev, ...result.data]);
      setPagination((prev) => ({
        ...prev,
        page: nextPage,
        total: result.total,
        hasMore: (nextPage + 1) * pageSize < result.total,
      }));

      if (pageCacheKey) {
        setCache(pageCacheKey, result.data, result.total);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, pagination, pageSize, loadMoreFn, cacheKey, getCache, setCache]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setItems([]);
    setPagination({
      page: 0,
      pageSize,
      hasMore: true,
      total: 0,
    });

    try {
      abortControllerRef.current = new AbortController();
      const result = await loadMoreFn(1, pageSize);

      setItems(result.data);
      setPagination({
        page: 1,
        pageSize,
        total: result.total,
        hasMore: result.data.length < result.total,
      });

      if (cacheKey) {
        setCache(`${cacheKey}-page-1`, result.data, result.total);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, loadMoreFn, cacheKey, setCache]);

  const reset = useCallback(() => {
    setItems([]);
    setPagination({
      page: 0,
      pageSize,
      hasMore: true,
      total: 0,
    });
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [pageSize]);

  const prependItems = useCallback((newItems: T[]) => {
    setItems((prev) => [...newItems, ...prev]);
    setPagination((prev) => ({
      ...prev,
      total: prev.total + newItems.length,
    }));
  }, []);

  const updateItem = useCallback((index: number, updater: (item: T) => T) => {
    setItems((prev) => {
      const newItems = [...prev];
      if (index >= 0 && index < newItems.length) {
        newItems[index] = updater(newItems[index]);
      }
      return newItems;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      if (index >= 0 && index < newItems.length) {
        newItems.splice(index, 1);
      }
      return newItems;
    });
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore: pagination.hasMore,
    page: pagination.page,
    total: pagination.total,
    loadMore,
    refresh,
    reset,
    prependItems,
    updateItem,
    removeItem,
  };
}

export default useInfiniteScroll;
