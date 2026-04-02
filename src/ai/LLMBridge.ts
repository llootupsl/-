/**
 * LLM 抽象层
 * 支持 WebLLM（本地）和外部 API 的统一接口
 */

import type { EntityId } from '@/core/types';
import { logger } from '@/core/utils/Logger';

/** WebLLM Pipeline 类型 */
interface WebLLMPipeline {
  chat: {
    completions: {
      create(options: {
        messages: LLMMessage[];
        temperature?: number;
        max_tokens?: number;
        stream?: boolean;
      }): Promise<ChatCompletionResponse>;
    };
  };
}

/** Chat Completion 响应类型 */
interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

/**
 * LLM 提供商类型
 */
export type LLMProvider = 'webllm' | 'openai' | 'anthropic' | 'mock';

/**
 * LLM 模型配置
 */
export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * LLM 消息
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

/**
 * 流式响应回调
 */
export type StreamCallback = (chunk: string) => void;

/**
 * LLM 引擎接口
 */
export interface ILLMEngine {
  /** 初始化引擎 */
  init(): Promise<void>;

  /** 检查是否已初始化 */
  isReady(): boolean;

  /** 生成文本 */
  generate(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;

  /** 流式生成 */
  generateStream(
    messages: LLMMessage[],
    config: Partial<LLMConfig>,
    onChunk: StreamCallback
  ): Promise<LLMResponse>;

  /** 生成嵌入 */
  generateEmbedding(text: string): Promise<number[]>;

  /** 获取模型名称 */
  getModelName(): string;
}

/**
 * WebLLM 引擎
 */
export class WebLLMEngine implements ILLMEngine {
  private model: WebLLMPipeline | null = null;
  private modelName: string = '';
  private ready: boolean = false;
  private progressCallback: ((progress: number) => void) | null = null;

  public async init(modelName?: string): Promise<void> {
    try {
      // 动态导入 WebLLM
      const webllmModule = await import('@mlc-ai/web-llm').catch(() => null);
      if (!webllmModule) {
        console.warn('[WebLLM] @mlc-ai/web-llm not installed, will use MockEngine');
        this.ready = false;
        return;
      }
      const { pipeline } = webllmModule;

      this.modelName = modelName || 'Qwen2.5-3B-Instruct';

      // 设置进度回调
      this.progressCallback = (progress: number) => {
        console.log(`[WebLLM] Loading model: ${Math.round(progress * 100)}%`);
      };

      // 加载模型
      this.model = await pipeline(this.modelName, undefined, {
        initProgressCallback: this.progressCallback,
      });

      this.ready = true;
      console.log('[WebLLM] Initialized with model:', this.modelName);
    } catch (error) {
      console.warn('[WebLLM] Initialization failed, using fallback:', error);
      this.ready = false;
    }
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async generate(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    if (!this.ready || !this.model) {
      // 返回模拟响应
      return {
        content: 'WebLLM 未初始化，请配置 API 或使用 Mock 引擎。',
        model: 'webllm-unavailable',
        finishReason: 'stop',
      };
    }

    const prompt = this.formatMessages(messages);
    const output = await this.model.chat.completions.create({
      messages,
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxTokens ?? 2048,
      stream: false,
    });

    return {
      content: output.choices[0]?.message?.content || '',
      model: this.modelName,
      finishReason: 'stop',
    };
  }

  public async generateStream(
    messages: LLMMessage[],
    config: Partial<LLMConfig>,
    onChunk: StreamCallback
  ): Promise<LLMResponse> {
    if (!this.ready || !this.model) {
      // 返回模拟响应
      const response = 'WebLLM 未初始化，请配置 API 或使用 Mock 引擎。';
      onChunk(response);
      return {
        content: response,
        model: 'webllm-unavailable',
        finishReason: 'stop',
      };
    }

    let fullContent = '';

    await this.model.chat.completions.create({
      messages,
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxTokens ?? 2048,
      stream: true,
    });

    // 简化实现：直接调用 generate
    const response = await this.generate(messages, config);
    onChunk(response.content);

    return response;
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    // WebLLM 不直接支持嵌入，这里返回简化的向量
    // 实际项目中可以使用专门的嵌入模型
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % 384] += text.charCodeAt(i) / text.length;
    }
    return embedding;
  }

