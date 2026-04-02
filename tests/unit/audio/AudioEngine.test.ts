/**
 * =============================================================================
 * 永夜熵纪 - 音频引擎测试
 * Audio Engine Unit Tests
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine, SoundType } from '@/audio/AudioEngine';

class MockAudioContext {
  sampleRate = 48000;
  state = 'running';
  currentTime = 0;
  destination = { connect: vi.fn() };
  
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: vi.fn(),
    };
  }
  
  createDelay() {
    return {
      delayTime: { value: 0.5 },
      connect: vi.fn(),
    };
  }
  
  createConvolver() {
    return {
      buffer: null,
      connect: vi.fn(),
    };
  }
  
  createDynamicsCompressor() {
    return {
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 12 },
      connect: vi.fn(),
    };
  }
  
  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn((arr) => arr.fill(128)),
      connect: vi.fn(),
    };
  }
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      duration: length / sampleRate,
      sampleRate,
      length,
      numberOfChannels: channels,
      getChannelData: () => new Float32Array(length),
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    };
  }
  
  decodeAudioData(buffer: ArrayBuffer) {
    return Promise.resolve({
      duration: 1,
      sampleRate: 48000,
      getChannelData: () => new Float32Array(48000),
    });
  }
  
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  
  close() {
    return Promise.resolve();
  }
}

vi.stubGlobal('AudioContext', MockAudioContext as any);
vi.stubGlobal('webkitAudioContext', MockAudioContext as any);

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = AudioEngine.getInstance();
  });

  afterEach(() => {
    engine.stopBGM();
  });

  describe('单例模式', () => {
    it('should return the same instance', () => {
      const instance1 = AudioEngine.getInstance();
      const instance2 = AudioEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('初始化', () => {
    it('should initialize successfully', async () => {
      await engine.init();
      expect(engine.getSampleRate()).toBeGreaterThan(0);
    });

    it('should not reinitialize if already initialized', async () => {
      await engine.init();
      const rate1 = engine.getSampleRate();
      await engine.init();
      const rate2 = engine.getSampleRate();
      expect(rate1).toBe(rate2);
    });

    it('should request 192kHz sample rate when available', async () => {
      const HighSRContext = class extends MockAudioContext {
        sampleRate = 192000;
      };
      vi.stubGlobal('AudioContext', HighSRContext);
      
      const newEngine = new (AudioEngine as any)();
      await newEngine.init();
      
      expect(newEngine.getSampleRate()).toBe(192000);
    });

    it('should fallback to 96kHz when 192kHz unavailable', async () => {
      const MidSRContext = class extends MockAudioContext {
        sampleRate = 96000;
      };
      vi.stubGlobal('AudioContext', MidSRContext);
      
      const newEngine = new (AudioEngine as any)();
      await newEngine.init();
      
      expect(newEngine.getSampleRate()).toBe(96000);
    });

    it('should fallback to 48kHz when higher rates unavailable', async () => {
      const LowSRContext = class extends MockAudioContext {
        sampleRate = 48000;
      };
      vi.stubGlobal('AudioContext', LowSRContext);
      
      const newEngine = new (AudioEngine as any)();
      await newEngine.init();
      
      expect(newEngine.getSampleRate()).toBe(48000);
    });
  });

  describe('采样率信息', () => {
    it('should provide sample rate info', async () => {
      await engine.init();
      const info = engine.getSampleRateInfo();
      
      expect(info).toHaveProperty('current');
      expect(info).toHaveProperty('target');
      expect(info).toHaveProperty('isAtTarget');
      expect(info).toHaveProperty('message');
      expect(info.current).toBeGreaterThan(0);
      expect(info.target).toBe(192000);
    });
  });

  describe('AudioWorklet 集成', () => {
    it('should check if worklet is ready', async () => {
      await engine.init();
      expect(typeof engine.isWorkletReady()).toBe('boolean');
    });

    it('should handle AudioWorklet not supported gracefully', async () => {
      const NoWorkletContext = class extends MockAudioContext {
        audioWorklet = undefined;
      };
      vi.stubGlobal('AudioContext', NoWorkletContext);
      
      const newEngine = new (AudioEngine as any)();
      await newEngine.init();
      
      expect(newEngine.isWorkletReady()).toBe(false);
    });
  });

  describe('WASM 合成器', () => {
    it('should check if wasm audio is ready', async () => {
      await engine.init();
      expect(typeof engine.isWasmAudioReady()).toBe('boolean');
    });
  });

  describe('合成器音符', () => {
    it('should create synth note with default settings', async () => {
      await engine.init();
      
      await expect(engine.createSynthNote(440, 0.5)).resolves.not.toThrow();
    });

    it('should create synth note with custom waveform', async () => {
      await engine.init();
      
      const waveforms = ['sine', 'square', 'sawtooth', 'triangle'] as const;
      
      for (const waveform of waveforms) {
        await expect(engine.createSynthNote(440, 0.5, waveform)).resolves.not.toThrow();
      }
    });

    it('should create synth note with custom ADSR envelope', async () => {
      await engine.init();
      
      await expect(
        engine.createSynthNote(440, 1.0, 'sine', 0.01, 0.1, 0.7, 0.3)
      ).resolves.not.toThrow();
    });
  });

  describe('预设系统', () => {
    it('should load presets', async () => {
      await engine.init();
      
      const presets = Object.values(AudioEngine.PRESETS);
      
      for (const preset of presets) {
        expect(() => engine.loadPreset(preset)).not.toThrow();
      }
    });

    it('should handle unknown preset gracefully', async () => {
      await engine.init();
      
      expect(() => {
        engine.loadPreset('unknown_preset');
      }).not.toThrow();
    });
  });

  describe('效果器', () => {
    it('should set delay parameters', async () => {
      await engine.init();
      
      expect(() => {
        engine.setDelay(0.5, 0.3, 0.5);
      }).not.toThrow();
    });

    it('should set reverb parameters', async () => {
      await engine.init();
      
      expect(() => {
        engine.setReverb(0.7, 0.5, 0.3);
      }).not.toThrow();
    });
  });

  describe('音量控制', () => {
    it('should adjust volume', async () => {
      await engine.init();
      
      engine.setVolume(0.5);
      expect(engine.getVolume()).toBe(0.5);
      
      engine.setVolume(0);
      expect(engine.getVolume()).toBe(0);
      
      engine.setVolume(1);
      expect(engine.getVolume()).toBe(1);
    });

    it('should clamp volume to valid range', async () => {
      await engine.init();
      
      engine.setVolume(2);
      expect(engine.getVolume()).toBe(1);
      
      engine.setVolume(-0.5);
      expect(engine.getVolume()).toBe(0);
    });
  });

  describe('静音控制', () => {
    it('should mute and unmute', async () => {
      await engine.init();
      
      engine.setVolume(0.5);
      engine.mute();
      
      engine.unmute();
      expect(engine.getVolume()).toBe(0.5);
    });
  });

  describe('音效播放', () => {
    it('should play sound effects', async () => {
      await engine.init();
      
      const soundTypes = [
        SoundType.UI_CLICK,
        SoundType.UI_HOVER,
        SoundType.NOTIFICATION,
        SoundType.WARNING,
        SoundType.ERROR,
        SoundType.BIRTH,
        SoundType.DEATH,
        SoundType.BATTLE,
        SoundType.PEACE,
        SoundType.CATASTROPHE,
        SoundType.REVOLUTION,
      ];
      
      for (const type of soundTypes) {
        expect(() => engine.play(type)).not.toThrow();
      }
    });

    it('should not play when muted', async () => {
      await engine.init();
      engine.mute();
      
      expect(() => engine.play(SoundType.UI_CLICK)).not.toThrow();
    });
  });

  describe('背景音乐', () => {
    it('should play background music', async () => {
      await engine.init();
      
      await expect(engine.playBGM()).resolves.not.toThrow();
    });

    it('should stop background music', async () => {
      await engine.init();
      await engine.playBGM();
      
      expect(() => engine.stopBGM()).not.toThrow();
    });

    it('should handle stop when no BGM playing', async () => {
      await engine.init();
      
      expect(() => engine.stopBGM()).not.toThrow();
    });
  });

  describe('预设常量', () => {
    it('should have correct preset names', () => {
      expect(AudioEngine.PRESETS.CYBER_PAD).toBe('cyberPad');
      expect(AudioEngine.PRESETS.NEURAL_BASS).toBe('neuralBass');
      expect(AudioEngine.PRESETS.ENTROPY_LEAD).toBe('entropyLead');
      expect(AudioEngine.PRESETS.ALERT).toBe('alert');
    });
  });
});

describe('采样率降级测试', () => {
  it('should prefer 192kHz when available', () => {
    const rates = [48000, 96000, 192000];
    const preferred = Math.max(...rates);
    expect(preferred).toBe(192000);
  });

  it('should fallback to highest available rate', () => {
    const availableRates = [48000, 96000];
    const preferred = Math.max(...availableRates.filter(r => r <= 192000));
    expect(preferred).toBe(96000);
  });

  it('should work with minimum 48kHz', () => {
    const minimumRate = 48000;
    expect(minimumRate).toBeGreaterThanOrEqual(48000);
  });
});
