/**
 * =============================================================================
 * useSoundFeedback Hook - 音效反馈系统
 * 为用户交互提供音效反馈（可配置开关）
 * =============================================================================
 */

import { useCallback, useRef, useEffect } from 'react';
import { logger } from '@/core/utils/Logger';

export type SoundType = 'click' | 'success' | 'error' | 'warning' | 'hover' | 'toggle' | 'notification';

export interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  click: { frequency: 800, duration: 50, type: 'sine', volume: 0.1 },
  success: { frequency: 880, duration: 150, type: 'sine', volume: 0.15 },
  error: { frequency: 220, duration: 200, type: 'square', volume: 0.12 },
  warning: { frequency: 440, duration: 100, type: 'triangle', volume: 0.12 },
  hover: { frequency: 1200, duration: 30, type: 'sine', volume: 0.05 },
  toggle: { frequency: 660, duration: 60, type: 'sine', volume: 0.1 },
  notification: { frequency: 523, duration: 120, type: 'sine', volume: 0.15 },
};

export interface UseSoundFeedbackOptions {
  enabled?: boolean;
  volume?: number;
}

export interface UseSoundFeedbackReturn {
  playSound: (type: SoundType) => void;
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playWarning: () => void;
  playHover: () => void;
  playToggle: () => void;
  playNotification: () => void;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function useSoundFeedback(options: UseSoundFeedbackOptions = {}): UseSoundFeedbackReturn {
  const { enabled = true, volume = 1 } = options;
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!enabled) return;

      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const config = SOUND_CONFIGS[type];
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

        const finalVolume = config.volume * volume;
        gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration / 1000);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration / 1000);
      } catch (error) {
        logger.warn('SoundFeedback', 'Sound playback failed', error as Error);
      }
    },
    [enabled, volume]
  );

  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playWarning = useCallback(() => playSound('warning'), [playSound]);
  const playHover = useCallback(() => playSound('hover'), [playSound]);
  const playToggle = useCallback(() => playSound('toggle'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);

  return {
    playSound,
    playClick,
    playSuccess,
    playError,
    playWarning,
    playHover,
    playToggle,
    playNotification,
  };
}

export default useSoundFeedback;
