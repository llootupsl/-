/**
 * =============================================================================
 * 永夜熵纪 - AudioWorklet 合成处理器
 * Synthesizer AudioWorklet Processor
 * =============================================================================
 * 
 * 高性能音频处理处理器，运行在独立线程中
 * 集成 Wasm 音频合成模块
 */

/// Wasm 模块实例
let wasmModule: any = null;
let wasmMemory: WebAssembly.Memory | null = null;

/**
 * 合成器处理器类
 * 在独立线程中运行，避免阻塞主线程
 */
class SynthProcessor extends AudioWorkletProcessor {
  private wasmSynth: any = null;
  private sampleRate: number;
  private isActive: boolean = false;
  private outputBuffer: Float32Array;
  private wasmBufferPtr: number = 0;
  
  // 音频参数
  private masterVolume: number = 0.5;
  private oscillators: Array<{
    frequency: number;
    amplitude: number;
    waveform: number;
    phase: number;
  }> = [];
  
  // 滤波器参数
  private filters: Array<{
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    q: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  }> = [];
  
  // ADSR 包络
  private envelope = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.7,
    release: 0.3,
    state: 'idle' as 'idle' | 'attack' | 'decay' | 'sustain' | 'release',
    level: 0,
    releaseStartLevel: 0,
  };
  
  // 延迟效果
  private delayBuffer: Float32Array;
  private delayWriteIndex: number = 0;
  private delayTime: number = 0;
  private delayFeedback: number = 0;
  private delayMix: number = 0;
  
  // Reverb 效果（简化版）
  private reverbBuffers: Float32Array[] = [];
  private reverbIndices: number[] = [];
  private reverbDecays: number[] = [];

  constructor(options: AudioWorkletNodeOptions) {
    super(options);
    
    this.sampleRate = sampleRate;
    this.outputBuffer = new Float32Array(128); // 标准渲染量子大小
    
    // 初始化延迟缓冲区
    const maxDelaySamples = Math.ceil(this.sampleRate * 2); // 最大 2 秒延迟
    this.delayBuffer = new Float32Array(maxDelaySamples);
    
    // 设置消息端口监听
    this.port.onmessage = this.handleMessage.bind(this);
    
    // 通知主线程处理器已就绪
    this.port.postMessage({ type: 'ready', sampleRate: this.sampleRate });
    
    // AudioWorklet 环境：保留 console 调用，因为 Logger 模块在 Worklet 中不可用
    console.log('[SynthProcessor] Initialized at', this.sampleRate, 'Hz');
  }

  /**
   * 处理来自主线程的消息
   */
  private handleMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'initWasm':
        this.initWasm(data.wasmBytes);
        break;
        
      case 'addOscillator':
        this.addOscillator(data.frequency, data.amplitude, data.waveform);
        break;
        
      case 'removeOscillator':
        this.removeOscillator(data.index);
        break;
        
      case 'clearOscillators':
        this.oscillators = [];
        break;
        
      case 'setOscillatorFrequency':
        if (this.oscillators[data.index]) {
          this.oscillators[data.index].frequency = data.frequency;
        }
        break;
        
      case 'addFilter':
        this.addFilter(data.filterType, data.frequency, data.q);
        break;
        
      case 'clearFilters':
        this.filters = [];
        break;
        
      case 'setEnvelope':
        this.envelope.attack = data.attack;
        this.envelope.decay = data.decay;
        this.envelope.sustain = data.sustain;
        this.envelope.release = data.release;
        break;
        
      case 'noteOn':
        this.noteOn();
        break;
        
      case 'noteOff':
        this.noteOff();
        break;
        
      case 'setDelay':
        this.setDelay(data.time, data.feedback, data.mix);
        break;
        
      case 'setReverb':
        this.setReverb(data.roomSize, data.damping, data.mix);
        break;
        
      case 'setMasterVolume':
        this.masterVolume = Math.max(0, Math.min(1, data.volume));
        break;
        
      case 'setActive':
        this.isActive = data.active;
        break;
        
      case 'loadPreset':
        this.loadPreset(data.preset);
        break;
    }
  }

  /**
   * 初始化 Wasm 模块
   */
  private async initWasm(wasmBytes: ArrayBuffer) {
    try {
      const module = await WebAssembly.instantiate(wasmBytes, {
        env: {
          memory: wasmMemory,
          sin: Math.sin,
          cos: Math.cos,
          random: Math.random,
        },
        wbg: {
          // Wasm 绑定桥接
        },
      });
      
      wasmModule = module.instance.exports;
      this.wasmSynth = wasmModule;
      
      this.port.postMessage({ type: 'wasmReady' });
      console.log('[SynthProcessor] Wasm module loaded');
    } catch (error) {
      console.error('[SynthProcessor] Wasm init failed:', error);
      this.port.postMessage({ type: 'wasmError', error: String(error) });
    }
  }

  /**
   * 添加振荡器
   */
  private addOscillator(frequency: number, amplitude: number, waveform: number) {
    this.oscillators.push({
      frequency,
      amplitude,
      waveform, // 0=sine, 1=square, 2=sawtooth, 3=triangle, 4=noise
      phase: 0,
    });
  }

  /**
   * 移除振荡器
   */
  private removeOscillator(index: number) {
    if (index >= 0 && index < this.oscillators.length) {
      this.oscillators.splice(index, 1);
    }
  }

  /**
   * 添加滤波器
   */
  private addFilter(type: 'lowpass' | 'highpass' | 'bandpass', frequency: number, q: number) {
    this.filters.push({
      type,
      frequency,
      q: Math.max(0.1, q),
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    });
  }

  /**
   * 触发音符
   */
  private noteOn() {
    this.envelope.state = 'attack';
    this.envelope.level = 0;
    this.isActive = true;
  }

  /**
   * 释放音符
   */
  private noteOff() {
    this.envelope.state = 'release';
    this.envelope.releaseStartLevel = this.envelope.level;
  }

  /**
   * 设置延迟效果
   */
  private setDelay(time: number, feedback: number, mix: number) {
    this.delayTime = Math.max(0, Math.min(2, time));
    this.delayFeedback = Math.max(0, Math.min(0.99, feedback));
    this.delayMix = Math.max(0, Math.min(1, mix));
  }

  /**
   * 设置混响效果
   */
  private setReverb(roomSize: number, damping: number, mix: number) {
    // 简化的混响：使用多个延迟线
    this.reverbBuffers = [];
    this.reverbIndices = [];
    this.reverbDecays = [];
    
    const delayTimes = [
      0.0297, 0.0371, 0.0411, 0.0437,
      0.0531, 0.0629, 0.0727, 0.0833,
    ];
    
    for (const dt of delayTimes) {
      const adjustedTime = dt * (1 + roomSize);
      const samples = Math.floor(adjustedTime * this.sampleRate);
      this.reverbBuffers.push(new Float32Array(samples));
      this.reverbIndices.push(0);
      this.reverbDecays.push(1 - damping * 0.5);
    }
  }

  /**
   * 加载预设
   */
  private loadPreset(preset: string) {
    this.oscillators = [];
    this.filters = [];
    
    switch (preset) {
      case 'cyberPad':
        this.addOscillator(220, 0.3, 0);
        this.addOscillator(440, 0.2, 2);
        this.addOscillator(880, 0.1, 3);
        this.addFilter('lowpass', 2000, 1.5);
        this.setDelay(0.3, 0.4, 0.3);
        break;
        
      case 'neuralBass':
        this.addOscillator(55, 0.5, 1);
        this.addOscillator(110, 0.3, 2);
        this.addFilter('lowpass', 500, 2.0);
        this.envelope.attack = 0.001;
        this.envelope.decay = 0.1;
        this.envelope.sustain = 0.8;
        this.envelope.release = 0.05;
        break;
        
      case 'entropyLead':
        this.addOscillator(440, 0.3, 0);
        this.addOscillator(442, 0.2, 0); // 轻微失谐
        this.addOscillator(880, 0.15, 1);
        this.addFilter('lowpass', 3000, 1.0);
        this.setDelay(0.25, 0.5, 0.4);
        break;
        
      case 'alert':
        this.addOscillator(880, 0.4, 1);
        this.addOscillator(1320, 0.3, 1);
        this.envelope.attack = 0.001;
        this.envelope.decay = 0.05;
        this.envelope.sustain = 0.5;
        this.envelope.release = 0.1;
        break;
    }
  }

  /**
   * 生成波形样本
   */
  private generateWaveformSample(
    waveform: number,
    phase: number,
    frequency: number
  ): number {
    switch (waveform) {
      case 0: // Sine
        return Math.sin(2 * Math.PI * phase);
        
      case 1: // Square
        return phase < 0.5 ? 1 : -1;
        
      case 2: // Sawtooth
        return 2 * phase - 1;
        
      case 3: // Triangle
        return 4 * Math.abs(phase - 0.5) - 1;
        
      case 4: // Noise
        return Math.random() * 2 - 1;
        
      default:
        return 0;
    }
  }

  /**
   * 更新包络
   */
  private updateEnvelope(): number {
    const attackRate = 1 / (this.envelope.attack * this.sampleRate);
    const decayRate = (1 - this.envelope.sustain) / (this.envelope.decay * this.sampleRate);
    const releaseRate = this.envelope.releaseStartLevel / (this.envelope.release * this.sampleRate);
    
    switch (this.envelope.state) {
      case 'attack':
        this.envelope.level += attackRate;
        if (this.envelope.level >= 1) {
          this.envelope.level = 1;
          this.envelope.state = 'decay';
        }
        break;
        
      case 'decay':
        this.envelope.level -= decayRate;
        if (this.envelope.level <= this.envelope.sustain) {
          this.envelope.level = this.envelope.sustain;
          this.envelope.state = 'sustain';
        }
        break;
        
      case 'sustain':
        this.envelope.level = this.envelope.sustain;
        break;
        
      case 'release':
        this.envelope.level -= releaseRate;
        if (this.envelope.level <= 0) {
          this.envelope.level = 0;
          this.envelope.state = 'idle';
          this.isActive = false;
        }
        break;
    }
    
    return this.envelope.level;
  }

  /**
   * 应用双二阶滤波器
   */
  private applyFilter(sample: number, filter: any): number {
    const omega = 2 * Math.PI * filter.frequency / this.sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * filter.q);
    
    let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
    
    switch (filter.type) {
      case 'lowpass':
        b0 = (1 - cosOmega) / 2;
        b1 = 1 - cosOmega;
        b2 = (1 - cosOmega) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosOmega;
        a2 = 1 - alpha;
        break;
        
      case 'highpass':
        b0 = (1 + cosOmega) / 2;
        b1 = -(1 + cosOmega);
        b2 = (1 + cosOmega) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosOmega;
        a2 = 1 - alpha;
        break;
        
      case 'bandpass':
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * cosOmega;
        a2 = 1 - alpha;
        break;
        
      default:
        return sample;
    }
    
    // 归一化系数
    b0 /= a0; b1 /= a0; b2 /= a0;
    a1 /= a0; a2 /= a0;
    
    // 应用滤波器
    const output = b0 * sample + b1 * filter.x1 + b2 * filter.x2
                 - a1 * filter.y1 - a2 * filter.y2;
    
    // 更新状态
    filter.x2 = filter.x1;
    filter.x1 = sample;
    filter.y2 = filter.y1;
    filter.y1 = output;
    
    return output;
  }

  /**
   * 应用延迟效果
   */
  private applyDelay(sample: number): number {
    if (this.delayTime <= 0 || this.delayMix <= 0) {
      return sample;
    }
    
    const delaySamples = Math.floor(this.delayTime * this.sampleRate);
    const readIndex = (this.delayWriteIndex - delaySamples + this.delayBuffer.length) % this.delayBuffer.length;
    
    const delayed = this.delayBuffer[readIndex];
    const output = sample + delayed * this.delayMix;
    
    this.delayBuffer[this.delayWriteIndex] = sample + delayed * this.delayFeedback;
    this.delayWriteIndex = (this.delayWriteIndex + 1) % this.delayBuffer.length;
    
    return output;
  }

  /**
   * 应用混响效果
   */
  private applyReverb(sample: number): number {
    if (this.reverbBuffers.length === 0) {
      return sample;
    }
    
    let reverbOut = 0;
    
    for (let i = 0; i < this.reverbBuffers.length; i++) {
      const buffer = this.reverbBuffers[i];
      const index = this.reverbIndices[i];
      const decay = this.reverbDecays[i];
      
      reverbOut += buffer[index] * decay;
      buffer[index] = sample + buffer[index] * decay;
      
      this.reverbIndices[i] = (index + 1) % buffer.length;
    }
    
    return sample + reverbOut * 0.125;
  }

  /**
   * 主处理函数
   * 由浏览器音频线程调用
   */
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0];
    const channel = output[0];
    
    if (!channel) return true;
    
    for (let i = 0; i < channel.length; i++) {
      let sample = 0;
      
      // 生成振荡器输出
      for (const osc of this.oscillators) {
        const waveSample = this.generateWaveformSample(osc.waveform, osc.phase, osc.frequency);
        sample += waveSample * osc.amplitude;
        
        // 更新相位
        osc.phase += osc.frequency / this.sampleRate;
        if (osc.phase >= 1) osc.phase -= 1;
      }
      
      // 应用包络
      const envelopeValue = this.updateEnvelope();
      sample *= envelopeValue;
      
      // 应用滤波器
      for (const filter of this.filters) {
        sample = this.applyFilter(sample, filter);
      }
      
      // 应用效果
      sample = this.applyDelay(sample);
      sample = this.applyReverb(sample);
      
      // 主音量和软限幅
      sample *= this.masterVolume;
      sample = Math.tanh(sample);
      
      // 输出到所有声道
      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = sample;
      }
    }
    
    return true; // 保持处理器活跃
  }
}

// 注册处理器
registerProcessor('synth-processor', SynthProcessor);
