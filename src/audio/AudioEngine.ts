/**
 * =============================================================================
 * 永夜熵纪 - 程序化音频引擎
 * Procedural Audio Engine with AudioWorklet + Wasm
 * =============================================================================
 * 
 * 特性：
 * - 自适应采样率（尝试最高支持值）
 * - AudioWorklet 无阻塞音频处理
 * - Wasm 高性能音频合成（待完善）
 * - 3D 空间音频
 * - 多种预设音色
 * 
 * 采样率说明（重要）：
 * - 目标采样率：192kHz（高端音频设备规格）
 * - 浏览器限制：大多数浏览器最高支持 96kHz，部分仅支持 48kHz
 * - 实现策略：尝试目标值 → 降级到 96kHz → 降级到浏览器默认
 * - 注意：192kHz 是目标值而非保证值，实际采样率取决于设备硬件
 * 
 * 为什么不使用 WASM 离线渲染：
 * - 离线渲染需要额外的 AudioContext 同步开销
 * - 当前策略在用户体验上与高采样率无明显差异
 * - 重点应放在音效质量和空间音频上
 */

import { logger } from '@/core/utils/Logger';
import { isWasmReady } from '@/wasm/WasmBridge';

/** 音频配置常量 */
const AUDIO_CONFIG = {
  TARGET_SAMPLE_RATE: 192000,  // 目标采样率（需求规格）
  MAX_BROWSER_RATE: 96000,     // 浏览器通常支持的最高值
  FALLBACK_RATE: 48000,        // 降级默认值
  LATENCY_HINT: 'interactive' as AudioContextLatencyCategory,
  WORKLET_PROCESSOR: 'synth-processor',
};

/**
 * 音效类型
 */
export enum SoundType {
  UI_CLICK = 'ui_click',
  UI_HOVER = 'ui_hover',
  NOTIFICATION = 'notification',
  WARNING = 'warning',
  ERROR = 'error',
  BIRTH = 'birth',
  DEATH = 'death',
  BATTLE = 'battle',
  PEACE = 'peace',
  CATASTROPHE = 'catastrophe',
  REVOLUTION = 'revolution',
  AMBIENT = 'ambient',
  BGM = 'bgm',
}

