/**
 * =============================================================================
 * API 网关 - 请求队列与限流管理
 * =============================================================================
 */

import { EventEmitter } from '@/core/EventEmitter';
import { logger } from '@/core/utils/Logger';

export interface APIRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  priority: number;
  retries: number;
  maxRetries?: number;
  timeout?: number;
  createdAt: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface APIResponse<T = unknown> {
  request: APIRequest;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

export interface APIGatewayConfig {
  maxConcurrent?: number;
  requestsPerSecond?: number;
  maxQueueSize?: number;
  defaultTimeout?: number;
  retryDelay?: number;
  maxRetries?: number;
}

const defaultConfig: Required<APIGatewayConfig> = {
  maxConcurrent: 5,
  requestsPerSecond: 10,
  maxQueueSize: 100,
  defaultTimeout: 30000,
  retryDelay: 1000,
  maxRetries: 3,
};

type RequestStatus = 'pending' | 'queued' | 'active' | 'completed' | 'failed';

/**
 * API 网关
 */
export class APIGateway extends EventEmitter {
  private config: Required<APIGatewayConfig>;
  private queue: APIRequest[] = [];
  private activeRequests: Map<string, { request: APIRequest; controller: AbortController; startTime: number }> = new Map();
  private completedRequests: Map<string, APIResponse> = new Map();
  private requestHistory: Array<{ timestamp: number; endpoint: string }> = [];
  private rateLimiterInterval: number | null = null;
  private isProcessing: boolean = false;
  private requestCounter: number = 0;

  constructor(config?: APIGatewayConfig) {
    super();
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 初始化
   */
  public init(): void {
    this.startRateLimiter();
    logger.info('APIGateway', 'Initialized');
  }

  /**
   * 启动限流器
   */
  private startRateLimiter(): void {
    if (this.rateLimiterInterval) return;

    this.rateLimiterInterval = window.setInterval(() => {
      // 清理历史记录
      const now = Date.now();
      this.requestHistory = this.requestHistory.filter(
        (record) => now - record.timestamp < 1000
      );
    }, 1000);
  }

  /**
   * 发送请求
   */
  public async request<T = unknown>(request: Omit<APIRequest, 'id' | 'createdAt' | 'retries'>): Promise<APIResponse<T>> {
    const fullRequest: APIRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      retries: 0,
      maxRetries: request.maxRetries || this.config.maxRetries,
      timeout: request.timeout || this.config.defaultTimeout,
    };

    return new Promise((resolve, reject) => {
      fullRequest.onSuccess = resolve as (data: unknown) => void;
      fullRequest.onError = reject as (error: Error) => void;

      this.enqueue(fullRequest);
    });
  }

  /**
   * GET 请求
   */
  public get<T = unknown>(url: string, options?: Partial<APIRequest>): Promise<APIResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      priority: 0,
      ...options,
    });
  }

  /**
   * POST 请求
   */
  public post<T = unknown>(url: string, body: unknown, options?: Partial<APIRequest>): Promise<APIResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      body,
      priority: 0,
      ...options,
    });
  }

  /**
   * PUT 请求
   */
  public put<T = unknown>(url: string, body: unknown, options?: Partial<APIRequest>): Promise<APIResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      body,
      priority: 0,
      ...options,
    });
  }

  /**
   * DELETE 请求
   */
  public delete<T = unknown>(url: string, options?: Partial<APIRequest>): Promise<APIResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      priority: 0,
      ...options,
    });
  }

  /**
   * 入队请求
   */
  private enqueue(request: APIRequest): void {
    if (this.queue.length >= this.config.maxQueueSize) {
      request.onError?.(new Error('Request queue is full'));
      this.emit('queue-full');
      return;
    }

    // 按优先级插入
    const insertIndex = this.queue.findIndex((r) => r.priority < request.priority);
    if (insertIndex === -1) {
      this.queue.push(request);
    } else {
      this.queue.splice(insertIndex, 0, request);
    }

    request.onSuccess && this.emit('request-queued', request);
    this.processQueue();
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // 检查并发限制
      if (this.activeRequests.size >= this.config.maxConcurrent) {
        await this.waitForSlot();
        continue;
      }

      // 检查速率限制
      if (!this.canSendRequest()) {
        await this.waitForRateLimit();
        continue;
      }

      const request = this.queue.shift();
      if (request) {
        await this.executeRequest(request);
      }
    }

    this.isProcessing = false;
  }

  /**
   * 检查是否可以发送请求
   */
  private canSendRequest(): boolean {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      (record) => now - record.timestamp < 1000
    );
    return recentRequests.length < this.config.requestsPerSecond;
  }

  /**
   * 等待可用的并发槽
   */
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.activeRequests.size < this.config.maxConcurrent) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * 等待速率限制
   */
  private waitForRateLimit(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  /**
   * 执行请求
   */
  private async executeRequest(request: APIRequest): Promise<void> {
    const controller = new AbortController();
    const startTime = Date.now();

    this.activeRequests.set(request.id, { request, controller, startTime });
    this.requestHistory.push({ timestamp: Date.now(), endpoint: request.url });

    this.emit('request-start', request);

    try {
      const response = await this.fetchWithTimeout(request, controller.signal);

      const duration = Date.now() - startTime;
      const apiResponse: APIResponse = {
        request,
        status: response.status,
        statusText: response.statusText,
        data: await response.json().catch(() => response.text()),
        headers: this.parseHeaders(response.headers),
        duration,
      };

      this.activeRequests.delete(request.id);
      this.completedRequests.set(request.id, apiResponse);

      if (response.ok) {
        this.emit('request-success', apiResponse);
        request.onSuccess?.(apiResponse.data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      this.activeRequests.delete(request.id);

      if ((error as Error).name === 'AbortError') {
        request.onError?.(new Error('Request aborted'));
        this.emit('request-aborted', request);
      } else {
        // 重试逻辑
        if (request.retries < request.maxRetries) {
          request.retries++;
          this.emit('request-retry', { request, attempt: request.retries });

          await this.delay(this.config.retryDelay * request.retries);
          this.queue.unshift(request);
          this.processQueue();
        } else {
          this.emit('request-error', { request, error });
          request.onError?.(error as Error);
        }
      }
    }
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    request: APIRequest,
    signal: AbortSignal
  ): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new DOMException('Request timeout', 'AbortError'));
      }, request.timeout);
    });

    const fetchPromise = fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal,
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 取消请求
   */
  public cancel(requestId: string): boolean {
    const active = this.activeRequests.get(requestId);
    if (active) {
      active.controller.abort();
      this.activeRequests.delete(requestId);
      this.emit('request-cancelled', active.request);
      return true;
    }

    // 从队列中移除
    const queueIndex = this.queue.findIndex((r) => r.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0];
      request.onError?.(new Error('Request cancelled'));
      return true;
    }

    return false;
  }

  /**
   * 取消所有请求
   */
  public cancelAll(): void {
    // 取消所有活跃请求
    this.activeRequests.forEach((active) => {
      active.controller.abort();
    });
    this.activeRequests.clear();

    // 清空队列
    this.queue.forEach((request) => {
      request.onError?.(new Error('All requests cancelled'));
    });
    this.queue = [];

    this.emit('all-cancelled');
  }

  /**
   * 获取请求状态
   */
  public getStatus(): {
    queueLength: number;
    activeCount: number;
    completedCount: number;
    recentRate: number;
  } {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      (record) => now - record.timestamp < 1000
    );

    return {
      queueLength: this.queue.length,
      activeCount: this.activeRequests.size,
      completedCount: this.completedRequests.size,
      recentRate: recentRequests.length,
    };
  }

  /**
   * 获取活跃请求
   */
  public getActiveRequests(): Array<{
    id: string;
    url: string;
    method: string;
    duration: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeRequests.values()).map((active) => ({
      id: active.request.id,
      url: active.request.url,
      method: active.request.method,
      duration: now - active.startTime,
    }));
  }

  /**
   * 获取请求统计
   */
  public getStats(): {
    totalRequests: number;
    successRate: number;
    averageDuration: number;
    queueUtilization: number;
  } {
    let totalDuration = 0;
    let successCount = 0;

    this.completedRequests.forEach((response) => {
      totalDuration += response.duration;
      if (response.status >= 200 && response.status < 300) {
        successCount++;
      }
    });

    const completed = this.completedRequests.size;

    return {
      totalRequests: this.requestCounter,
      successRate: completed > 0 ? (successCount / completed) * 100 : 0,
      averageDuration: completed > 0 ? totalDuration / completed : 0,
      queueUtilization: (this.queue.length / this.config.maxQueueSize) * 100,
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.cancelAll();
    this.completedRequests.clear();
    this.requestHistory = [];

    if (this.rateLimiterInterval) {
      clearInterval(this.rateLimiterInterval);
      this.rateLimiterInterval = null;
    }

    this.removeAllListeners();
  }
}

export default APIGateway;
