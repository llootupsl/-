/**
 * =============================================================================
 * 永夜熵纪 - 空间音频系统
 * Spatial Audio with AudioWorklet
 * 实现3D空间声音、距离衰减、混响效果
 * =============================================================================
 */

import { logger } from '@/core/utils/Logger';

/** 声音类型 */
export enum SoundType {
  /** 环境音 */
  AMBIENT = 'ambient',
  /** 音效 */
  SFX = 'sfx',
  /** 语音 */
  VOICE = 'voice',
  /** 音乐 */
  MUSIC = 'music',
}

/** 声音源 */
export interface AudioSource {
  /** 源ID */
  id: string;
  /** 3D位置 */
  position: { x: number; y: number; z: number };
  /** 速度（用于多普勒效应） */
  velocity: { x: number; y: number; z: number };
  /** 声音类型 */
  type: SoundType;
  /** 音量 */
  volume: number;
  /** 音调 */
  pitch: number;
  /** 是否循环 */
  loop: boolean;
  /** 空间化 */
  spatialized: boolean;
  /** 是否播放 */
  isPlaying: boolean;
  /** AudioBuffer */
  buffer?: AudioBuffer;
  /** AudioBufferSourceNode */
  sourceNode?: AudioBufferSourceNode;
  /** PannerNode */
  pannerNode?: PannerNode;
  /** GainNode */
  gainNode?: GainNode;
}

/** 音频区域 */
export interface AudioZone {
  /** 区域ID */
  id: string;
  /** 区域类型 */
  type: 'reverb' | 'lowpass' | 'highpass' | 'compressor';
  /** 中心点 */
  center: { x: number; y: number; z: number };
  /** 半径 */
  radius: number;
  /** 效果参数 */
  params: Record<string, number>;
}

/** 音频工作线程处理器代码 */
const AUDIO_WORKLET_CODE = `
class SpatialAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.listenerPosition = [0, 0, 0];
    this.listenerOrientation = [0, 0, -1, 0, 1, 0];
    this.distanceModel = 'inverse';
    this.refDistance = 1;
    this.maxDistance = 100;
    this.rolloffFactor = 1;
    this.dopplerFactor = 1;

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'listenerPosition':
        this.listenerPosition = data.position;
        break;
      case 'listenerOrientation':
        this.listenerOrientation = data.orientation;
        break;
      case 'distanceModel':
        this.distanceModel = data.model;
        break;
    }
  }

  calculateDistance(sourcePos) {
    const dx = sourcePos[0] - this.listenerPosition[0];
    const dy = sourcePos[1] - this.listenerPosition[1];
    const dz = sourcePos[2] - this.listenerPosition[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  calculateGain(distance, maxDistance, refDistance, rolloff, model) {
    if (distance >= maxDistance) return 0;
    
    switch (model) {
      case 'linear':
        return 1 - Math.min(distance, maxDistance) / maxDistance;
      case 'exponential':
        return Math.exp(-rolloff * distance);
      case 'inverse':
      default:
        return refDistance / (refDistance + rolloff * Math.max(distance - refDistance, 0));
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const input = inputs[0];

    if (!input || !input[0]) {
      return true;
    }

    // Copy input to output (actual processing would be done in-place)
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      if (inputChannel && outputChannel) {
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }
    }

    return true;
  }
}

registerProcessor('spatial-audio-processor', SpatialAudioProcessor);
`;

