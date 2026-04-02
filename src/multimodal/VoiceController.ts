/**
 * 语音控制器
 * 语音识别与合成
 */

import { logger } from '@/core/utils/Logger';

export interface VoiceConfig {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export interface VoiceCommand {
  command: string;
  action: () => void | Promise<void>;
  description?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/** 语音识别事件接口 */
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResult[];
  readonly resultIndex: number;
}

// 使用external.d.ts中定义的ISpeechRecognition类型
type WebSpeechRecognition = ISpeechRecognition;

class VoiceController {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private commands: Map<string, VoiceCommand> = new Map();
  private state: VoiceState = 'idle';
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private commandListeners: Set<(transcript: string) => void> = new Set();
  private currentConfig: VoiceConfig = {
    lang: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  constructor() {
    this.initRecognition();
    this.initVoices();
  }

  /**
   * 检查语音支持
   */
  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * 检查语音合成支持
   */
  public isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * 初始化语音识别
   */
  private initRecognition(): void {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      logger.warn('Voice', '语音识别不支持');
      return;
    }

    // 使用类型断言绕过类型检查
    this.recognition = new SpeechRecognitionAPI() as unknown as ISpeechRecognition;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentConfig.lang!;

    this.recognition.onstart = () => {
      this.setState('listening');
      logger.info('Voice', '开始监听...');
    };

    this.recognition.onresult = (event) => {
      const results = event.results;
      const latest = results[results.length - 1];
      const transcript = latest[0].transcript.trim();
      
      this.commandListeners.forEach(listener => listener(transcript));

      if (latest.isFinal) {
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      logger.error('Voice', `识别错误: ${event.error}`);
      if (event.error !== 'no-speech') {
        this.setState('error');
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition?.start();
        } catch (error) {
          logger.warn('VoiceController', 'Recognition restart failed', error as Error);
          this.setState('idle');
        }
      } else {
        this.setState('idle');
      }
    };
  }

  /**
   * 初始化语音合成
   */
  private initVoices(): void {
    if (!this.isSynthesisSupported()) return;

    // 等待 voices 加载
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.selectChineseVoice(voices);
    }

    speechSynthesis.onvoiceschanged = () => {
      const voices = speechSynthesis.getVoices();
      this.selectChineseVoice(voices);
    };
  }

  /**
   * 选择中文语音
   */
  private selectChineseVoice(voices: SpeechSynthesisVoice[]): void {
    // 优先选择中文语音
    const chineseVoice = voices.find(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    ) || voices.find(v => v.default);
    
    if (chineseVoice) {
      this.currentConfig.voice = chineseVoice;
    }
  }

  /**
   * 设置状态
   */
  private setState(state: VoiceState): void {
    this.state = state;
    this.stateListeners.forEach(listener => listener(state));
  }

  /**
   * 获取当前状态
   */
  public getState(): VoiceState {
    return this.state;
  }

  /**
   * 注册状态监听
   */
  public onStateChange(listener: (state: VoiceState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * 注册命令监听
   */
  public onCommand(listener: (transcript: string) => void): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  /**
   * 注册语音命令
   */
  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.command.toLowerCase(), command);
    logger.debug('Voice', `注册命令: ${command.command}`);
  }

  /**
   * 注册多个命令
   */
  public registerCommands(commands: VoiceCommand[]): void {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  /**
   * 处理语音命令
   */
  private async processCommand(transcript: string): Promise<void> {
    this.setState('processing');
    logger.debug('Voice', `识别文本: ${transcript}`);

    const lowerTranscript = transcript.toLowerCase();
    
    for (const [cmd, handler] of this.commands) {
      if (lowerTranscript.includes(cmd)) {
        try {
          await handler.action();
          this.speak(`已执行: ${handler.description || cmd}`);
        } catch (error) {
          logger.error('Voice', `命令执行失败: ${cmd}`, error as Error);
          this.speak('命令执行失败');
        }
        return;
      }
    }

    this.setState('listening');
  }

  /**
   * 开始监听
   */
  public startListening(): boolean {
    if (!this.recognition || this.isListening) return false;

    try {
      this.recognition.lang = this.currentConfig.lang!;
      this.recognition.start();
      this.isListening = true;
      console.log('[Voice] 监听已启动');
      return true;
    } catch (error) {
      console.error('[Voice] 启动监听失败:', error);
      return false;
    }
  }

  /**
   * 停止监听
   */
  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    this.isListening = false;
    this.recognition.stop();
    logger.info('Voice', '监听已停止');
  }

  /**
   * 切换监听状态
   */
  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      return this.startListening();
    }
  }

  /**
   * 语音合成
   */
  public speak(text: string, config?: Partial<VoiceConfig>): void {
    if (!this.isSynthesisSupported()) {
      logger.warn('Voice', '语音合成不支持');
      return;
    }

    // 停止之前的语音
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const finalConfig = { ...this.currentConfig, ...config };
    
    utterance.lang = finalConfig.lang || 'zh-CN';
    utterance.rate = finalConfig.rate || 1.0;
    utterance.pitch = finalConfig.pitch || 1.0;
    utterance.volume = finalConfig.volume || 1.0;
    
    if (finalConfig.voice) {
      utterance.voice = finalConfig.voice;
    }

    utterance.onstart = () => {
      this.setState('speaking');
    };

    utterance.onend = () => {
      if (this.isListening) {
        this.setState('listening');
      } else {
        this.setState('idle');
      }
    };

    utterance.onerror = () => {
      logger.error('Voice', '语音合成错误');
      this.setState('error');
    };

    speechSynthesis.speak(utterance);
  }

  /**
   * 停止语音
   */
  public stopSpeaking(): void {
    speechSynthesis.cancel();
    this.setState('idle');
  }

  /**
   * 获取可用语音列表
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices().filter(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    );
  }

  /**
   * 设置语言
   */
  public setLanguage(lang: string): void {
    this.currentConfig.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * 设置语速
   */
  public setRate(rate: number): void {
    this.currentConfig.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * 设置音调
   */
  public setPitch(pitch: number): void {
    this.currentConfig.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  /**
   * 设置音量
   */
  public setVolume(volume: number): void {
    this.currentConfig.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 清除所有命令
   */
  public clearCommands(): void {
    this.commands.clear();
  }

  /**
   * 获取监听状态
   */
  public isActive(): boolean {
    return this.isListening;
  }

  /**
   * 获取当前配置
   */
  public getConfig(): VoiceConfig {
    return { ...this.currentConfig };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.commands.clear();
    this.stateListeners.clear();
    this.commandListeners.clear();
  }
}

// 单例实例
export const voiceController = new VoiceController();

export { VoiceController };