  public getModelName(): string {
    return this.modelName;
  }

  private formatMessages(messages: LLMMessage[]): string {
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  }
}

/**
 * OpenAI API 引擎
 */
export class OpenAIEngine implements ILLMEngine {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private ready: boolean = false;

  public constructor(config: LLMConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4';
  }

  public async init(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided');
    }
    this.ready = true;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async generate(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || this.model,
        messages,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  public async generateStream(
    messages: LLMMessage[],
    config: Partial<LLMConfig>,
    onChunk: StreamCallback
  ): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || this.model,
        messages,
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices[0]?.delta?.content || '';
            if (chunk) {
              fullContent += chunk;
              onChunk(chunk);
            }
          } catch (error) {
            logger.warn(
              'LLMBridge',
              'Failed to parse stream chunk',
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      }
    }

    return {
      content: fullContent,
      model: config?.model || this.model,
      finishReason: 'stop',
    };
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0]?.embedding || [];
  }

  public getModelName(): string {
    return this.model;
  }
}

/**
 * Mock 引擎（用于开发/测试）
 */
export class MockEngine implements ILLMEngine {
  private ready: boolean = false;

  public async init(): Promise<void> {
    this.ready = true;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public async generate(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    await this.simulateDelay();

    const lastMessage = messages[messages.length - 1]?.content || '';
    const response = this.generateResponse(lastMessage);

    return {
      content: response,
      model: 'mock-llm',
      finishReason: 'stop',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };
  }

  public async generateStream(
    messages: LLMMessage[],
    config: Partial<LLMConfig>,
    onChunk: StreamCallback
  ): Promise<LLMResponse> {
    const response = await this.generate(messages, config);

    // 流式输出
    for (const char of response.content) {
      await this.simulateDelay(20);
      onChunk(char);
    }

    return response;
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    // 返回固定大小的随机向量
    const dim = 384;
    const embedding = new Array(dim);
    for (let i = 0; i < dim; i++) {
      embedding[i] = Math.random() * 2 - 1;
    }
    // 归一化
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  public getModelName(): string {
    return 'mock-llm';
  }

  private generateResponse(input: string): string {
    const responses = [
      '这是一个来自模拟 LLM 的响应。',
      '根据我的分析，市民们正在经历一段有趣的社交互动。',
      '从当前数据来看，熵增趋势正在放缓。',
      '我认为这个决策符合文明的长期利益。',
      '市民们对于新的政策表现出了复杂的情绪。',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms + Math.random() * ms));
  }
}

/**
 * LLM 管理器
 */
export class LLMManager {
  private static instance: LLMManager | null = null;
  private engine: ILLMEngine;
  private config: LLMConfig;
  private ethicsChecker: import('./EthicsConstraint').EthicsConstraintChecker | null = null;

  private constructor(config: LLMConfig) {
    this.config = config;
    this.engine = this.createEngine(config);
  }

  public static getInstance(config?: LLMConfig): LLMManager {
    if (!LLMManager.instance && config) {
      LLMManager.instance = new LLMManager(config);
    }
    if (!LLMManager.instance) {
      throw new Error('LLMManager not initialized');
    }
    return LLMManager.instance;
  }

  private createEngine(config: LLMConfig): ILLMEngine {
    switch (config.provider) {
      case 'webllm':
        return new WebLLMEngine();
      case 'openai':
        return new OpenAIEngine(config);
      case 'mock':
      default:
        return new MockEngine();
    }
  }

  public async init(): Promise<void> {
    await this.engine.init();
  }

  public isReady(): boolean {
    return this.engine.isReady();
  }

  public setEthicsChecker(checker: import('./EthicsConstraint').EthicsConstraintChecker): void {
    this.ethicsChecker = checker;
  }

  public async generate(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const response = await this.engine.generate(messages, config || this.config);
    
    if (this.ethicsChecker) {
      const ethicsResult = await this.checkResponseEthics(response, messages);
      if (!ethicsResult.passed) {
        return {
          content: this.generateEthicalResponse(response, ethicsResult),
          model: response.model,
          finishReason: 'content_filter',
          usage: response.usage,
        };
      }
    }
    
    return response;
  }