/** 空间音频系统 */
export class SpatialAudioSystem {
  private audioContext: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sources: Map<string, AudioSource> = new Map();
  private zones: Map<string, AudioZone> = new Map();
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;
  private listenerPosition = { x: 0, y: 0, z: 0 };
  private listenerOrientation = { forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } };

  /**
   * 初始化音频系统
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // 创建音频上下文
    this.audioContext = new AudioContext({
      sampleRate: 48000,
      latencyHint: 'interactive',
    });

    // 创建监听器
    this.listener = this.audioContext.listener;

    // 创建主增益节点
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;

    // 创建压缩器
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;

    // 创建分析器
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // 加载AudioWorklet
    try {
      const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      this.workletNode = new AudioWorkletNode(this.audioContext, 'spatial-audio-processor');
    } catch (error) {
      logger.warn('Audio', 'AudioWorklet not supported, using fallback');
    }

    // 生成混响脉冲响应
    await this.createReverbImpulse();

    // 连接节点链
    this.masterGain.connect(this.compressorNode);
    this.compressorNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    if (this.reverbNode) {
      this.masterGain.connect(this.reverbNode);
      this.reverbNode.connect(this.compressorNode);
    }

    this.isInitialized = true;
    logger.info('Audio', 'Spatial audio system initialized');
  }

  /**
   * 生成混响脉冲响应
   */
  private async createReverbImpulse(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 3; // 3秒混响
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-3 * i / length);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = impulse;
  }

  /**
   * 创建音频源
   */
  public async createSource(
    id: string,
    url: string,
    type: SoundType,
    options: Partial<{
      volume: number;
      pitch: number;
      loop: boolean;
      spatialized: boolean;
    }> = {}
  ): Promise<AudioSource | null> {
    if (!this.audioContext || !this.masterGain) {
      await this.init();
    }

    try {
      // 加载音频文件
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

      const source: AudioSource = {
        id,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        type,
        volume: options.volume ?? 1.0,
        pitch: options.pitch ?? 1.0,
        loop: options.loop ?? false,
        spatialized: options.spatialized ?? (type !== SoundType.MUSIC),
        isPlaying: false,
        buffer: audioBuffer,
      };

      // 创建节点
      this.setupSourceNodes(source);

      this.sources.set(id, source);
      logger.debug('Audio', `Created audio source: ${id}`);
    } catch (error) {
      logger.error('Audio', `Failed to create source ${id}`, error as Error);
      return null;
    }
  }

  /**
   * 创建合成声音源
   */
  public createSynthSource(
    id: string,
    type: SoundType,
    options: {
      frequency: number;
      waveform?: OscillatorType;
      volume?: number;
      spatialized?: boolean;
    }
  ): AudioSource | null {
    if (!this.audioContext || !this.masterGain) return null;

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = options.waveform ?? 'sine';
    oscillator.frequency.value = options.frequency;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.volume ?? 0.5;

    if (options.spatialized ?? true) {
      const pannerNode = this.audioContext.createPanner();
      this.configurePanner(pannerNode);
      oscillator.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(this.masterGain);
    } else {
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
    }

    const source: AudioSource = {
      id,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      type,
      volume: options.volume ?? 0.5,
      pitch: 1.0,
      loop: true,
      spatialized: options.spatialized ?? false,
      isPlaying: false,
      sourceNode: undefined, // Will be set by start/stop
    };

    this.sources.set(id, source);
    return source;
  }

  /**
   * 设置音频源节点
   */
  private setupSourceNodes(source: AudioSource): void {
    if (!this.audioContext || !this.masterGain) return;

    source.sourceNode = this.audioContext.createBufferSource();
    source.sourceNode.buffer = source.buffer;
    source.sourceNode.loop = source.loop;
    source.sourceNode.playbackRate.value = source.pitch;

    source.gainNode = this.audioContext.createGain();
    source.gainNode.gain.value = source.volume;

    if (source.spatialized) {
      source.pannerNode = this.audioContext.createPanner();
      this.configurePanner(source.pannerNode);
      source.pannerNode.positionX.value = source.position.x;
      source.pannerNode.positionY.value = source.position.y;
      source.pannerNode.positionZ.value = source.position.z;

      source.sourceNode.connect(source.gainNode);
      source.gainNode.connect(source.pannerNode);
      source.pannerNode.connect(this.masterGain);
    } else {
      source.sourceNode.connect(source.gainNode);
      source.gainNode.connect(this.masterGain);
    }
  }

  /**
   * 配置3D音频参数
   */
  private configurePanner(panner: PannerNode): void {
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;
  }

  /**
   * 播放声音
   */
  public play(id: string): void {
    const source = this.sources.get(id);
    if (!source || source.isPlaying) return;

    if (source.buffer) {
      // Buffer source
      if (source.sourceNode && source.gainNode) {
        source.sourceNode.start();
        source.isPlaying = true;
      }
    }
  }

  /**
   * 停止声音
   */
  public stop(id: string): void {
    const source = this.sources.get(id);
    if (!source || !source.isPlaying) return;

    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
      } catch (e) {
        // Already stopped
      }
      source.isPlaying = false;
    }
  }

  /**
   * 更新监听器位置
   */
  public updateListener(
    position: { x: number; y: number; z: number },
    orientation?: { forward: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }
  ): void {
    this.listenerPosition = position;

    if (this.listener) {
      if (this.listener.positionX) {
        this.listener.positionX.value = position.x;
        this.listener.positionY.value = position.y;
        this.listener.positionZ.value = position.z;
      }

      if (orientation && this.listener.forwardX) {
        this.listener.forwardX.value = orientation.forward.x;
        this.listener.forwardY.value = orientation.forward.y;
        this.listener.forwardZ.value = orientation.forward.z;
        this.listener.upX.value = orientation.up.x;
        this.listener.upY.value = orientation.up.y;
        this.listener.upZ.value = orientation.up.z;
      }
    }

    // 更新所有空间化音频源
    for (const source of this.sources.values()) {
      if (source.spatialized && source.pannerNode) {
        source.pannerNode.positionX.value = source.position.x;
        source.pannerNode.positionY.value = source.position.y;
        source.pannerNode.positionZ.value = source.position.z;
      }
    }

    // 发送消息到worklet
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'listenerPosition',
        position: [position.x, position.y, position.z],
      });
    }
  }

  /**
   * 更新音频源位置
   */
  public updateSourcePosition(
    id: string,
    position: { x: number; y: number; z: number },
    velocity?: { x: number; y: number; z: number }
  ): void {
    const source = this.sources.get(id);
    if (!source) return;

    source.position = position;
    if (velocity) {
      source.velocity = velocity;
    }

    if (source.pannerNode) {
      source.pannerNode.positionX.value = position.x;
      source.pannerNode.positionY.value = position.y;
      source.pannerNode.positionZ.value = position.z;
    }
  }

  /**
   * 设置音量
   */
  public setVolume(id: string, volume: number): void {
    const source = this.sources.get(id);
    if (!source || !source.gainNode) return;

    source.volume = Math.max(0, Math.min(1, volume));
    source.gainNode.gain.value = source.volume;
  }

  /**
   * 设置音调
   */
  public setPitch(id: string, pitch: number): void {
    const source = this.sources.get(id);
    if (!source || !source.sourceNode) return;

    source.pitch = pitch;
    source.sourceNode.playbackRate.value = pitch;
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置混响
   */
  public setReverb(mix: number): void {
    if (this.reverbNode && this.masterGain) {
      this.reverbNode.connect(this.compressorNode!);
      this.masterGain.gain.value = 1 - mix * 0.5;
    }
  }

  /**
   * 创建音频区域
   */
  public createZone(
    id: string,
    type: AudioZone['type'],
    center: { x: number; y: number; z: number },
    radius: number,
    params: Record<string, number> = {}
  ): AudioZone {
    const zone: AudioZone = {
      id,
      type,
      center,
      radius,
      params,
    };
    this.zones.set(id, zone);
    return zone;
  }

  /**
   * 获取频谱数据
   */
  public getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null;

    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  /**
   * 获取波形数据
   */
  public getWaveformData(): Uint8Array | null {
    if (!this.analyserNode) return null;

    const data = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  /**
   * 获取所有音频源
   */
  public getAllSources(): AudioSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * 删除音频源
   */
  public removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      if (source.isPlaying) {
        this.stop(id);
      }
      this.sources.delete(id);
    }
  }

  /**
   * 暂停所有声音
   */
  public pauseAll(): void {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }

  /**
   * 恢复所有声音
   */
  public resumeAll(): void {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    for (const source of this.sources.values()) {
      this.removeSource(source.id);
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.isInitialized = false;
  }
}

