/**
 * =============================================================================
 * 永夜熵纪 - 语音合成模块
 * Speech Synthesis Module for NPC Voices
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';

/** 语音配置 */
export interface VoiceConfig {
  /** 语速 (0.1-10) */
  rate: number;
  /** 音调 (0-2) */
  pitch: number;
  /** 音量 (0-1) */
  volume: number;
  /** 语言 */
  lang: string;
  /** 声音 ID */
  voiceId?: string;
}

/** 默认配置 */
const DEFAULT_CONFIG: VoiceConfig = {
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'zh-CN',
};

/** 语音事件 */
export interface SpeechSynthesisEvents {
  /** 开始播放 */
  start: () => void;
  /** 结束播放 */
  end: () => void;
  /** 暂停 */
  pause: () => void;
  /** 恢复 */
  resume: () => void;
  /** 错误 */
  error: (error: Error) => void;
}

/**
 * 语音合成管理器
 */
export class SpeechSynthesisManager extends EventEmitter<SpeechSynthesisEvents> {
  private config: VoiceConfig;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;

  constructor(config: Partial<VoiceConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.checkSupport();
  }

  /**
   * 检查支持
   */
  private checkSupport(): void {
    this.isSupported = 'speechSynthesis' in window;
    
    if (this.isSupported) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // 监听声音列表变化
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * 加载可用声音
   */
  private loadVoices(): void {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
  }

  /**
   * 获取可用声音
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith(this.config.lang));
  }

  /**
   * 设置声音
   */
  public setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  /**
   * 设置语速
   */
  public setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * 设置音调
   */
  public setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * 设置音量
   */
  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 播放文本
   */
  public speak(text: string, options?: Partial<VoiceConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // 取消当前播放
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 应用配置
      const mergedConfig = { ...this.config, ...options };
      utterance.rate = mergedConfig.rate;
      utterance.pitch = mergedConfig.pitch;
      utterance.volume = mergedConfig.volume;
      utterance.lang = mergedConfig.lang;

      // 设置声音
      if (mergedConfig.voiceId) {
        const voice = this.voices.find(v => v.voiceURI === mergedConfig.voiceId);
        if (voice) {
          utterance.voice = voice;
        }
      } else {
        // 自动选择合适的声音
        const matchingVoice = this.voices.find(v => v.lang.startsWith(mergedConfig.lang));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      // 事件处理
      utterance.onstart = () => this.emit('start');
      utterance.onend = () => {
        this.currentUtterance = null;
        this.emit('end');
        resolve();
      };
      utterance.onpause = () => this.emit('pause');
      utterance.onresume = () => this.emit('resume');
      utterance.onerror = (e) => {
        const error = new Error(`Speech synthesis error: ${e.error}`);
        this.emit('error', error);
        reject(error);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * 暂停
   */
  public pause(): void {
    this.synthesis?.pause();
  }

  /**
   * 恢复
   */
  public resume(): void {
    this.synthesis?.resume();
  }

  /**
   * 停止
   */
  public cancel(): void {
    this.synthesis?.cancel();
    this.currentUtterance = null;
  }

  /**
   * 是否正在播放
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * 是否暂停
   */
  public isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  /**
   * 是否支持
   */
  public isSupportedBrowser(): boolean {
    return this.isSupported;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.cancel();
    this.removeAllListeners();
    this.synthesis = null;
    this.voices = [];
  }
}

// 单例
export const speechSynthesisManager = new SpeechSynthesisManager();

export default SpeechSynthesisManager;
