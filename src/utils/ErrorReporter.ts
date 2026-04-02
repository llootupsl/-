/**
 * =============================================================================
 * ErrorReporter - 错误上报机制
 * 支持本地存储、控制台输出和可选的远程上报
 * =============================================================================
 */

import { logger } from '@/core/utils/Logger';

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'error' | 'warning' | 'critical';
  category: ErrorCategory;
  title: string;
  message: string;
  details?: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  appVersion: string;
  additionalData?: Record<string, unknown>;
}

export type ErrorCategory = 
  | 'initialization'
  | 'network'
  | 'storage'
  | 'webgpu'
  | 'wasm'
  | 'audio'
  | 'citizen'
  | 'economy'
  | 'governance'
  | 'rendering'
  | 'unknown';

interface ErrorReporterConfig {
  maxStoredErrors: number;
  enableConsoleLog: boolean;
  enableLocalStorage: boolean;
  enableRemoteReport: boolean;
  remoteEndpoint?: string;
  appVersion: string;
}

const DEFAULT_CONFIG: ErrorReporterConfig = {
  maxStoredErrors: 50,
  enableConsoleLog: true,
  enableLocalStorage: true,
  enableRemoteReport: false,
  appVersion: '1.0.0',
};

const STORAGE_KEY = 'omnis_error_reports';

class ErrorReporterClass {
  private config: ErrorReporterConfig;
  private errorQueue: ErrorReport[] = [];

  constructor(config: Partial<ErrorReporterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadStoredErrors();
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private loadStoredErrors(): void {
    if (!this.config.enableLocalStorage) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.errorQueue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[ErrorReporter] Failed to load stored errors:', e);
    }
  }

  private saveErrors(): void {
    if (!this.config.enableLocalStorage) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.errorQueue));
    } catch (e) {
      console.warn('[ErrorReporter] Failed to save errors:', e);
    }
  }

  private trimQueue(): void {
    if (this.errorQueue.length > this.config.maxStoredErrors) {
      this.errorQueue = this.errorQueue.slice(-this.config.maxStoredErrors);
    }
  }

  report(
    error: Error | string,
    category: ErrorCategory = 'unknown',
    options: {
      type?: 'error' | 'warning' | 'critical';
      title?: string;
      additionalData?: Record<string, unknown>;
    } = {}
  ): ErrorReport {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: options.type || 'error',
      category,
      title: options.title || errorObj.message.slice(0, 100),
      message: errorObj.message,
      details: errorObj.cause?.toString(),
      stack: errorObj.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      appVersion: this.config.appVersion,
      additionalData: options.additionalData,
    };

    this.errorQueue.push(report);
    this.trimQueue();
    this.saveErrors();

    if (this.config.enableConsoleLog) {
      this.logToConsole(report);
    }

    if (this.config.enableRemoteReport && this.config.remoteEndpoint) {
      this.sendToRemote(report);
    }

    return report;
  }

  reportWithComponentStack(
    error: Error,
    componentStack: string,
    category: ErrorCategory = 'unknown',
    options: {
      type?: 'error' | 'warning' | 'critical';
      title?: string;
      additionalData?: Record<string, unknown>;
    } = {}
  ): ErrorReport {
    const report = this.report(error, category, options);
    report.componentStack = componentStack;
    this.saveErrors();
    return report;
  }

  private logToConsole(report: ErrorReport): void {
    const style = {
      error: 'color: #ef4444; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      critical: 'color: #dc2626; font-weight: bold; font-size: 14px;',
    }[report.type];

    console.group(`%c[${report.type.toUpperCase()}] ${report.category}`, style);
    console.log('标题:', report.title);
    console.log('消息:', report.message);
    if (report.details) console.log('详情:', report.details);
    if (report.stack) console.log('堆栈:', report.stack);
    if (report.componentStack) console.log('组件堆栈:', report.componentStack);
    if (report.additionalData) console.log('附加数据:', report.additionalData);
    console.log('时间:', new Date(report.timestamp).toLocaleString());
    console.log('ID:', report.id);
    console.groupEnd();
  }

  private async sendToRemote(report: ErrorReport): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        logger.warn('ErrorReporter', `Remote report failed with status: ${response.status}`);
      }
    } catch (e) {
      logger.warn('ErrorReporter', 'Failed to send remote report', e as Error);
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errorQueue];
  }

  getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errorQueue.slice(-count);
  }

  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorQueue.filter(e => e.category === category);
  }

  clearErrors(): void {
    this.errorQueue = [];
    this.saveErrors();
  }

  getErrorCount(): number {
    return this.errorQueue.length;
  }

  exportErrors(): string {
    return JSON.stringify(this.errorQueue, null, 2);
  }
}

export const errorReporter = new ErrorReporterClass();

export function reportError(
  error: Error | string,
  category: ErrorCategory = 'unknown',
  options?: {
    type?: 'error' | 'warning' | 'critical';
    title?: string;
    additionalData?: Record<string, unknown>;
  }
): ErrorReport {
  return errorReporter.report(error, category, options);
}

export default errorReporter;
