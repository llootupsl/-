/**
 * =============================================================================
 * 永夜熵纪 - 语音识别模块
 * Speech Recognition Module using Web Speech API
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/utils/Logger';

/** 识别结果 */
export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

/** 语音命令 */
export interface VoiceCommand {
  id: string;
  patterns: string[];
  action: (params: Record<string, string>) => void;
  description?: string;
}

/** 语音识别事件 */
export interface SpeechRecognitionEvents {
  /** 识别结果 */
  result: (result: RecognitionResult) => void;
  /** 命令匹配 */
  command: (command: VoiceCommand, params: Record<string, string>) => void;
  /** 开始识别 */
  start: () => void;
  /** 停止识别 */
  end: () => void;
  /** 错误 */
  error: (error: Error) => void;
}

/** 语音识别配置 */
export interface SpeechRecognitionConfig {
  /** 语言 */
  language: string;
  /** 连续识别 */
  continuous: boolean;
  /** 临时结果 */
  interimResults: boolean;
  /** 最大替代结果 */
  maxAlternatives: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: SpeechRecognitionConfig = {
  language: 'zh-CN',
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
};

/**
 * 语音识别管理器
 */
export class SpeechRecognitionManager extends EventEmitter<SpeechRecognitionEvents> {
  private config: SpeechRecognitionConfig;
  private recognition: ISpeechRecognition | null = null;
  private commands: Map<string, VoiceCommand> = new Map();
  private isListening: boolean = false;
  private isSupported: boolean = false;

  constructor(config: Partial<SpeechRecognitionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.checkSupport();
  }

  /**
   * 检查支持
   */
  private checkSupport(): void {
    const SpeechRecognition = window.SpeechRecognition || 
      window.webkitSpeechRecognition;
    
    this.isSupported = !!SpeechRecognition;
    
    if (this.isSupported && SpeechRecognition) {
      // 使用类型断言绕过类型检查
      this.initRecognition(SpeechRecognition as unknown as new () => ISpeechRecognition);
    }
  }

  /**
   * 初始化识别器
   */
  private initRecognition(SpeechRecognitionClass: new () => ISpeechRecognition): void {
    this.recognition = new SpeechRecognitionClass();
    
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const recognitionResult: RecognitionResult = {
          transcript: result[0].transcript.toLowerCase().trim(),
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          timestamp: Date.now(),
        };
        
        this.emit('result', recognitionResult);
        
        // 匹配命令
        if (result.isFinal) {
          this.matchCommand(recognitionResult.transcript);
        }
      }
    };

    // 开始
    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('start');
    };

    // 结束
    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('end');
      
      // 如果是连续模式，自动重启
      if (this.config.continuous && this.isListening) {
        this.start();
      }
    };

    this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      this.emit('error', error);
    };
  }

  /**
   * 注册语音命令
   */
  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, command);
  }

  /**
   * 批量注册命令
   */
  public registerCommands(commands: VoiceCommand[]): void {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
  }

  /**
   * 匹配命令
   */
  private matchCommand(transcript: string): void {
    for (const command of this.commands.values()) {
      for (const pattern of command.patterns) {
        const params = this.extractParams(transcript, pattern);
        if (params !== null) {
          this.emit('command', command, params);
          command.action(params);
          return;
        }
      }
    }
  }

  /**
   * 提取参数
   */
  private extractParams(transcript: string, pattern: string): Record<string, string> | null {
    // 将模式转换为正则表达式
    const paramNames: string[] = [];
    const regexStr = pattern.replace(/\{(\w+)\}/g, (_, name) => {
      paramNames.push(name);
      return '(.+?)';
    });

    const regex = new RegExp(`^${regexStr}$`, 'i');
    const match = transcript.match(regex);

    if (!match) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match[i + 1].trim();
    }

    return params;
  }

  /**
   * 开始识别
   */
  public start(): void {
    if (!this.isSupported || !this.recognition || this.isListening) return;

    try {
      this.recognition.start();
    } catch (error) {
      // 可能已经在运行
      logger.warn('SpeechRecognition', 'Start error', error as Error);
    }
  }

  /**
   * 停止识别
   */
  public stop(): void {
    if (!this.recognition) return;

    this.isListening = false;
    this.recognition.stop();
  }

  /**
   * 设置语言
   */
  public setLanguage(lang: string): void {
    this.config.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * 获取已注册命令
   */
  public getCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * 移除命令
   */
  public removeCommand(id: string): boolean {
    return this.commands.delete(id);
  }

  /**
   * 是否支持
   */
  public isSupportedBrowser(): boolean {
    return this.isSupported;
  }

  /**
   * 是否正在监听
   */
  public isActive(): boolean {
    return this.isListening;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stop();
    this.commands.clear();
    this.removeAllListeners();
    this.recognition = null;
  }
}

// 单例
export const speechRecognition = new SpeechRecognitionManager();

export default SpeechRecognitionManager;