/** 内置音效合成器 */
export class SoundSynthesizer {
  private audioContext: AudioContext | null = null;

  constructor() {}

  public init(audioContext: AudioContext): void {
    this.audioContext = audioContext;
  }

  /**
   * 生成点击音效
   */
  public synthesizeClick(volume: number = 0.5): OscillatorNode | null {
    if (!this.audioContext) return null;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    return osc;
  }

  /**
   * 生成环境音
   */
  public synthesizeAmbient(type: 'wind' | 'rain' | 'fire' | 'birds'): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        switch (type) {
          case 'wind':
            data[i] = (Math.random() * 2 - 1) * 0.1;
            if (i > 0) data[i] = data[i] * 0.9 + data[i - 1] * 0.1;
            break;
          case 'rain':
            data[i] = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.8 : data[i - 1] * 0.95;
            break;
          case 'fire':
            data[i] = (Math.random() * 2 - 1) * 0.05;
            if (i > 0) data[i] += data[i - 1] * 0.3;
            break;
          case 'birds':
            data[i] = 0;
            if (Math.random() < 0.0001) {
              const freq = 2000 + Math.random() * 2000;
              for (let j = 0; j < 1000 && i + j < bufferSize; j++) {
                data[i + j] += Math.sin(j * freq / this.audioContext!.sampleRate) * 0.2 * (1 - j / 1000);
              }
            }
            break;
        }
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    return source;
  }

  /**
   * 生成UI音效
   */
  public synthesizeUISound(type: 'click' | 'hover' | 'success' | 'error'): OscillatorNode | null {
    if (!this.audioContext) return null;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        break;
      case 'hover':
        osc.type = 'sine';
        osc.frequency.value = 500;
        gain.gain.setValueAtTime(0.1, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        break;
      case 'success':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.setValueAtTime(659, now + 0.1); // E5
        osc.frequency.setValueAtTime(784, now + 0.2); // G5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        break;
    }

    return osc;
  }
}

// 导出单例
export const spatialAudio = new SpatialAudioSystem();
export const soundSynth = new SoundSynthesizer();
export default { spatialAudio, soundSynth };