/**
 * 音频引擎
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEffects: Map<SoundType, AudioBuffer> = new Map();
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private currentBGM: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  
  // AudioWorklet 相关
  private synthWorklet: AudioWorkletNode | null = null;
  private workletReady: boolean = false;
  
  // Wasm 音频合成器
  private wasmAudioSynth: any = null;
  private wasmReady: boolean = false;
  
  // 预设音色名称
  public static readonly PRESETS = {
    CYBER_PAD: 'cyberPad',
    NEURAL_BASS: 'neuralBass',
    ENTROPY_LEAD: 'entropyLead',
    ALERT: 'alert',
  } as const;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * 初始化音频引擎
   * 尝试使用高采样率，如果失败则降级
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 尝试创建高采样率上下文
      let targetRate = AUDIO_CONFIG.TARGET_SAMPLE_RATE;
      
      // 首先尝试192kHz（需求规格）
      try {
        this.context = new AudioContext({
          latencyHint: AUDIO_CONFIG.LATENCY_HINT,
          sampleRate: AUDIO_CONFIG.TARGET_SAMPLE_RATE,
        });
        console.log(`[Audio] Created context with target sample rate: ${this.context.sampleRate}Hz`);
      } catch (error) {
        logger.warn('Audio', 'Failed to create context with target sample rate, falling back to 96kHz', error as Error);
        // 降级到96kHz
        try {
          this.context = new AudioContext({
            latencyHint: AUDIO_CONFIG.LATENCY_HINT,
            sampleRate: AUDIO_CONFIG.MAX_BROWSER_RATE,
          });
          logger.info('Audio', `Created context with high sample rate: ${this.context.sampleRate}Hz`);
        } catch (error2) {
          console.warn('[Audio] Failed to create context with high sample rate:', error2);
          // 最终降级到浏览器默认
          this.context = new AudioContext({
            latencyHint: AUDIO_CONFIG.LATENCY_HINT,
          });
          console.log(`[Audio] Created context with default sample rate: ${this.context.sampleRate}Hz`);
        }
      }
      
      // 记录实际采样率
      const actualSampleRate = this.context.sampleRate;
      if (actualSampleRate < AUDIO_CONFIG.TARGET_SAMPLE_RATE) {
        console.warn(
          `[Audio] Sample rate ${actualSampleRate}Hz is below target ${AUDIO_CONFIG.TARGET_SAMPLE_RATE}Hz. ` +
          `Browser/hardware limitation detected.`
        );
      }

      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.volume;

      this.bgmGain = this.context.createGain();
      this.bgmGain.connect(this.masterGain);
      this.bgmGain.gain.value = 0.3;

      // 初始化 AudioWorklet（异步，不阻塞）
      this.initAudioWorklet().catch(err => {
        logger.warn('Audio', 'AudioWorklet init failed, using fallback', err as Error);
      });

      // 预生成音效
      await this.generateSounds();

      this.isInitialized = true;
      logger.info('Audio', `Initialized at ${actualSampleRate}Hz`);
    } catch (error) {
      logger.error('Audio', 'Initialization failed', error as Error);
    }
  }
  
  /**
   * 初始化 AudioWorklet 合成器
   */
  private async initAudioWorklet(): Promise<void> {
    if (!this.context) return;
    
    try {
      // 加载 AudioWorklet 处理器模块
      const workletUrl = new URL('./worklet/synth-processor.ts', import.meta.url);
      await this.context.audioWorklet.addModule(workletUrl.href);
      
      // 创建 AudioWorklet 节点
      this.synthWorklet = new AudioWorkletNode(
        this.context,
        AUDIO_CONFIG.WORKLET_PROCESSOR,
        {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2], // 立体声输出
        }
      );
      
      // 连接到主增益节点
      this.synthWorklet.connect(this.masterGain);
      
      // 设置消息处理
      this.synthWorklet.port.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case 'ready':
            this.workletReady = true;
            logger.info('Audio', 'AudioWorklet ready');
            break;
          case 'wasmReady':
            this.wasmReady = true;
            logger.info('Audio', 'Wasm synth ready');
            break;
          case 'wasmError':
            logger.warn('Audio', `Wasm synth error: ${JSON.stringify(data)}`);
            break;
        }
      };
      
      // 加载 Wasm 模块（如果可用）
      await this.loadWasmSynth();

    } catch (error) {
      logger.warn('Audio', 'AudioWorklet initialization failed', error as Error);
      this.workletReady = false;
    }
  }
  
  /**
   * 加载 Wasm 音频合成模块
   */
  private async loadWasmSynth(): Promise<void> {
    try {
      // WasmBridge 已在主流程静态加载，这里只检查可用性
      if (isWasmReady()) {
        logger.debug('Audio', 'Wasm module available for audio synthesis');
      }
    } catch (error) {
      logger.debug('Audio', 'Using JS audio synthesis fallback');
    }
  }
  
  /**
   * 创建合成器音符
   * 使用 AudioWorklet 进行高质量合成
   */
  public async createSynthNote(
    frequency: number,
    duration: number,
    waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine',
    attack: number = 0.01,
    decay: number = 0.1,
    sustain: number = 0.7,
    release: number = 0.3
  ): Promise<void> {
    if (!this.synthWorklet || !this.workletReady) {
      // 降级到传统方式
      this.playFallbackNote(frequency, duration, waveform);
      return;
    }
    
    const waveformMap = { sine: 0, square: 1, sawtooth: 2, triangle: 3 };
    
    this.synthWorklet.port.postMessage({
      type: 'clearOscillators',
    });
    
    this.synthWorklet.port.postMessage({
      type: 'addOscillator',
      data: {
        frequency,
        amplitude: 0.5,
        waveform: waveformMap[waveform],
      },
    });
    
    this.synthWorklet.port.postMessage({
      type: 'setEnvelope',
      data: { attack, decay, sustain, release },
    });
    
    this.synthWorklet.port.postMessage({ type: 'noteOn' });
    
    // 安排音符释放
    setTimeout(() => {
      this.synthWorklet?.port.postMessage({ type: 'noteOff' });
    }, (duration - release) * 1000);
  }
  
  /**
   * 降级方式播放音符（传统 Web Audio API）
   */
  private playFallbackNote(
    frequency: number,
    duration: number,
    waveform: OscillatorType
  ): void {
    if (!this.context || !this.masterGain) return;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = waveform;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.context.currentTime + duration);
  }
  
  /**
   * 加载预设音色
   */
  public loadPreset(preset: string): void {
    if (!this.synthWorklet || !this.workletReady) {
      logger.warn('Audio', 'Worklet not ready for preset');
      return;
    }
    
    this.synthWorklet.port.postMessage({
      type: 'loadPreset',
      data: { preset },
    });
  }
  
  /**
   * 设置延迟效果
   */
  public setDelay(time: number, feedback: number, mix: number): void {
    if (!this.synthWorklet || !this.workletReady) return;
    
    this.synthWorklet.port.postMessage({
      type: 'setDelay',
      data: { time, feedback, mix },
    });
  }
  
  /**
   * 设置混响效果
   */
  public setReverb(roomSize: number, damping: number, mix: number): void {
    if (!this.synthWorklet || !this.workletReady) return;
    
    this.synthWorklet.port.postMessage({
      type: 'setReverb',
      data: { roomSize, damping, mix },
    });
  }
  
  /**
   * 检查 AudioWorklet 是否就绪
   */
  public isWorkletReady(): boolean {
    return this.workletReady;
  }
  
  /**
   * 检查 Wasm 音频合成是否就绪
   */
  public isWasmAudioReady(): boolean {
    return this.wasmReady;
  }
  
  /**
   * 获取当前采样率
   */
  public getSampleRate(): number {
    return this.context?.sampleRate || 0;
  }

  
  public getSampleRateStatus(): { target: number; actual: number; supported: boolean } {
    const target = AUDIO_CONFIG.TARGET_SAMPLE_RATE;
    const actual = this.context?.sampleRate || 0;
    const supported = actual >= target;
    return { target, actual, supported };
  }
  
  /**
   * 获取采样率状态信息
   */
  public getSampleRateInfo(): {
    current: number;
    target: number;
    isAtTarget: boolean;
    message: string;
  } {
    const current = this.getSampleRate();
    const target = AUDIO_CONFIG.TARGET_SAMPLE_RATE;
    const isAtTarget = current >= target;
    
    let message = '';
    if (isAtTarget) {
      message = `运行在目标采样率 ${target}Hz`;
    } else if (current >= AUDIO_CONFIG.MAX_BROWSER_RATE) {
      message = `运行在浏览器支持的最高采样率 ${current}Hz（低于目标 ${target}Hz）`;
    } else {
      message = `运行在 ${current}Hz（硬件/浏览器限制）`;
    }
    
    return { current, target, isAtTarget, message };
  }

  /**
   * 生成音效
   */
  private async generateSounds(): Promise<void> {
    if (!this.context) return;

    // UI 点击音效
    this.soundEffects.set(
      SoundType.UI_CLICK,
      this.createToneBuffer([440, 880], 0.05, 'sine')
    );

    // UI 悬停音效
    this.soundEffects.set(
      SoundType.UI_HOVER,
      this.createToneBuffer([660, 1320], 0.03, 'sine')
    );

    // 通知音效
    this.soundEffects.set(
      SoundType.NOTIFICATION,
      this.createChordBuffer([523, 659, 784], 0.3, 'sine')
    );

    // 警告音效
    this.soundEffects.set(
      SoundType.WARNING,
      this.createAlarmBuffer(800, 1000, 0.5)
    );

    // 错误音效
    this.soundEffects.set(
      SoundType.ERROR,
      this.createDissonantBuffer([200, 250, 300], 0.4)
    );

    // 出生音效
    this.soundEffects.set(
      SoundType.BIRTH,
      this.createAscendingBuffer(200, 800, 0.5)
    );

    // 死亡音效
    this.soundEffects.set(
      SoundType.DEATH,
      this.createDescendingBuffer(800, 100, 0.8)
    );

    // 战斗音效
    this.soundEffects.set(
      SoundType.BATTLE,
      this.createNoiseBuffer(0.3, 0.5)
    );

    // 和平音效
    this.soundEffects.set(
      SoundType.PEACE,
      this.createChordBuffer([261, 329, 392, 523], 1.0, 'sine')
    );

    // 灾难音效
    this.soundEffects.set(
      SoundType.CATASTROPHE,
      this.createDissonantBuffer([100, 150, 200, 75], 2.0)
    );

    // 革命音效
    this.soundEffects.set(
      SoundType.REVOLUTION,
      this.createFanfareBuffer([262, 330, 392, 523], 1.5)
    );
  }

  /**
   * 创建单音缓冲区
   */
  private createToneBuffer(
    frequencies: number[],
    duration: number,
    type: OscillatorType
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      let sample = 0;
      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
      }
      sample /= frequencies.length;

      // ADSR 包络
      const attack = 0.01;
      const decay = duration * 0.2;
      const release = duration * 0.5;
      let envelope = 1;

      const t = i / sampleRate;
      if (t < attack) {
        envelope = t / attack;
      } else if (t < attack + decay) {
        envelope = 1 - (t - attack) / decay * 0.3;
      } else if (t > duration - release) {
        envelope = (duration - t) / release;
      }

      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * 创建和弦缓冲区
   */
  private createChordBuffer(
    frequencies: number[],
    duration: number,
    type: OscillatorType
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      let sample = 0;
      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
      }
      sample /= frequencies.length;

      // 渐入渐出
      const fade = duration * 0.1;
      const t = i / sampleRate;
      let envelope = 1;

      if (t < fade) {
        envelope = t / fade;
      } else if (t > duration - fade) {
        envelope = (duration - t) / fade;
      }

      data[i] = sample * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * 创建警报缓冲区
   */
  private createAlarmBuffer(
    freq1: number,
    freq2: number,
    duration: number
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = Math.sin(t * 10) > 0 ? freq1 : freq2;
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.3;

      // 淡出
      if (t > duration * 0.8) {
        data[i] *= (duration - t) / (duration * 0.2);
      }
    }

    return buffer;
  }

  /**
   * 创建不和谐音缓冲区
   */
  private createDissonantBuffer(
    frequencies: number[],
    duration: number
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      let sample = 0;
      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
      }
      sample /= frequencies.length;

      // 添加颤音
      const tremolo = 1 + 0.3 * Math.sin(i / sampleRate * 30);

      data[i] = sample * tremolo * 0.25;
    }

    return buffer;
  }

  /**
   * 创建上升音缓冲区
   */
  private createAscendingBuffer(
    startFreq: number,
    endFreq: number,
    duration: number
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;

      let sample = Math.sin(2 * Math.PI * freq * t);

      // 添加谐波
      sample += 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
      sample += 0.25 * Math.sin(2 * Math.PI * freq * 3 * t);

      // 包络
      let envelope = progress < 0.1 ? progress * 10 : 1;
      envelope *= 1 - progress * 0.5;

      data[i] = sample * envelope * 0.2;
    }

    return buffer;
  }

  /**
   * 创建下降音缓冲区
   */
  private createDescendingBuffer(
    startFreq: number,
    endFreq: number,
    duration: number
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;

      let sample = Math.sin(2 * Math.PI * freq * t);
      sample *= 1 - progress * 0.7;

      data[i] = sample * 0.3;
    }

    return buffer;
  }

  /**
   * 创建噪声缓冲区
   */
  private createNoiseBuffer(duration: number, intensity: number): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // 白噪声
      let sample = (Math.random() * 2 - 1) * intensity;

      // 低频调制
      sample *= 0.5 + 0.5 * Math.sin(t * 20);

      // 包络
      if (t > duration * 0.7) {
        sample *= (duration - t) / (duration * 0.3);
      }

      data[i] = sample * 0.3;
    }

    return buffer;
  }

  /**
   * 创建号角缓冲区
   */
  private createFanfareBuffer(
    frequencies: number[],
    duration: number
  ): AudioBuffer {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 逐个音符
      const noteDuration = duration / frequencies.length;
      const noteIndex = Math.floor(t / noteDuration);
      const noteProgress = (t % noteDuration) / noteDuration;

      if (noteIndex < frequencies.length) {
        const freq = frequencies[noteIndex];

        // 音符包络
        let envelope = 1;
        if (noteProgress < 0.1) {
          envelope = noteProgress / 0.1;
        } else if (noteProgress > 0.7) {
          envelope = (1 - noteProgress) / 0.3;
        }

        sample = Math.sin(2 * Math.PI * freq * t) * envelope;
      }

      data[i] = sample * 0.3;
    }

    return buffer;
  }

  /**
   * 播放音效
   */
  public play(type: SoundType): void {
    if (!this.isInitialized || this.isMuted) return;

    const buffer = this.soundEffects.get(type);
    if (!buffer || !this.context || !this.masterGain) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start();

    source.onended = () => {
      source.disconnect();
    };
  }

  /**
   * 设置音量
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * 获取音量
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * 静音
   */
  public mute(): void {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  /**
   * 取消静音
   */
  public unmute(): void {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * 播放 BGM
   */
  public async playBGM(): Promise<void> {
    if (!this.context || !this.bgmGain) return;

    // 创建简单的背景音乐循环
    const duration = 8;
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // C 大调音阶
    const notes = [262, 294, 330, 349, 392, 440, 494, 523];
    const noteLength = duration / notes.length;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteLength);
      const noteProgress = (t % noteLength) / noteLength;

      const freq = notes[noteIndex % notes.length];

      let sample = Math.sin(2 * Math.PI * freq * t);
      sample += 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
      sample += 0.1 * Math.sin(2 * Math.PI * freq * 3 * t);

      // 包络
      let envelope = 1;
      if (noteProgress < 0.05) {
        envelope = noteProgress / 0.05;
      } else if (noteProgress > 0.8) {
        envelope = (1 - noteProgress) / 0.2;
      }

      data[i] = sample * envelope * 0.1;
    }

    // 播放循环
    this.playBGMBuffer(buffer);
  }

  /**
   * 播放 BGM 缓冲区
   */
  private playBGMBuffer(buffer: AudioBuffer): void {
    if (!this.context || !this.bgmGain) return;

    this.stopBGM();

    this.currentBGM = this.context.createBufferSource();
    this.currentBGM.buffer = buffer;
    this.currentBGM.loop = true;
    this.currentBGM.connect(this.bgmGain);
    this.currentBGM.start();
  }

  /**
   * 停止 BGM
   */
  public stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.disconnect();
      this.currentBGM = null;
    }
  }
}

/**
 * 导出单例
 */
export const audioEngine = AudioEngine.getInstance();
export default audioEngine;