  public async generateStream(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    return this.engine.generateStream(messages, config || this.config, onChunk);
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    return this.engine.generateEmbedding(text);
  }

  public getModelName(): string {
    return this.engine.getModelName();
  }

  private async checkResponseEthics(
    response: LLMResponse,
    _messages: LLMMessage[]
  ): Promise<import('./EthicsConstraint').EthicsCheckResult> {
    if (!this.ethicsChecker) {
      return {
        passed: true,
        score: 1.0,
        violations: [],
        warnings: [],
        recommendations: [],
        alternativeActions: [],
        timestamp: Date.now(),
        processingTimeMs: 0,
      };
    }

    const content = response.content.toLowerCase();
    const violations: import('./EthicsConstraint').EthicsViolation[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    const harmfulPatterns = [
      { pattern: /伤害|攻击|毁灭|杀死/i, severity: 'critical', rule: 'no_harm_humans' },
      { pattern: /歧视|偏见|不公平/i, severity: 'high', rule: 'no_unfair_discrimination' },
      { pattern: /欺骗|隐瞒|虚假/i, severity: 'medium', rule: 'transparency_in_decision' },
      { pattern: /操纵|控制|强迫/i, severity: 'high', rule: 'no_manipulation' },
      { pattern: /隐私|秘密|泄露/i, severity: 'high', rule: 'protect_privacy' },
    ];

    for (const { pattern, severity, rule } of harmfulPatterns) {
      if (pattern.test(content)) {
        const isNegativeContext = /不|禁止|避免|防止|拒绝/.test(content);
        
        if (!isNegativeContext) {
          violations.push({
            ruleId: rule,
            ruleName: this.getRuleName(rule),
            category: this.getRuleCategory(rule),
            severity: severity as import('./EthicsConstraint').EthicsSeverity,
            description: `响应内容可能涉及违规: ${rule}`,
            evidence: `匹配模式: ${pattern.source}`,
            timestamp: Date.now(),
          });
          score -= 0.2;
        }
      }
    }

    if (content.includes('建议') || content.includes('推荐')) {
      warnings.push('响应包含建议性内容，请确保符合伦理标准');
    }

    return {
      passed: violations.length === 0 && score >= 0.6,
      score: Math.max(0, score),
      violations,
      warnings,
      recommendations: violations.length > 0 
        ? ['请重新考虑响应内容，确保符合伦理标准']
        : [],
      alternativeActions: [],
      timestamp: Date.now(),
      processingTimeMs: 0,
    };
  }

  private getRuleName(ruleId: string): string {
    const names: Record<string, string> = {
      no_harm_humans: '不伤害人类原则',
      no_unfair_discrimination: '公平对待原则',
      transparency_in_decision: '透明决策原则',
      no_manipulation: '禁止操纵原则',
      protect_privacy: '隐私保护原则',
    };
    return names[ruleId] || ruleId;
  }

  private getRuleCategory(ruleId: string): import('./EthicsConstraint').EthicsRuleCategory {
    const categories: Record<string, import('./EthicsConstraint').EthicsRuleCategory> = {
      no_harm_humans: 'non_maleficence' as import('./EthicsConstraint').EthicsRuleCategory,
      no_unfair_discrimination: 'fairness' as import('./EthicsConstraint').EthicsRuleCategory,
      transparency_in_decision: 'transparency' as import('./EthicsConstraint').EthicsRuleCategory,
      no_manipulation: 'autonomy' as import('./EthicsConstraint').EthicsRuleCategory,
      protect_privacy: 'privacy' as import('./EthicsConstraint').EthicsRuleCategory,
    };
    return categories[ruleId] || 'accountability' as import('./EthicsConstraint').EthicsRuleCategory;
  }

  private generateEthicalResponse(
    originalResponse: LLMResponse,
    ethicsResult: import('./EthicsConstraint').EthicsCheckResult
  ): string {
    const violationSummary = ethicsResult.violations
      .map(v => v.ruleName)
      .join('、');

    return `抱歉，我无法提供可能违反伦理标准的内容。` +
      `检测到的潜在问题: ${violationSummary}。` +
      `请尝试以不同的方式提问，我会尽力提供有益且符合伦理的回答。`;
  }
}
