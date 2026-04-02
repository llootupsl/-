/**
 * =============================================================================
 * useErrorHandler Hook - 错误处理系统
 * 统一的错误处理和友好的错误提示
 * =============================================================================
 */

import { useState, useCallback } from 'react';
import { logger } from '@/core/utils/Logger';

export interface ErrorInfo {
  id: string;
  code?: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
  retryable: boolean;
  suggestions?: Array<{
    action: string;
    label: string;
  }>;
}

export interface UseErrorHandlerOptions {
  maxErrors?: number;
  onUnhandledError?: (error: Error) => void;
}

export interface UseErrorHandlerReturn {
  errors: ErrorInfo[];
  hasErrors: boolean;
  addError: (error: Error | Partial<ErrorInfo>) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
  handleError: (error: unknown, context?: string) => string;
  getFriendlyMessage: (error: unknown) => string;
}

const ERROR_CODE_MAP: Record<string, { title: string; message: string; suggestions: Array<{ action: string; label: string }> }> = {
  NETWORK_ERROR: {
    title: '网络连接失败',
    message: '无法连接到服务器，请检查您的网络连接。',
    suggestions: [
      { action: 'retry', label: '重试' },
      { action: 'check_network', label: '检查网络' },
    ],
  },
  TIMEOUT: {
    title: '请求超时',
    message: '服务器响应时间过长，请稍后重试。',
    suggestions: [
      { action: 'retry', label: '重试' },
    ],
  },
  NOT_FOUND: {
    title: '资源不存在',
    message: '请求的资源已被移除或不存在。',
    suggestions: [
      { action: 'go_back', label: '返回上一页' },
      { action: 'go_home', label: '返回首页' },
    ],
  },
  PERMISSION_DENIED: {
    title: '权限不足',
    message: '您没有权限执行此操作。',
    suggestions: [
      { action: 'contact_admin', label: '联系管理员' },
    ],
  },
  VALIDATION_ERROR: {
    title: '数据验证失败',
    message: '提交的数据格式不正确，请检查后重试。',
    suggestions: [
      { action: 'check_input', label: '检查输入' },
    ],
  },
  UNKNOWN: {
    title: '发生错误',
    message: '操作失败，请稍后重试。',
    suggestions: [
      { action: 'retry', label: '重试' },
    ],
  },
};

let errorIdCounter = 0;

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { maxErrors = 5, onUnhandledError } = options;
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const getFriendlyMessage = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return ERROR_CODE_MAP.NETWORK_ERROR.message;
      }
      if (error.message.includes('timeout')) {
        return ERROR_CODE_MAP.TIMEOUT.message;
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        return ERROR_CODE_MAP.NOT_FOUND.message;
      }
      if (error.message.includes('403') || error.message.includes('permission')) {
        return ERROR_CODE_MAP.PERMISSION_DENIED.message;
      }
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return ERROR_CODE_MAP.VALIDATION_ERROR.message;
      }
      return error.message || ERROR_CODE_MAP.UNKNOWN.message;
    }
    return ERROR_CODE_MAP.UNKNOWN.message;
  }, []);

  const addError = useCallback(
    (error: Error | Partial<ErrorInfo>): string => {
      const id = `error-${++errorIdCounter}`;
      const timestamp = Date.now();

      let errorInfo: ErrorInfo;

      if (error instanceof Error) {
        const friendlyMessage = getFriendlyMessage(error);
        errorInfo = {
          id,
          title: ERROR_CODE_MAP.UNKNOWN.title,
          message: friendlyMessage,
          severity: 'error',
          timestamp,
          retryable: true,
        };
      } else {
        errorInfo = {
          id,
          title: error.title || ERROR_CODE_MAP.UNKNOWN.title,
          message: error.message || ERROR_CODE_MAP.UNKNOWN.message,
          severity: error.severity || 'error',
          timestamp,
          retryable: error.retryable ?? true,
          code: error.code,
          suggestions: error.suggestions,
        };
      }

      setErrors((prev) => {
        const newErrors = [errorInfo, ...prev];
        return newErrors.slice(0, maxErrors);
      });

      return id;
    },
    [getFriendlyMessage, maxErrors]
  );

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleError = useCallback(
    (error: unknown, context?: string): string => {
      logger.error(context || 'App', 'Error occurred', error instanceof Error ? error : new Error(String(error)));

      if (error instanceof Error) {
        onUnhandledError?.(error);
        return addError(error);
      }

      return addError({
        title: '发生错误',
        message: String(error),
        severity: 'error',
        retryable: true,
      });
    },
    [addError, onUnhandledError]
  );

  return {
    errors,
    hasErrors: errors.length > 0,
    addError,
    removeError,
    clearErrors,
    handleError,
    getFriendlyMessage,
  };
}

export default useErrorHandler;
